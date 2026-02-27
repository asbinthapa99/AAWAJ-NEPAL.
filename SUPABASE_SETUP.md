# Supabase Setup Guide - Complete Checklist

This guide covers ALL the SQL and configuration needed for GuffGaff.

## 📋 Step-by-Step Setup

### Step 1: Database Schema (REQUIRED)

If this is a **new database**, run this file:
```sql
supabase/schema.sql
```

If you already have data, run this instead:
```sql
supabase/migration.sql
```

**How to run:**
1. Go to Supabase Dashboard
2. Click "SQL Editor" in sidebar
3. Click "New Query"
4. Copy/paste the SQL file content
5. Click "Run"

**What it does:**
- ✅ Creates all tables (profiles, posts, comments, supports, reports)
- ✅ Sets up Row Level Security (RLS) policies
- ✅ Creates indexes for fast queries
- ✅ Adds email column to profiles
- ✅ Creates triggers for auto-counting
- ✅ Sets up profile auto-creation on signup

---

### Step 2: Storage Buckets (REQUIRED)

Run this file:
```sql
supabase/storage-setup.sql
```

**What it does:**
- ✅ Creates `post-images` bucket (public, 5MB limit)
- ✅ Creates `avatars` bucket (public, 2MB limit)
- ✅ Sets up storage policies (users can only edit their own files)
- ✅ Allows JPEG, PNG, GIF, WebP formats

**Alternative (Dashboard method):**
1. Go to Storage in sidebar
2. Click "New bucket"
3. Name: `post-images`, Public: ON, File size limit: 5MB
4. Click "New bucket" again
5. Name: `avatars`, Public: ON, File size limit: 2MB

---

### Step 3: Authentication Settings (REQUIRED)

Follow the checklist in:
```
supabase/auth-config.md
```

**Quick Setup:**
1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Toggle ON: **Enable Email OTP**

4. Go to **Authentication** → **Settings**
5. Under "Email Auth":
   - Choose: Enable email confirmations (YES for production, NO for testing)
   
6. Under "URL Configuration":
   - Site URL: `https://aawaj-nepal.vercel.app` (your domain)
   - Add Redirect URLs:
     - `https://aawaj-nepal.vercel.app/**`
     - `http://localhost:3000/**`

---

### Step 4: Email Templates (OPTIONAL)

Go to **Authentication** → **Email Templates**

Customize these templates:
- **Confirm signup** - Verification email with OTP
- **Magic Link** - Login code email
- **Reset Password** - Password reset link

Templates use variables like:
- `{{ .Token }}` - 6-digit OTP code
- `{{ .ConfirmationURL }}` - Clickable verification link
- `{{ .Email }}` - User's email

---

### Step 5: Verify Everything Works

Run these test queries in SQL Editor:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check storage buckets
SELECT * FROM storage.buckets;

-- Check profiles table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles';

-- Check if triggers exist
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public';
```

**Expected results:**
- ✅ Tables: profiles, posts, comments, supports, reports
- ✅ Buckets: post-images, avatars
- ✅ Profiles columns: id, username, email, full_name, avatar_url, bio, district, created_at
- ✅ Triggers: on_auth_user_created, on_support_added, on_support_removed, etc.

---

## 🧪 Testing Checklist

After setup, test these features:

### Account Creation
- [ ] User can sign up with email
- [ ] User receives 6-digit OTP code in email
- [ ] User can verify email with code
- [ ] Profile is auto-created in database
- [ ] Username is unique (can't use same username twice)

### Login
- [ ] User can login with email + password
- [ ] User can login with username + password
- [ ] User can login with email OTP (passwordless)
- [ ] "Forgot password" sends reset email
- [ ] Password reset page works

### Posts
- [ ] User can create post
- [ ] Image uploads to storage
- [ ] Post shows location/district
- [ ] Support button works
- [ ] Comments work

### Storage
- [ ] Images are publicly viewable
- [ ] User can only delete their own images
- [ ] File size limits enforced

---

## 🚨 Common Issues & Fixes

### Issue: "Email not confirmed" error
**Fix:** Go to Authentication → Settings → Disable "Enable email confirmations"

### Issue: Images not uploading
**Fix:** 
1. Check storage buckets exist
2. Run `storage-setup.sql` file
3. Check file size < 5MB
4. Check file format is JPEG/PNG/GIF/WebP

### Issue: Username already taken (but shouldn't be)
**Fix:**
```sql
SELECT username, COUNT(*) 
FROM profiles 
GROUP BY username 
HAVING COUNT(*) > 1;
```
If duplicates found, manually fix them.

### Issue: OTP emails not sending
**Fix:**
1. Check SMTP settings (or use default)
2. Check email in spam folder
3. Wait 1-2 minutes (can be slow in development)
4. Check rate limit (max 3-4 emails/hour)

### Issue: Trigger not working
**Fix:** Re-run the trigger creation:
```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

## 📊 Database Statistics

After users start signing up, monitor these:

```sql
-- User count
SELECT COUNT(*) as total_users FROM profiles;

-- Post count by category
SELECT category, COUNT(*) as count 
FROM posts 
GROUP BY category 
ORDER BY count DESC;

-- Most active districts
SELECT district, COUNT(*) as posts 
FROM posts 
WHERE district IS NOT NULL 
GROUP BY district 
ORDER BY posts DESC 
LIMIT 10;

-- Storage usage
SELECT 
  bucket_id,
  COUNT(*) as files,
  pg_size_pretty(SUM(size)::bigint) as total_size
FROM storage.objects
GROUP BY bucket_id;
```

---

## 📚 Files Reference

- `supabase/schema.sql` - Full database schema (for new databases)
- `supabase/migration.sql` - Updates for existing databases
- `supabase/storage-setup.sql` - Storage buckets and policies
- `supabase/auth-config.md` - Authentication configuration guide
- `PHONE_AUTH_SETUP.md` - Phone authentication guide (optional, paid)

---

## ✅ You're Done!

After completing all steps:
1. ✅ Database tables created
2. ✅ Storage buckets configured
3. ✅ Authentication enabled
4. ✅ Email OTP working
5. ✅ All features tested

Your app is ready for production! 🚀

**Next Steps:**
- Deploy to Vercel (already done)
- Add custom domain (optional)
- Set up monitoring
- Add analytics (optional)

Need help? Check the official docs:
- Supabase: https://supabase.com/docs
- Next.js: https://nextjs.org/docs
