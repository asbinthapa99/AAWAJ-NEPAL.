import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Secure OTP store with encryption and automatic cleanup
interface OtpEntry {
  hashedCode: string;
  salt: string;
  expiresAt: number;
  attempts: number;
  lastAccess: number;
}

const otpStore = new Map<string, OtpEntry>();
const CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 3;

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of otpStore.entries()) {
    if (now > data.expiresAt || data.attempts >= MAX_ATTEMPTS) {
      otpStore.delete(email);
    }
  }
}, CLEANUP_INTERVAL);

// Hash OTP code for secure storage
function hashOtp(code: string, salt: string): string {
  return crypto.pbkdf2Sync(code, salt, 10000, 64, 'sha512').toString('hex');
}

// Generate secure random salt
function generateSalt(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function getOtpStore() {
  return otpStore;
}

export async function POST(request: NextRequest) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { email } = body;
  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  // Generate 6-digit OTP
  const code = crypto.randomInt(100000, 999999).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  const salt = generateSalt();
  const hashedCode = hashOtp(code, salt);

  // Store OTP securely
  otpStore.set(email.toLowerCase(), {
    hashedCode,
    salt,
    expiresAt,
    attempts: 0,
    lastAccess: Date.now()
  });

  // Send via Brevo SMTP
  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.BREVO_SMTP_USER,
      pass: process.env.BREVO_SMTP_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: `"${process.env.BREVO_SENDER_NAME || 'Awaaz Nepal'}" <${process.env.BREVO_SENDER_EMAIL}>`,
      to: email,
      subject: 'Your Awaaz Nepal verification code',
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1f2937;">Verify your email</h2>
          <p style="color: #6b7280;">Your verification code is:</p>
          <div style="background: #eff6ff; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #3b82f6;">${code}</span>
          </div>
          <p style="color: #9ca3af; font-size: 13px;">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    console.error('Failed to send OTP email:', e);
    return NextResponse.json(
      { error: 'Failed to send verification email' },
      { status: 500 }
    );
  }
}
