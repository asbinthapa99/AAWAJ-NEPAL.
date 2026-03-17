import { NextRequest, NextResponse } from 'next/server';
import { getOtpStore } from '../send-otp/route';
import crypto from 'crypto';

// Hash OTP code for verification (same as in send-otp)
function hashOtp(code: string, salt: string): string {
  return crypto.pbkdf2Sync(code, salt, 10000, 64, 'sha512').toString('hex');
}

export async function POST(request: NextRequest) {
  let body: { email?: string; code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { email, code } = body;
  if (!email || !code) {
    return NextResponse.json({ error: 'Email and code are required' }, { status: 400 });
  }

  const otpStore = getOtpStore();
  const stored = otpStore.get(email.toLowerCase());

  if (!stored) {
    return NextResponse.json({ error: 'No verification code found. Please request a new one.' }, { status: 400 });
  }

  if (Date.now() > stored.expiresAt) {
    otpStore.delete(email.toLowerCase());
    return NextResponse.json({ error: 'Code has expired. Please request a new one.' }, { status: 400 });
  }

  if (stored.attempts >= 3) {
    otpStore.delete(email.toLowerCase());
    return NextResponse.json({ error: 'Too many failed attempts. Please request a new code.' }, { status: 400 });
  }

  // Verify the hashed code
  const hashedInput = hashOtp(code, stored.salt);
  if (hashedInput !== stored.hashedCode) {
    stored.attempts++;
    stored.lastAccess = Date.now();
    
    if (stored.attempts >= 3) {
      otpStore.delete(email.toLowerCase());
      return NextResponse.json({ error: 'Too many failed attempts. Please request a new code.' }, { status: 400 });
    }
    
    return NextResponse.json({ error: `Invalid code. ${3 - stored.attempts} attempts remaining.` }, { status: 400 });
  }

  // OTP verified — clean up
  otpStore.delete(email.toLowerCase());

  return NextResponse.json({ verified: true });
}
