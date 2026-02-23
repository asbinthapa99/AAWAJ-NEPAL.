-- ============================================================
-- AUTHENTICATION SETTINGS
-- Configure in Supabase Dashboard > Authentication
-- ============================================================

-- These settings cannot be set via SQL - use the Supabase Dashboard
-- Path: Authentication > Settings

-- ============================================================
-- 1. EMAIL SETTINGS
-- ============================================================

-- ✅ Enable Email Provider
-- Path: Authentication > Providers > Email
-- Toggle: ON

-- ✅ Enable Email OTP (One-Time Password)
-- Path: Authentication > Providers > Email
-- Toggle ON: "Enable Email OTP"
-- This allows users to login with 6-digit codes

-- ⚠️ IMPORTANT: Email Confirmation
-- Path: Authentication > Settings > Email Auth
-- Option: "Enable email confirmations"
-- 
-- Choose ONE:
-- A) DISABLE for instant signup (no verification needed)
-- B) ENABLE to require email verification before login
--
-- Current app implementation: Works with BOTH modes
-- - If DISABLED: Users sign up and login immediately
-- - If ENABLED: Users get OTP code to verify email first

-- ============================================================
-- 2. EMAIL TEMPLATES (Optional Customization)
-- ============================================================

-- Path: Authentication > Email Templates

-- Template: "Confirm signup" (if email confirmation enabled)
-- Subject: Welcome to Awaaz Nepal - Verify Your Email
-- Body (example):
--
-- <h2>Welcome to Awaaz Nepal!</h2>
-- <p>Your verification code is:</p>
-- <h1 style="font-size: 32px; letter-spacing: 5px;">{{ .Token }}</h1>
-- <p>Or click here to verify: <a href="{{ .ConfirmationURL }}">Verify Email</a></p>
-- <p>This code expires in 1 hour.</p>


-- Template: "Magic Link" (for OTP login)
-- Subject: Your Awaaz Nepal Login Code
-- Body (example):
--
-- <h2>Your Login Code</h2>
-- <p>Use this code to sign in to Awaaz Nepal:</p>
-- <h1 style="font-size: 32px; letter-spacing: 5px;">{{ .Token }}</h1>
-- <p>Or click here: <a href="{{ .ConfirmationURL }}">Sign In</a></p>
-- <p>This code expires in 1 hour.</p>


-- Template: "Reset Password"
-- Subject: Reset Your Awaaz Nepal Password
-- Body (example):
--
-- <h2>Reset Your Password</h2>
-- <p>Click the link below to reset your password:</p>
-- <p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
-- <p>This link expires in 1 hour.</p>
-- <p>If you didn't request this, you can safely ignore this email.</p>

-- ============================================================
-- 3. SITE URL CONFIGURATION
-- ============================================================

-- Path: Authentication > URL Configuration

-- Site URL: https://aawaj-nepal-moii.vercel.app
-- (or your production domain)

-- Redirect URLs (add all these):
-- https://aawaj-nepal-moii.vercel.app/**
-- http://localhost:3000/**
-- https://aawaj-nepal-moii.vercel.app/auth/callback
-- https://aawaj-nepal-moii.vercel.app/auth/reset-password
-- https://aawaj-nepal-moii.vercel.app/auth/verify-email

-- ============================================================
-- 4. SECURITY SETTINGS
-- ============================================================

-- Path: Authentication > Settings

-- ✅ Enable Anonymous Sign-ins: OFF
-- ✅ Enable Manual Linking: OFF
-- ✅ Disable Signup: OFF (allow signups)
-- ✅ Enable Phone Sign-ups: OFF (requires SMS provider - see PHONE_AUTH_SETUP.md)

-- Password Requirements:
-- Minimum Length: 6 characters
-- (You can increase this in the dashboard if needed)

-- JWT Settings:
-- JWT Expiry: 3600 (1 hour)
-- Refresh Token Expiry: 2592000 (30 days)

-- ============================================================
-- 5. RATE LIMITING (IMPORTANT FOR SECURITY)
-- ============================================================

-- Supabase automatically rate limits:
-- - Email sending: 3-4 emails per hour per user
-- - OTP attempts: 5 attempts per hour
-- - Password reset: 3 requests per hour

-- No configuration needed - built-in protection

-- ============================================================
-- 6. SMTP SETTINGS (Optional - Custom Email)
-- ============================================================

-- By default, Supabase sends emails via their service (FREE)
-- For production, you may want custom SMTP:

-- Path: Authentication > Settings > SMTP Settings

-- Example with Gmail:
-- Host: smtp.gmail.com
-- Port: 587
-- Username: your-email@gmail.com
-- Password: your-app-password
-- Sender email: noreply@awaaznepal.com
-- Sender name: Awaaz Nepal

-- ⚠️ Note: Custom SMTP is optional. Default works fine.

-- ============================================================
-- VERIFICATION CHECKLIST
-- ============================================================

-- After configuration, test these:
-- □ User can sign up with email
-- □ User receives OTP code in email
-- □ User can verify email with 6-digit code
-- □ User can login with email + password
-- □ User can login with email OTP (passwordless)
-- □ User can login with username + password
-- □ User can reset password
-- □ User receives password reset email
-- □ Images upload to post-images bucket
-- □ Uploaded images are publicly viewable

-- ============================================================
-- NEED HELP?
-- ============================================================

-- Supabase Documentation:
-- - Auth: https://supabase.com/docs/guides/auth
-- - Storage: https://supabase.com/docs/guides/storage
-- - Email: https://supabase.com/docs/guides/auth/auth-email
-- - OTP: https://supabase.com/docs/guides/auth/auth-email-otp

-- For phone authentication setup, see:
-- /awaaz-nepal/PHONE_AUTH_SETUP.md
