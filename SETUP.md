# Lumixly v3 Setup Guide

## The Pixelz Workflow
1. Customer signs up → uploads photos → places order
2. Admin downloads original photos → processes with desktop app
3. Admin uploads completed photos back
4. Customer reviews → approves or requests revision
5. Done!

## Setup Steps

### 1. Supabase
1. Create project at supabase.com
2. Go to SQL Editor → run supabase_schema.sql
3. Go to Settings → API → copy URL and keys

### 2. Make yourself Admin
After creating your account on the website, run this in Supabase SQL Editor:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

### 3. Deploy to Vercel
Add these environment variables:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY  
- SUPABASE_SERVICE_ROLE_KEY
- NEXT_PUBLIC_APP_URL = https://lumixly.vercel.app

### 4. Create Team Members
Go to /admin/team → Add Team Member
Team members can download originals and upload completed photos.

## User Roles
- **customer** — can upload photos, place orders, review and approve
- **team** — can download originals and upload completed photos
- **admin** — full access to everything

## No Processing API Needed!
This version is fully manual — admin downloads photos, 
processes with the desktop app, uploads results back.
Zero server costs for processing!
