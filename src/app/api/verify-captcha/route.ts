import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No captcha token provided' },
        { status: 400 }
      );
    }

    const response = await fetch('https://hcaptcha.com/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: process.env.HCAPTCHA_SECRET_KEY || '',
        response: token,
      }),
    });

    const data = await response.json();

    return NextResponse.json({
      success: data.success,
      error: data['error-codes']?.[0] || null,
    });
  } catch (error) {
    console.error('Captcha verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify captcha' },
      { status: 500 }
    );
  }
}
