'use client';

import { useState, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, CheckCircle, Mail, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

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
          <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Mail className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground">
            Check Your Email
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            We sent a verification link to
          </p>
          <p className="text-sm font-semibold text-foreground">
            {email || 'your email'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-xl p-6 border border-border shadow-sm space-y-6">
          {error && <Alert variant="error">{error}</Alert>}

          {resent && (
            <Alert variant="success">
              New verification link sent! Check your inbox.
            </Alert>
          )}

          {/* Instructions */}
          <div className="space-y-4">
            {[
              <>Open the email from <span className="font-medium text-foreground">GuffGaff</span> in your inbox</>,
              <>Click the <span className="font-medium text-foreground">verification link</span> in the email</>,
              <>You&apos;ll be automatically signed in and redirected</>,
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">{i + 1}</span>
                </div>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-xs text-muted-foreground text-center mb-1">
              💡 Don&apos;t forget to check your <span className="font-medium">spam/junk</span> folder
            </p>
          </div>

          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Didn&apos;t receive the email?
            </p>
            <button
              onClick={handleResendLink}
              disabled={resending}
              className="inline-flex items-center gap-2 text-sm text-primary font-medium hover:underline disabled:opacity-50 focus-ring rounded"
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
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground font-medium hover:text-foreground transition-colors focus-ring rounded"
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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
