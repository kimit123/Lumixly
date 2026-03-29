-- Run this in Supabase SQL editor

-- Profiles table (extends auth.users)
create table if not exists public.profiles (
  id                      uuid references auth.users(id) primary key,
  full_name               text,
  plan                    text default 'free',
  credits_used            int  default 0,
  credits_limit           int  default 10,
  stripe_customer_id      text,
  stripe_subscription_id  text,
  created_at              timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, plan, credits_limit)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'plan', 'free'),
    10
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Orders table
create table if not exists public.orders (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id),
  status          text default 'pending',
  image_count     int  default 0,
  crop_type       text,
  output_urls     text[] default '{}',
  error_message   text,
  created_at      timestamptz default now(),
  completed_at    timestamptz
);

-- Increment credits function
create or replace function increment_credits(user_id uuid, amount int)
returns void as $$
begin
  update public.profiles
  set credits_used = credits_used + amount
  where id = user_id;
end;
$$ language plpgsql security definer;

-- RLS policies
alter table public.profiles enable row level security;
alter table public.orders   enable row level security;

create policy "Users can read own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can read own orders"
  on orders for select using (auth.uid() = user_id);

create policy "Users can create orders"
  on orders for insert with check (auth.uid() = user_id);

-- Storage buckets
insert into storage.buckets (id, name, public) values ('uploads', 'uploads', false) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('outputs', 'outputs', true)  on conflict do nothing;

-- Storage policies
create policy "Users can upload own files"
  on storage.objects for insert
  with check (bucket_id = 'uploads' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Outputs are public"
  on storage.objects for select
  using (bucket_id = 'outputs');
