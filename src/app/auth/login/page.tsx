'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Megaphone, ArrowRight, Shield, Users, Globe } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Alert } from '@/components/ui/Alert';

/* ─── Peeking Guy SVG Character ─── */
function PeekerIcon({ watching }: { watching: boolean }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className="w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Body / torso — peeks up from bottom */}
      <g style={{
        transform: watching ? 'translateY(0px)' : 'translateY(10px)',
        transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {/* Shirt */}
        <ellipse cx="32" cy="58" rx="16" ry="10" fill="#3b82f6" />
        {/* Neck */}
        <rect x="27" y="46" width="10" height="10" rx="4" fill="#fbbf24" />
        {/* Head */}
        <circle cx="32" cy="36" r="15" fill="#fbbf24" />
        {/* Ears */}
        <circle cx="17" cy="36" r="4" fill="#fbbf24" />
        <circle cx="47" cy="36" r="4" fill="#fbbf24" />
        {/* Hair */}
        <path
          d="M18 28 Q32 16 46 28 Q44 20 32 18 Q20 20 18 28Z"
          fill="#92400e"
        />

        {/* Eyes — watching: open wide; hiding: covered by hands */}
        {watching ? (
          <>
            {/* Left eye */}
            <ellipse cx="25" cy="36" rx="4" ry="4.5" fill="white" />
            <circle cx="26" cy="36.5" r="2.2" fill="#1e40af" />
            <circle cx="27" cy="35.5" r="0.8" fill="white" />
            {/* Right eye */}
            <ellipse cx="39" cy="36" rx="4" ry="4.5" fill="white" />
            <circle cx="40" cy="36.5" r="2.2" fill="#1e40af" />
            <circle cx="41" cy="35.5" r="0.8" fill="white" />
            {/* Smile */}
            <path d="M27 43 Q32 47 37 43" stroke="#92400e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            {/* Hands covering eyes */}
            {/* Left hand */}
            <ellipse cx="24" cy="36" rx="6.5" ry="5.5" fill="#fbbf24" />
            <circle cx="20" cy="32" r="3" fill="#fbbf24" />
            <circle cx="23.5" cy="31" r="3" fill="#fbbf24" />
            <circle cx="27" cy="31.5" r="3" fill="#fbbf24" />
            {/* Right hand */}
            <ellipse cx="40" cy="36" rx="6.5" ry="5.5" fill="#fbbf24" />
            <circle cx="37" cy="31.5" r="3" fill="#fbbf24" />
            <circle cx="40.5" cy="31" r="3" fill="#fbbf24" />
            <circle cx="44" cy="32" r="3" fill="#fbbf24" />
            {/* Peeking sad mouth */}
            <path d="M28 44 Q32 42 36 44" stroke="#92400e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </>
        )}
      </g>
    </svg>
  );
}

export default function LoginPage() {
  const { user, loading: authLoading } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingOAuth, setLoadingOAuth] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Only redirect if auth is fully resolved AND user is logged in
  // (prevents flash when logging in — the login handler does its own push)
  useEffect(() => {
    if (!authLoading && user && !loading) {
      router.replace('/dashboard');
    }
  }, [user, authLoading, loading, router]);

  const handleOAuth = async (provider: 'google') => {
    setLoadingOAuth(true);
    setError('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) { setError(error.message); setLoadingOAuth(false); }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = createClient();
    let loginEmail = identifier.trim();

    if (!loginEmail.includes('@')) {
      const { data: profile } = await supabase
        .from('profiles').select('email').eq('username', loginEmail.toLowerCase()).single();
      if (!profile?.email) {
        setError('No account found with that username.');
        setLoading(false);
        return;
      }
      loginEmail = profile.email;
    }

    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
    if (error) {
      if (error.message === 'Invalid login credentials')
        setError('Invalid email/username or password. If you just signed up, please verify your email first.');
      else if (error.message === 'Email not confirmed')
        setError('Please check your inbox and verify your email before signing in.');
      else setError(error.message);
      setLoading(false);
    } else {
      // Use replace so the login page is not kept in browser history
      router.replace('/dashboard');
    }
  };

  // While auth state is loading OR user is already logged in — show nothing (prevents flash)
  if (authLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(var(--background))' }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'hsl(var(--primary))' }} />
          <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex overflow-hidden">

      {/* ─── Left Panel ─── */}
      <div
        className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-14 overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #0d1b3e 0%, #0d2d6b 40%, #0f4c9e 100%)' }}
      >
        {/* Animated grid pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />

        {/* Glowing orbs */}
        <div className="absolute top-[-120px] right-[-80px] w-[480px] h-[480px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.35) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-80px] left-[-60px] w-[380px] h-[380px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)' }} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center border border-white/20"
            style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)' }}>
            <Megaphone className="w-5 h-5 text-white" />
          </div>
          <span className="text-white text-xl font-bold tracking-tight">GuffGaff</span>
        </div>

        {/* Main hero */}
        <div className="relative z-10 space-y-10">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 border text-xs font-medium"
              style={{ background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)' }}>
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Nepal&apos;s Civic Voice Platform
            </div>
            <h1 className="text-[3.2rem] font-extrabold text-white leading-[1.1] tracking-tight">
              Raise your<br />
              <span style={{ background: 'linear-gradient(90deg, #60a5fa, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                voice.
              </span>
            </h1>
            <p className="text-white/50 text-base leading-relaxed max-w-sm">
              Connect with citizens across all 77 districts. Post civic issues, discuss solutions, and make your community heard.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-3">
            {[
              { icon: <Shield className="w-4 h-4" />, text: 'Verified civic community', color: '#60a5fa' },
              { icon: <Users className="w-4 h-4" />, text: 'Citizens across all 77 districts', color: '#34d399' },
              { icon: <Globe className="w-4 h-4" />, text: 'Nepali & English supported', color: '#a78bfa' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: f.color }}>
                  {f.icon}
                </div>
                {f.text}
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-white/20 text-xs">© 2026 GuffGaff · Made with ❤️ for Nepal</p>
        </div>
      </div>

      {/* ─── Right Panel ─── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 relative"
        style={{ background: 'hsl(var(--background))' }}>

        {/* Subtle background texture */}
        <div className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(59,130,246,0.08) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(16,185,129,0.06) 0%, transparent 50%)',
          }} />

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-10">
          <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
            <Megaphone className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">GuffGaff</span>
        </div>

        <div className="relative z-10 w-full max-w-[420px]">

          {/* ─── Peeker character above password field ─── */}
          <div
            className="mx-auto mb-6 flex flex-col items-center"
            style={{
              height: passwordFocused ? '80px' : '0px',
              overflow: 'hidden',
              transition: 'height 0.4s cubic-bezier(0.34,1.56,0.64,1)',
            }}
          >
            <div className="w-20 h-20">
              <PeekerIcon watching={showPassword} />
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-[1.75rem] font-extrabold text-foreground tracking-tight">Welcome back 👋</h2>
            <p className="text-muted-foreground text-sm mt-1.5">Sign in to your GuffGaff account</p>
          </div>

          {error && (
            <div className="mb-5">
              <Alert variant="error">{error}</Alert>
            </div>
          )}

          {/* Google OAuth */}
          <button
            type="button"
            onClick={() => handleOAuth('google')}
            disabled={loadingOAuth || loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl text-sm font-semibold border transition-all duration-200 disabled:opacity-50 mb-5 hover:shadow-md active:scale-[0.98]"
            style={{
              background: 'hsl(var(--card))',
              borderColor: 'hsl(var(--border))',
              color: 'hsl(var(--foreground))',
            }}
          >
            {loadingOAuth ? (
              <Loader2 className="w-4 h-4 animate-spin" />
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

          {/* Divider */}
          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: 'hsl(var(--border))' }} />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-xs" style={{ background: 'hsl(var(--background))', color: 'hsl(var(--muted-foreground))' }}>
                or sign in with email
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email/Username */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Email or Username
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="you@example.com or @username"
                required
                className="w-full px-4 py-3.5 rounded-2xl text-sm outline-none transition-all duration-200"
                style={{
                  background: 'hsl(var(--card))',
                  border: '1.5px solid hsl(var(--border))',
                  color: 'hsl(var(--foreground))',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--primary))'; e.currentTarget.style.boxShadow = '0 0 0 3px hsl(var(--ring)/0.15)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--border))'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Password
                </label>
                <Link href="/auth/forgot-password" className="text-xs font-semibold hover:underline" style={{ color: 'hsl(var(--primary))' }}>
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full px-4 py-3.5 pr-14 rounded-2xl text-sm outline-none transition-all duration-200"
                  style={{
                    background: 'hsl(var(--card))',
                    border: '1.5px solid hsl(var(--border))',
                    color: 'hsl(var(--foreground))',
                  }}
                  onFocus={(e) => {
                    setPasswordFocused(true);
                    e.currentTarget.style.borderColor = 'hsl(var(--primary))';
                    e.currentTarget.style.boxShadow = '0 0 0 3px hsl(var(--ring)/0.15)';
                  }}
                  onBlur={(e) => {
                    setPasswordFocused(false);
                    e.currentTarget.style.borderColor = 'hsl(var(--border))';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                {/* Toggle button with peeker indicator dot */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95"
                  style={{ background: showPassword ? 'hsl(var(--primary)/0.12)' : 'hsl(var(--muted))' }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    /* Open eye */
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    /* Closed/slashed eye */
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 disabled:opacity-60 active:scale-[0.98] mt-2"
              style={{
                background: 'hsl(var(--primary))',
                color: 'hsl(var(--primary-foreground))',
                boxShadow: '0 8px 24px hsl(var(--primary)/0.3)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>Sign In <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: 'hsl(var(--border))' }} />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-xs" style={{ background: 'hsl(var(--background))', color: 'hsl(var(--muted-foreground))' }}>
                new to GuffGaff?
              </span>
            </div>
          </div>

          {/* Create account */}
          <Link
            href="/auth/register"
            className="block w-full text-center py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              boxShadow: '0 8px 24px rgba(16,185,129,0.25)',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.9'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
          >
            Create New Account
          </Link>

          {/* Footer */}
          <p className="text-center text-xs mt-8 space-x-3" style={{ color: 'hsl(var(--muted-foreground))' }}>
            <Link href="/privacy" className="hover:underline">Privacy</Link>
            <span>·</span>
            <Link href="/terms" className="hover:underline">Terms</Link>
            <span>·</span>
            <Link href="/about" className="hover:underline">About</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
