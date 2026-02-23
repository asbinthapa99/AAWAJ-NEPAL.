'use client';

import { useState, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Megaphone, CheckCircle, Mail } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

function VerifyEmailContent() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resending, setResending] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value[0];
    }

    if (!/^\d*$/.test(value)) {
      return;
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (index === 5 && value) {
      const fullCode = newCode.join('');
      if (fullCode.length === 6) {
        handleVerify(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
    if (pastedData.length === 6) {
      const newCode = pastedData.split('');
      setCode(newCode);
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (codeString?: string) => {
    const verificationCode = codeString || code.join('');
    
    if (verificationCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email: email,
      token: verificationCode,
      type: 'email',
    });

    if (error) {
      setError(error.message === 'Token has expired or is invalid' 
        ? 'Invalid or expired code. Please request a new one.' 
        : error.message);
      setLoading(false);
      setCode(['', '', '', '', '', '']);
      document.getElementById('code-0')?.focus();
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 2000);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      setError('Email not found. Please sign up again.');
      return;
    }

    setResending(true);
    setError('');

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email,
    });

    if (error) {
      setError(error.message);
    } else {
      setError('');
      alert('New verification code sent to your email!');
    }
    setResending(false);
  };

  if (success) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="text-center bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 max-w-md w-full">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Email Verified! 🎉
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Your account is now active. Redirecting you to home...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/20">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
            Verify Your Email
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            We sent a 6-digit code to
          </p>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {email || 'your email'}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm space-y-6">
          {error && (
            <div className="px-4 py-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* OTP Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 text-center">
              Enter 6-Digit Code
            </label>
            <div className="flex gap-2 justify-center">
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="w-12 h-14 text-center text-2xl font-bold bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl outline-none transition-colors text-gray-900 dark:text-white"
                />
              ))}
            </div>
          </div>

          <button
            onClick={() => handleVerify()}
            disabled={loading || code.join('').length !== 6}
            className="w-full py-3 bg-gradient-to-r from-red-500 to-blue-600 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Didn&apos;t receive the code?
            </p>
            <button
              onClick={handleResendCode}
              disabled={resending}
              className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline disabled:opacity-50"
            >
              {resending ? 'Sending...' : 'Resend Code'}
            </button>
          </div>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            <Link
              href="/auth/login"
              className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
            >
              Back to Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-orange-600" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
