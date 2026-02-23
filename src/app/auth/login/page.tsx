'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Lock, User, Eye, EyeOff, Loader2, Megaphone } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export default function LoginPage() {
  const { user } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingOTP, setLoadingOTP] = useState(false);
  const [loadingOAuth, setLoadingOAuth] = useState(false);
  const [error, setError] = useState('');
  const [isHuman, setIsHuman] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const handleOAuth = async (provider: 'google') => {
    setLoadingOAuth(true);
    setError('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setLoadingOAuth(false);
    }
  };

  const handleLoginWithCode = async () => {
    if (!identifier.trim()) {
      setError('Please enter your email');
      return;
    }

    setError('');
    setLoadingOTP(true);

    const supabase = createClient();
    let loginEmail = identifier.trim();

    if (!loginEmail.includes('@')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', loginEmail.toLowerCase())
        .single();

      if (!profile || !profile.email) {
        setError('No account found with that username.');
        setLoadingOTP(false);
        return;
      }

      loginEmail = profile.email;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: loginEmail,
    });

    if (error) {
      setError(error.message);
      setLoadingOTP(false);
    } else {
      router.push(`/auth/verify-email?email=${encodeURIComponent(loginEmail)}`);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    let loginEmail = identifier.trim();

    if (!loginEmail.includes('@')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', loginEmail.toLowerCase())
        .single();

      if (!profile || !profile.email) {
        setError('No account found with that username.');
        setLoading(false);
        return;
      }

      loginEmail = profile.email;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });

    if (error) {
      if (error.message === 'Invalid login credentials') {
        setError('Invalid email/username or password. If you just signed up, please verify your email first.');
      } else if (error.message === 'Email not confirmed') {
        setError('Please check your inbox and verify your email before signing in.');
      } else {
        setError(error.message);
      }
      setLoading(false);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] dark:bg-[#18191a] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-[980px] flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-16">
        {/* Left: Branding */}
        <div className="flex-1 text-center md:text-left md:pt-10 max-w-md">
          <div className="flex items-center gap-3 justify-center md:justify-start mb-4">
            <div className="w-14 h-14 bg-[#1877F2] rounded-full flex items-center justify-center">
              <Megaphone className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-[42px] font-bold text-[#1877F2] leading-none">
              Awaaz Nepal
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-gray-700 dark:text-[#b0b3b8] font-normal leading-snug">
            Raise your voice. Connect with citizens. Make Nepal better, together.
          </p>
        </div>

        {/* Right: Login Form */}
        <div className="w-full max-w-[396px]">
          <div className="bg-white dark:bg-[#242526] rounded-lg p-4 shadow-lg space-y-3">
            {error && (
              <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3">
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Email or username"
                required
                className="w-full px-4 py-3.5 bg-white dark:bg-[#3a3b3c] border border-gray-300 dark:border-[#555] rounded-md text-[17px] outline-none text-gray-900 dark:text-[#e4e6eb] placeholder-gray-500 dark:placeholder-[#b0b3b8] focus:border-[#1877F2] focus:ring-1 focus:ring-[#1877F2] transition-colors"
              />

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="w-full px-4 py-3.5 pr-12 bg-white dark:bg-[#3a3b3c] border border-gray-300 dark:border-[#555] rounded-md text-[17px] outline-none text-gray-900 dark:text-[#e4e6eb] placeholder-gray-500 dark:placeholder-[#b0b3b8] focus:border-[#1877F2] focus:ring-1 focus:ring-[#1877F2] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-[#e4e6eb]"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <div className="flex items-center gap-3 py-2 px-3 bg-[#f0f2f5] dark:bg-[#3a3b3c] rounded-md">
                <input
                  type="checkbox"
                  id="human-check"
                  checked={isHuman}
                  onChange={(e) => setIsHuman(e.target.checked)}
                  className="w-5 h-5 rounded cursor-pointer accent-[#1877F2]"
                />
                <label htmlFor="human-check" className="text-sm text-gray-700 dark:text-[#e4e6eb] cursor-pointer flex-1">
                  I am human
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || loadingOTP || !isHuman}
                className="w-full py-3 bg-[#1877F2] text-white rounded-md text-xl font-bold hover:bg-[#166FE5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                Log In
              </button>
            </form>

            <div className="text-center">
              <Link
                href="/auth/forgot-password"
                className="text-sm text-[#1877F2] hover:underline"
              >
                Forgotten password?
              </Link>
            </div>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-[#393a3b]"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white dark:bg-[#242526] text-gray-500 dark:text-[#b0b3b8]">or</span>
              </div>
            </div>

            {/* Google OAuth */}
            <button
              type="button"
              onClick={() => handleOAuth('google')}
              disabled={loadingOAuth || loading}
              className="w-full flex items-center justify-center gap-3 py-3 bg-white dark:bg-[#3a3b3c] border border-gray-300 dark:border-[#555] rounded-md text-[15px] font-semibold text-gray-700 dark:text-[#e4e6eb] hover:bg-gray-50 dark:hover:bg-[#4e4f50] transition-colors disabled:opacity-50"
            >
              {loadingOAuth ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              Continue with Google
            </button>

            <button
              type="button"
              onClick={handleLoginWithCode}
              disabled={loading || loadingOTP}
              className="w-full py-3 bg-white dark:bg-[#3a3b3c] border border-gray-300 dark:border-[#555] rounded-md text-[15px] font-semibold text-gray-700 dark:text-[#e4e6eb] hover:bg-gray-50 dark:hover:bg-[#4e4f50] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loadingOTP && <Loader2 className="w-4 h-4 animate-spin" />}
              {loadingOTP ? 'Sending...' : 'Sign in with email link'}
            </button>

            <div className="pt-2 border-t border-gray-200 dark:border-[#393a3b] mt-2">
              <Link
                href="/auth/register"
                className="block w-full text-center py-3 bg-[#42b72a] text-white rounded-md text-[17px] font-bold hover:bg-[#36a420] transition-colors"
              >
                Create New Account
              </Link>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 dark:text-[#b0b3b8] mt-6">
            <Link href="/privacy" className="hover:underline">Privacy</Link>
            {' · '}
            <Link href="/terms" className="hover:underline">Terms</Link>
            {' · '}
            <Link href="/about" className="hover:underline">About</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
