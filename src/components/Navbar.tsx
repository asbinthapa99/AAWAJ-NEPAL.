'use client';

import Link from 'next/link';
import { useAuth } from './AuthProvider';
import ThemeToggle from './ThemeToggle';
import {
  Megaphone,
  PlusCircle,
  User,
  LogOut,
  Menu,
  X,
  Home,
  ChevronDown,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import NotificationBadge from './NotificationBadge';
import { Avatar } from './ui/Avatar';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const [language, setLanguage] = useState<'en' | 'np'>(() => {
    if (typeof window === 'undefined') return 'en';
    const stored = window.localStorage.getItem('awaaz-lang');
    return stored === 'np' ? 'np' : 'en';
  });

  const labels = language === 'np'
    ? {
      feed: 'फिड',
      raiseVoice: 'समस्या उठाउनुहोस्',
      signIn: 'लगइन',
      homeFeed: 'होम',
      myProfile: 'मेरो प्रोफाइल',
      signOut: 'साइन आउट',
      searchPlaceholder: 'गफगाफमा खोज्नुहोस्',
      titleHome: 'होम',
      create: 'पोस्ट गर्नुहोस्',
    }
    : {
      feed: 'Feed',
      raiseVoice: 'Raise Issue',
      signIn: 'Log In',
      homeFeed: 'Home',
      myProfile: 'My Profile',
      signOut: 'Log Out',
      searchPlaceholder: 'Search GuffGaff',
      titleHome: 'Home',
      create: 'Create Post',
    };

  useEffect(() => {
    document.documentElement.lang = language === 'np' ? 'ne' : 'en';
  }, [language]);

  const toggleLanguage = () => {
    const next = language === 'en' ? 'np' : 'en';
    setLanguage(next);
    localStorage.setItem('awaaz-lang', next);
    document.documentElement.lang = next === 'np' ? 'ne' : 'en';
    window.dispatchEvent(new Event('language-change'));
  };

  useEffect(() => {
    const syncLanguage = () => {
      const stored = window.localStorage.getItem('awaaz-lang');
      setLanguage(stored === 'np' ? 'np' : 'en');
    };
    window.addEventListener('storage', syncLanguage);
    window.addEventListener('language-change', syncLanguage);
    return () => {
      window.removeEventListener('storage', syncLanguage);
      window.removeEventListener('language-change', syncLanguage);
    };
  }, []);

  useEffect(() => {
    if (!profileMenuOpen) return;
    const handler = () => setProfileMenuOpen(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [profileMenuOpen]);

  return (
    <nav className="sticky top-0 z-50 border-b border-border/60"
      style={{ background: 'hsl(var(--background)/0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
      <div className="max-w-[1920px] mx-auto px-4">
        <div className="flex items-center justify-between h-[58px] gap-4">

          {/* ── Left: Logo + Brand ── */}
          <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md transition-transform group-hover:scale-105"
              style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.7))' }}>
              <Megaphone className="w-4.5 h-4.5 text-primary-foreground w-[18px] h-[18px]" />
            </div>
            <span className="font-extrabold text-[17px] tracking-tight text-foreground hidden sm:block">GuffGaff</span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full hidden sm:block"
              style={{ background: 'hsl(var(--primary)/0.12)', color: 'hsl(var(--primary))' }}>
              गफगाफ
            </span>
          </Link>

          {/* ── Center: Nav Pills ── */}
          <div className="hidden md:flex items-center gap-1 p-1 rounded-2xl border border-border/50"
            style={{ background: 'hsl(var(--muted)/0.5)' }}>
            <Link
              href={user ? '/dashboard' : '/feed'}
              className="relative flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{ background: 'hsl(var(--background))', color: 'hsl(var(--foreground))', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
            >
              <Home className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
              <span>{labels.homeFeed}</span>
            </Link>
            {user && (
              <Link
                href="/post/create"
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-background/70 text-muted-foreground hover:text-foreground"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{labels.create}</span>
              </Link>
            )}
          </div>

          {/* ── Right: Actions ── */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="h-9 px-3 rounded-xl border border-border/60 text-xs font-bold transition-all hover:border-primary/40 hover:text-primary"
              style={{ background: 'hsl(var(--muted)/0.5)', color: 'hsl(var(--muted-foreground))' }}
            >
              {language === 'en' ? '🇳🇵 NP' : '🇬🇧 EN'}
            </button>

            <ThemeToggle />

            {user ? (
              <>
                {/* Notifications */}
                <div className="relative">
                  <NotificationBadge />
                </div>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setProfileMenuOpen(!profileMenuOpen); }}
                    className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl border border-border/60 transition-all hover:border-primary/40"
                    style={{ background: 'hsl(var(--muted)/0.4)' }}
                  >
                    <Avatar
                      src={profile?.avatar_url || undefined}
                      fallback={profile?.full_name || 'U'}
                      size="sm"
                      className="ring-2 ring-transparent hover:ring-primary/20 transition-all"
                    />
                    <span className="text-xs font-semibold text-foreground max-w-[80px] truncate hidden lg:block">
                      {profile?.full_name?.split(' ')[0] || 'Me'}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {profileMenuOpen && (
                    <div className="absolute right-0 top-[calc(100%+8px)] w-64 rounded-2xl shadow-2xl border border-border overflow-hidden z-50"
                      style={{ background: 'hsl(var(--card))', animation: 'scaleIn 0.15s ease' }}>
                      {/* User Info Header */}
                      <div className="p-4 border-b border-border"
                        style={{ background: 'linear-gradient(135deg, hsl(var(--primary)/0.08), transparent)' }}>
                        <Link
                          href={`/profile/${user.id}`}
                          className="flex items-center gap-3"
                          onClick={() => setProfileMenuOpen(false)}
                        >
                          <Avatar
                            src={profile?.avatar_url || undefined}
                            fallback={profile?.full_name || 'U'}
                            size="md"
                            className="ring-2 ring-primary/20"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-foreground truncate">{profile?.full_name || 'User'}</p>
                            <p className="text-xs text-muted-foreground truncate">@{profile?.username || 'user'}</p>
                          </div>
                        </Link>
                      </div>
                      {/* Menu Items */}
                      <div className="p-2">
                        <Link
                          href={`/profile/${user.id}`}
                          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-accent transition-colors text-sm font-medium text-foreground"
                          onClick={() => setProfileMenuOpen(false)}
                        >
                          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          {labels.myProfile}
                        </Link>
                        <div className="my-1.5 border-t border-border/50" />
                        <button
                          onClick={() => { signOut(); setProfileMenuOpen(false); }}
                          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-destructive/10 transition-colors text-sm font-medium text-destructive"
                        >
                          <div className="w-8 h-8 rounded-xl bg-destructive/10 flex items-center justify-center">
                            <LogOut className="w-4 h-4 text-destructive" />
                          </div>
                          {labels.signOut}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link
                href="/auth/login"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
              >
                Sign In
              </Link>
            )}
          </div>

          {/* ── Mobile ── */}
          <div className="flex md:hidden items-center gap-1.5">
            {user && <NotificationBadge />}
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-9 h-9 rounded-xl border border-border flex items-center justify-center transition-all hover:bg-accent"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* ── Mobile Menu ── */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 pt-2 space-y-1 border-t border-border animate-fade-in">
            <Link href={user ? '/dashboard' : '/feed'} onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent text-sm font-semibold text-foreground transition-colors">
              <Home className="w-5 h-5 text-primary" /> {labels.homeFeed}
            </Link>
            {user ? (
              <>
                <Link href="/post/create" onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent text-sm font-semibold text-foreground transition-colors">
                  <PlusCircle className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} /> {labels.create}
                </Link>
                <Link href={`/profile/${user.id}`} onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent text-sm font-semibold text-foreground transition-colors">
                  <User className="w-5 h-5 text-primary" /> {labels.myProfile}
                </Link>
                <button onClick={toggleLanguage}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent w-full text-left text-sm font-semibold text-foreground transition-colors">
                  <span className="text-lg">{language === 'en' ? '🇳🇵' : '🇬🇧'}</span>
                  {language === 'en' ? 'Switch to Nepali' : 'Switch to English'}
                </button>
                <button onClick={() => { signOut(); setMobileMenuOpen(false); }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-destructive/10 w-full text-left text-sm font-semibold text-destructive transition-colors">
                  <LogOut className="w-5 h-5" /> {labels.signOut}
                </button>
              </>
            ) : (
              <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 mx-3 py-3 rounded-xl text-sm font-bold transition-all"
                style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                Sign In
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
