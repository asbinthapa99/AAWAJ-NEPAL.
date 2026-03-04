'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Mail, Lock, User, Eye, EyeOff, Loader2, Megaphone, MapPin, ArrowRight, CheckCircle2, Shield, Users, Globe } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { districts } from '@/lib/categories';
import { useAuth } from '@/components/AuthProvider';
import { Alert } from '@/components/ui/Alert';

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
      setError('An account with this email already exists. Please sign in instead.');
      setLoading(false);
    } else {
      router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center bg-card rounded-2xl p-10 shadow-xl border border-border max-w-md w-full">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Account Created! 🎉</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Welcome to GuffGaff! We sent a verification email to your inbox. Please verify your email, then sign in.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center gap-2 mt-6 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/25 focus-ring"
          >
            Go to Sign In <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const inputClass = "w-full pl-10 pr-4 py-3 bg-background border border-input rounded-xl text-sm outline-none text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/20 transition-all duration-200 shadow-sm";

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Hero (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[42%] relative overflow-hidden flex-col justify-between p-12"
        style={{
          background: 'linear-gradient(135deg, hsl(217 91% 42%) 0%, hsl(217 91% 30%) 50%, hsl(240 60% 20%) 100%)',
        }}
      >
        <div className="absolute top-[-80px] left-[-80px] w-[400px] h-[400px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, hsl(217 91% 70%), transparent)' }} />
        <div className="absolute bottom-[-100px] right-[-60px] w-[500px] h-[500px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, hsl(142 71% 60%), transparent)' }} />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/30">
            <Megaphone className="w-5 h-5 text-white" />
          </div>
          <span className="text-white text-xl font-bold tracking-tight">GuffGaff</span>
        </div>

        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-white/80 text-xs font-medium backdrop-blur-sm">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Join the community today
            </div>
            <h1 className="text-4xl font-bold text-white leading-tight tracking-tight">
              Your voice<br />
              <span className="text-blue-200">matters here.</span>
            </h1>
            <p className="text-white/60 text-base leading-relaxed max-w-sm">
              Create your account and start raising civic issues, connecting with citizens, and shaping Nepal.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {[
              { icon: <Shield className="w-4 h-4" />, text: 'Verified civic community' },
              { icon: <Users className="w-4 h-4" />, text: 'Citizens across all 77 districts' },
              { icon: <Globe className="w-4 h-4" />, text: 'Nepali & English supported' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-white/70 text-sm">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center border border-white/15 shrink-0">
                  {f.icon}
                </div>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-white/30 text-xs">© 2026 GuffGaff · Made with ❤️ for Nepal</p>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-10 bg-background overflow-y-auto">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-6">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
            <Megaphone className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">GuffGaff</span>
        </div>

        <div className="w-full max-w-[460px]">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Create an account</h2>
            <p className="text-muted-foreground text-sm mt-1">It&apos;s quick and easy.</p>
          </div>

          {error && (
            <div className="mb-4">
              <Alert variant="error">{error}</Alert>
            </div>
          )}

          {/* Google OAuth */}
          <button
            type="button"
            onClick={() => handleOAuth('google')}
            disabled={loadingOAuth || loading}
            className="w-full flex items-center justify-center gap-3 py-3 bg-card border border-border rounded-xl text-sm font-semibold text-foreground hover:bg-accent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-ring shadow-sm hover:shadow-md mb-5"
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

          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-background text-xs text-muted-foreground">or register with email</span>
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Name + Username row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ram Bahadur"
                    required
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Username</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="ramb"
                    required
                    className="w-full pl-8 pr-4 py-3 bg-background border border-input rounded-xl text-sm outline-none text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/20 transition-all duration-200 shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className={inputClass}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  className="w-full pl-10 pr-11 py-3 bg-background border border-input rounded-xl text-sm outline-none text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/20 transition-all duration-200 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* District */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">
                District <span className="text-muted-foreground normal-case font-normal">(optional)</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className={`${inputClass} appearance-none`}
                >
                  <option value="">Select your district</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 active:scale-[0.99] transition-all duration-200 disabled:opacity-60 shadow-lg shadow-emerald-500/20 focus-ring mt-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-center text-xs text-muted-foreground pt-1">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary font-semibold hover:underline">
                Sign In
              </Link>
            </p>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6 space-x-3">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <span>·</span>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <span>·</span>
            <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
