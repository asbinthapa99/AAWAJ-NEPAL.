'use client';

import { useState, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, CheckCircle, Mail, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

function VerifyEmailContent() {
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState('');
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const handleResendLink = async () => {
    if (!email) {
      setError('Email not found. Please sign up again.');
      return;
    }

    setResending(true);
    setError('');

    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });

    if (error) {
      setError(error.message);
    } else {
      setResent(true);
    }
    setResending(false);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/20">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
            Check Your Email
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            We sent a verification link to
          </p>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {email || 'your email'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm space-y-6">
          {error && (
            <div className="px-4 py-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl text-sm">
              {error}
            </div>
          )}

          {resent && (
            <div className="px-4 py-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              New verification link sent! Check your inbox.
            </div>
          )}

          {/* Instructions */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">1</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Open the email from <span className="font-medium text-gray-900 dark:text-white">Awaaz Nepal</span> in your inbox
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">2</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Click the <span className="font-medium text-gray-900 dark:text-white">verification link</span> in the email
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">3</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You&apos;ll be automatically signed in and redirected
              </p>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-1">
              💡 Don&apos;t forget to check your <span className="font-medium">spam/junk</span> folder
            </p>
          </div>

          <div className="text-center space-y-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Didn&apos;t receive the email?
            </p>
            <button
              onClick={handleResendLink}
              disabled={resending}
              className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline disabled:opacity-50"
            >
              {resending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Sending...
                </>
              ) : (
                'Resend Verification Link'
              )}
            </button>
          </div>

          <div className="flex items-center justify-center gap-4 pt-2">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 font-medium hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              Back to Sign In
            </Link>
          </div>
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
