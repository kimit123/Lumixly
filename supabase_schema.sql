-- ============================================================
-- LUMIXLY v3 — Manual Workflow (Pixelz-style)
-- Run this in Supabase SQL Editor
-- ============================================================

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id                     uuid references auth.users(id) on delete cascade primary key,
  full_name              text,
  email                  text,
  role                   text default 'customer', -- 'customer', 'team', 'admin'
  plan                   text default 'free',
  credits_used           int  default 0,
  credits_limit          int  default 10,
  stripe_customer_id     text,
  stripe_subscription_id text,
  created_at             timestamptz default now(),
  updated_at             timestamptz default now()
);

-- Orders
create table if not exists public.orders (
  id                uuid primary key default gen_random_uuid(),
  customer_id       uuid references auth.users(id),
  assigned_to       uuid references auth.users(id), -- team member
  status            text default 'pending',
  -- Status flow: pending → in_progress → ready_for_review → revision_requested → completed
  service_type      text, -- 'headless', 'full_body', 'background_only', 'product', etc.
  image_count       int  default 0,
  notes             text, -- customer instructions
  admin_notes       text, -- internal notes
  original_urls     text[] default '{}', -- uploaded by customer
  completed_urls    text[] default '{}', -- uploaded by admin/team
  customer_feedback text, -- on review
  revision_count    int  default 0,
  price             numeric(10,2),
  created_at        timestamptz default now(),
  updated_at        timestamptz default now(),
  completed_at      timestamptz
);

-- Order messages (customer ↔ admin chat)
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid references public.orders(id) on delete cascade,
  sender_id  uuid references auth.users(id),
  role       text, -- 'customer' or 'admin' or 'team'
  content    text not null,
  created_at timestamptz default now()
);

-- Notifications
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade,
  order_id   uuid references public.orders(id),
  type       text, -- 'order_ready', 'revision_requested', 'order_completed', 'new_order'
  message    text,
  read       boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role, plan, credits_limit)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'customer'),
    'free',
    10
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- RLS POLICIES
-- ============================================================
alter table public.profiles     enable row level security;
alter table public.orders       enable row level security;
alter table public.messages     enable row level security;
alter table public.notifications enable row level security;

-- Profiles: users can read own, admin can read all
create policy "Users read own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Admin reads all profiles"
  on profiles for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Orders: customer sees own, team sees assigned, admin sees all
create policy "Customer reads own orders"
  on orders for select using (auth.uid() = customer_id);

create policy "Customer creates orders"
  on orders for insert with check (auth.uid() = customer_id);

create policy "Customer updates own orders (feedback)"
  on orders for update using (auth.uid() = customer_id);

create policy "Team reads assigned orders"
  on orders for select using (auth.uid() = assigned_to);

create policy "Team updates assigned orders"
  on orders for update using (auth.uid() = assigned_to);

create policy "Admin full access orders"
  on orders for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Messages
create policy "Order participants read messages"
  on messages for select using (
    exists (select 1 from orders where id = order_id and (customer_id = auth.uid() or assigned_to = auth.uid()))
    or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Participants send messages"
  on messages for insert with check (auth.uid() = sender_id);

-- Notifications
create policy "Users read own notifications"
  on notifications for select using (auth.uid() = user_id);

create policy "Users update own notifications"
  on notifications for update using (auth.uid() = user_id);

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
insert into storage.buckets (id, name, public) values ('originals', 'originals', false) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('completed', 'completed', true) on conflict do nothing;

-- Storage policies
create policy "Customer uploads originals"
  on storage.objects for insert
  with check (bucket_id = 'originals' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Admin downloads originals"
  on storage.objects for select
  using (bucket_id = 'originals' and (
    auth.uid()::text = (storage.foldername(name))[1]
    or exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'team'))
  ));

create policy "Admin uploads completed"
  on storage.objects for insert
  with check (bucket_id = 'completed' and (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'team'))
  ));

create policy "Completed files are public"
  on storage.objects for select
  using (bucket_id = 'completed');

-- ============================================================
-- HELPER FUNCTION: Create admin user
-- After running this schema, manually create your admin account
-- in Supabase Auth, then run:
-- UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
-- ============================================================
