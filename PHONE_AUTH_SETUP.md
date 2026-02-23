# Phone Number Authentication Setup Guide

## Overview
This document explains how to add phone number signup/login to Awaaz Nepal and the associated costs.

## ⚠️ Important: Phone Auth is NOT Free

Unfortunately, **there is no completely free way** to implement phone number verification with OTP codes. Here's why:

### Why Phone Auth Costs Money
- SMS delivery requires telecom provider integration
- Each SMS sent costs money (typically $0.01-0.05 per message)
- Anti-spam and security measures require paid services

## Option 1: Supabase Phone Auth (Recommended)

Supabase has built-in phone authentication, but requires an SMS provider.

### Supported SMS Providers & Costs

1. **Twilio** (Most Popular)
   - Cost: ~$0.0075 per SMS in Nepal
   - Setup: Requires paid account
   - Free tier: $15 credit (gets ~2,000 messages)
   - [Signup](https://www.twilio.com/try-twilio)

2. **MessageBird**
   - Cost: ~$0.02 per SMS  
   - Free tier: €10 credit (~500 messages)
   - [Signup](https://messagebird.com)

3. **Vonage (Nexmo)**
   - Cost: ~$0.01 per SMS
   - Free tier: €2 credit (~200 messages)

### Setup Steps with Twilio (Example)

1. **Sign up for Twilio**
   - Go to https://www.twilio.com/try-twilio
   - Get free $15 credit
   - Get your Account SID and Auth Token

2. **Configure Supabase**
   - Go to Supabase Dashboard → Authentication → Providers
   - Enable "Phone" provider
   - Select "Twilio" as SMS provider
   - Enter your Twilio credentials:
     - Account SID
     - Auth Token
     - Phone Number (your Twilio number)

3. **Update Code**
   
   Add phone signup to `register/page.tsx`:
   ```tsx
   const { error } = await supabase.auth.signUp({
     phone: '+977' + phoneNumber, // Nepal country code
     password: password,
     options: {
       data: {
         username: username,
         full_name: fullName,
       }
     }
   });
   ```

   Add phone verification:
   ```tsx
   const { error } = await supabase.auth.verifyOtp({
     phone: '+977' + phoneNumber,
     token: otpCode,
     type: 'sms'
   });
   ```

4. **Database Update**
   ```sql
   -- Add phone to profiles table
   ALTER TABLE profiles ADD COLUMN phone TEXT;
   
   -- Update trigger to save phone
   CREATE OR REPLACE FUNCTION handle_new_user()
   RETURNS TRIGGER AS $$
   DECLARE
     v_username TEXT;
   BEGIN
     v_username := COALESCE(
       NULLIF(NEW.raw_user_meta_data->>'username', ''),
       'user_' || SUBSTR(NEW.id::TEXT, 1, 8)
     );
     
     INSERT INTO profiles (id, username, email, phone, full_name, district)
     VALUES (
       NEW.id,
       v_username,
       NEW.email,
       NEW.phone, -- Add this
       COALESCE(
         NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
         'User'
       ),
       NEW.raw_user_meta_data->>'district'
     );
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   ```

## Option 2: Free Alternatives (Limited)

### A) Test Mode Only
- Use Supabase in development mode
- Phone numbers starting with +91 123456 work without SMS
- ⚠️ **Cannot be used in production**

### B) Email-to-SMS Gateways (Unreliable)
- Some carriers offer email-to-SMS (e.g., number@carrier.com)
- Very unreliable, often blocked
- ⚠️ **Not recommended for production**

## Option 3: Hybrid Approach (Cost-Effective)

**Keep email as primary + Optional phone for notifications**

Current setup:
- Users sign up with email (FREE)
- Get verification email (FREE)
- Optionally add phone number to profile
- Use phone only for important notifications (reduces SMS costs)

Benefits:
- Main auth is free
- Only pay for critical notifications
- Users can recover account via email

## Recommendation

For Awaaz Nepal, I recommend:

1. **Keep current email authentication** (it's working and FREE)
2. **Add optional phone field** to user profiles
3. **For production**: Set up Twilio with paid account if phone verification is essential
4. **Start small**: Use Twilio's $15 free credit to test with real users first

## Cost Estimation

If you get 1,000 signups per month:
- **Email only**: FREE ✅
- **Phone verification**: ~$7-50/month depending on provider

## Current Status

✅ Email authentication is fully implemented and FREE
✅ Users can reset passwords via email
✅ All 77 districts supported
✅ Posts show location/district
⚠️ Phone auth requires paid SMS provider (no free option)

## Next Steps

If you want to proceed with phone authentication:
1. Choose an SMS provider (Twilio recommended)
2. Sign up and get API credentials  
3. Use the free credit for testing
4. I can implement the phone signup/login pages
5. Configure Supabase with your SMS provider

Let me know if you'd like help setting this up!
