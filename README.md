# Lumixly — Deployment Guide

## Overview
- **Frontend**: Next.js → Vercel (free)
- **Database + Auth + Storage**: Supabase (free tier)
- **Payments**: Stripe
- **Image Processing**: FastAPI → Render.com (free tier)

---

## Step 1 — Supabase Setup (10 min)

1. Go to **https://supabase.com** → New project
2. Note your **Project URL** and **anon key** (Settings → API)
3. Go to **SQL Editor** → paste contents of `supabase_schema.sql` → Run
4. Go to **Authentication → Email** → enable email confirmations (optional)

---

## Step 2 — Stripe Setup (10 min)

1. Go to **https://stripe.com** → create account
2. Go to **Products** → Add product:
   - **Starter**: £19/month recurring → copy Price ID
   - **Pro**: £49/month recurring → copy Price ID
3. Go to **Developers → API Keys** → copy publishable + secret key
4. Go to **Developers → Webhooks** → Add endpoint:
   - URL: `https://lumixly.vercel.app/api/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.deleted`
   - Copy webhook secret

---

## Step 3 — Deploy Processing Backend to Render (15 min)

1. Create GitHub repo and push the `processing_backend/` folder
2. Go to **https://render.com** → New Web Service → connect repo
3. Set environment variables:
   ```
   PROCESSING_API_SECRET = any-random-string-you-choose
   ```
4. Deploy — note the URL (e.g. `https://lumixly-api.onrender.com`)

---

## Step 4 — Deploy Frontend to Vercel (10 min)

1. Create GitHub repo and push the main `lumixly/` folder
2. Go to **https://vercel.com** → New Project → import repo
3. Add environment variables (from `.env.example`):
   ```
   NEXT_PUBLIC_SUPABASE_URL         = your supabase url
   NEXT_PUBLIC_SUPABASE_ANON_KEY    = your supabase anon key
   SUPABASE_SERVICE_ROLE_KEY        = your supabase service role key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_live_xxx
   STRIPE_SECRET_KEY                = sk_live_xxx
   STRIPE_WEBHOOK_SECRET            = whsec_xxx
   STRIPE_STARTER_PRICE_ID          = price_xxx
   STRIPE_PRO_PRICE_ID              = price_xxx
   PROCESSING_API_URL               = https://lumixly-api.onrender.com
   PROCESSING_API_SECRET            = same-secret-as-render
   NEXT_PUBLIC_APP_URL              = https://lumixly.vercel.app
   ```
4. Deploy!

---

## Your Pricing Model

| Plan    | Monthly | Images included | Extra images |
|---------|---------|----------------|--------------|
| Free    | £0      | 10             | —            |
| Starter | £19     | 100            | £0.40 each   |
| Pro     | £49     | 500            | £0.25 each   |

**Example revenue:**
- 50 Starter customers = £950/month
- 20 Pro customers = £980/month
- Total = **£1,930/month** passive income

---

## File Structure

```
lumixly/
├── app/
│   ├── page.tsx              ← Landing page
│   ├── auth/
│   │   ├── login/page.tsx    ← Login
│   │   └── signup/page.tsx   ← Signup
│   ├── dashboard/page.tsx    ← User dashboard
│   ├── upload/page.tsx       ← Photo upload
│   ├── orders/[id]/page.tsx  ← Order status + download
│   ├── billing/page.tsx      ← Upgrade plan
│   └── api/
│       ├── stripe/route.ts   ← Stripe checkout
│       ├── webhook/route.ts  ← Stripe webhooks
│       ├── process/route.ts  ← Trigger processing
│       └── orders/route.ts   ← Order completion callback
├── lib/
│   ├── supabase.ts           ← Supabase client
│   └── stripe.ts             ← Stripe client + plans
├── supabase_schema.sql       ← Run in Supabase SQL editor
└── processing_backend/
    ├── main.py               ← FastAPI processing server
    ├── requirements.txt
    └── render.yaml           ← Render.com config
```

---

## Support
For help deploying, open a chat with Claude and paste any error messages.
# trigger
