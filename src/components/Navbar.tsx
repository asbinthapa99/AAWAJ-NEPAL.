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
} from 'lucide-react';
import { useEffect, useState } from 'react';
import NotificationBadge from './NotificationBadge';
import { Avatar } from './ui/Avatar';

interface SearchResult {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
}

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
    <nav className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
      <div className="max-w-[1920px] mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Left: Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-1.5 focus-ring rounded-full">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-sm">
                <Megaphone className="w-5 h-5 text-primary-foreground" />
              </div>
            </Link>
          </div>

          {/* Center: Nav Icons */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              href={user ? '/dashboard' : '/feed'}
              className="relative px-8 py-2 rounded-lg hover:bg-accent transition-colors focus-ring"
              title={labels.titleHome}
            >
              <Home className="w-6 h-6 text-primary mx-auto" />
              <div className="absolute bottom-0 left-2 right-2 h-[3px] bg-primary rounded-t-full" />
            </Link>
            {user && (
              <Link
                href="/post/create"
                className="relative px-8 py-2 rounded-lg hover:bg-accent transition-colors group focus-ring"
                title={labels.create}
              >
                <PlusCircle className="w-6 h-6 text-muted-foreground group-hover:text-primary mx-auto transition-colors" />
              </Link>
            )}
          </div>

          {/* Right: Actions */}
          <div className="hidden md:flex items-center gap-1">
            {user && <NotificationBadge />}
            <button
              onClick={toggleLanguage}
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors text-xs font-bold text-foreground focus-ring"
            >
              {language === 'en' ? 'EN' : 'ने'}
            </button>
            <ThemeToggle />
            {user ? (
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setProfileMenuOpen(!profileMenuOpen); }}
                  className="flex items-center gap-1 ml-1 focus-ring rounded-full"
                >
                  <Avatar
                    src={profile?.avatar_url || undefined}
                    fallback={profile?.full_name || 'U'}
                    size="md"
                    className="ring-2 ring-transparent hover:ring-primary/30 transition-all"
                  />
                </button>
                {profileMenuOpen && (
                  <div className="absolute right-0 top-12 w-72 bg-card rounded-xl shadow-xl border border-border overflow-hidden z-50 animate-scale-in">
                    <div className="p-3">
                      <Link
                        href={`/profile/${user.id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        <Avatar
                          src={profile?.avatar_url || undefined}
                          fallback={profile?.full_name || 'U'}
                          size="sm"
                        />
                        <div>
                          <p className="text-sm font-semibold text-foreground">{profile?.full_name || 'User'}</p>
                          <p className="text-xs text-muted-foreground">{labels.myProfile}</p>
                        </div>
                      </Link>
                    </div>
                    <div className="border-t border-border" />
                    <div className="p-2">
                      <button
                        onClick={() => { signOut(); setProfileMenuOpen(false); }}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-left"
                      >
                        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                          <LogOut className="w-4 h-4 text-foreground" />
                        </div>
                        <span className="text-sm font-medium text-foreground">{labels.signOut}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Mobile */}
          <div className="flex md:hidden items-center gap-1">
            <button onClick={toggleLanguage} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground focus-ring">
              {language === 'en' ? 'EN' : 'ने'}
            </button>
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-9 h-9 rounded-full bg-muted flex items-center justify-center focus-ring"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-foreground" /> : <Menu className="w-5 h-5 text-foreground" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden pb-3 pt-2 space-y-1 border-t border-border animate-fade-in">
            <Link href={user ? '/dashboard' : '/feed'} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent text-foreground transition-colors">
              <Home className="w-5 h-5 text-primary" /><span className="text-sm font-medium">{labels.homeFeed}</span>
            </Link>
            {user ? (
              <>
                <Link href="/post/create" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent text-foreground transition-colors">
                  <PlusCircle className="w-5 h-5 text-success" /><span className="text-sm font-medium">{labels.create}</span>
                </Link>
                <Link href={`/profile/${user.id}`} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent text-foreground transition-colors">
                  <User className="w-5 h-5 text-primary" /><span className="text-sm font-medium">{labels.myProfile}</span>
                </Link>
                <button onClick={() => { signOut(); setMobileMenuOpen(false); }} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent w-full text-left text-foreground transition-colors">
                  <LogOut className="w-5 h-5 text-destructive" /><span className="text-sm font-medium">{labels.signOut}</span>
                </button>
              </>
            ) : null}
          </div>
        )}
      </div>
    </nav>
  );
}
