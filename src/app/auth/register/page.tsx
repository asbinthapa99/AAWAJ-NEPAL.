'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Mail, Lock, User, Eye, EyeOff, Loader2, Megaphone, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { districts } from '@/lib/categories';
import { useAuth } from '@/components/AuthProvider';

export default function RegisterPage() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [district, setDistrict] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingOAuth, setLoadingOAuth] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      setLoading(false);
      return;
    }

    const supabase = createClient();

    // Check if username is already taken
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.toLowerCase())
      .single();

    if (existingUser) {
      setError('This username is already taken. Please choose a different one.');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          username: username.toLowerCase(),
          full_name: fullName,
          district,
        },
      },
    });

    if (error) {
      let errorMsg = 'Failed to create account. ';
      
      if (error.message) {
        if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('already been registered')) {
          errorMsg = 'An account with this email already exists. Please sign in instead.';
        } else {
          errorMsg += error.message;
        }
      } else {
        errorMsg += 'Please check your input and try again.';
      }
      
      console.error('Signup error:', error);
      setError(errorMsg);
      setLoading(false);
    } else if (data?.user && !data.user.identities?.length) {
      // Supabase returns a user with no identities when email already exists
      setError('An account with this email already exists. Please sign in instead.');
      setLoading(false);
    } else {
      // Redirect to check-email page (Supabase sends confirmation link automatically)
      router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
    }
  };

  if (success) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="text-center bg-white dark:bg-[#242526] rounded-lg p-8 shadow-lg max-w-md w-full">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Megaphone className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-[#e4e6eb] mb-2">
            Account Created! 🎉
          </h2>
          <p className="text-sm text-gray-500 dark:text-[#b0b3b8]">
            Welcome to Awaaz Nepal! We sent a verification email to your inbox. Please verify your email, then sign in.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 mt-4 px-6 py-2.5 bg-[#1877F2] text-white rounded-lg text-sm font-semibold hover:bg-[#166FE5] transition-colors"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] dark:bg-[#18191a] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-[480px]">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-[#1877F2] rounded-full flex items-center justify-center mx-auto mb-3">
            <Megaphone className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-[28px] font-bold text-gray-900 dark:text-[#e4e6eb]">
            Create a New Account
          </h1>
          <p className="text-[15px] text-gray-500 dark:text-[#b0b3b8] mt-1">
            It&apos;s quick and easy.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleRegister}
          className="bg-white dark:bg-[#242526] rounded-lg p-5 shadow-lg space-y-3"
        >
          {error && (
            <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* OAuth Buttons */}
          <button
            type="button"
            onClick={() => handleOAuth('google')}
            disabled={loadingOAuth || loading}
            className="w-full flex items-center justify-center gap-3 py-3 bg-white dark:bg-[#3a3b3c] border border-gray-300 dark:border-[#555] rounded-md text-[15px] font-semibold text-gray-700 dark:text-[#e4e6eb] hover:bg-gray-50 dark:hover:bg-[#4e4f50] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingOAuth ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            Continue with Google
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white dark:bg-[#242526] text-gray-500 dark:text-[#b0b3b8]">Or register with email</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[#e4e6eb] mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ram Bahadur"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#3a3b3c] border border-gray-300 dark:border-[#555] rounded-md text-[15px] outline-none text-gray-900 dark:text-[#e4e6eb] placeholder-gray-500 dark:placeholder-[#b0b3b8] focus:border-[#1877F2] focus:ring-1 focus:ring-[#1877F2] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[#e4e6eb] mb-1.5">
                Username
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="ramb"
                  required
                  className="w-full pl-8 pr-4 py-3 bg-white dark:bg-[#3a3b3c] border border-gray-300 dark:border-[#555] rounded-md text-[15px] outline-none text-gray-900 dark:text-[#e4e6eb] placeholder-gray-500 dark:placeholder-[#b0b3b8] focus:border-[#1877F2] focus:ring-1 focus:ring-[#1877F2] transition-colors"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[#e4e6eb] mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#3a3b3c] border border-gray-300 dark:border-[#555] rounded-md text-[15px] outline-none text-gray-900 dark:text-[#e4e6eb] placeholder-gray-500 dark:placeholder-[#b0b3b8] focus:border-[#1877F2] focus:ring-1 focus:ring-[#1877F2] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[#e4e6eb] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                required
                className="w-full pl-10 pr-12 py-3 bg-white dark:bg-[#3a3b3c] border border-gray-300 dark:border-[#555] rounded-md text-[15px] outline-none text-gray-900 dark:text-[#e4e6eb] placeholder-gray-500 dark:placeholder-[#b0b3b8] focus:border-[#1877F2] focus:ring-1 focus:ring-[#1877F2] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[#e4e6eb] mb-1.5">
              District (Optional)
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#3a3b3c] border border-gray-300 dark:border-[#555] rounded-md text-[15px] outline-none text-gray-900 dark:text-[#e4e6eb] appearance-none focus:border-[#1877F2] focus:ring-1 focus:ring-[#1877F2] transition-colors"
              >
                <option value="">Select your district</option>
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 py-2.5 px-3 bg-[#f0f2f5] dark:bg-[#3a3b3c] rounded-md">
            <input
              type="checkbox"
              id="human-check-register"
              checked={isHuman}
              onChange={(e) => setIsHuman(e.target.checked)}
              className="w-5 h-5 rounded cursor-pointer accent-[#1877F2]"
            />
            <label htmlFor="human-check-register" className="text-sm text-gray-700 dark:text-[#e4e6eb] cursor-pointer flex-1">
              I am human
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !isHuman}
            className="w-full py-3 bg-[#42b72a] text-white rounded-md text-[17px] font-bold hover:bg-[#36a420] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Account
          </button>

          <p className="text-center text-sm text-gray-500 dark:text-[#b0b3b8]">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="text-[#1877F2] font-medium hover:underline"
            >
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
