'use client';

import Link from 'next/link';
import { useAuth } from './AuthProvider';
import ThemeToggle from './ThemeToggle';
import { APP_NAME } from '@/lib/constants';
import {
  Megaphone,
  PlusCircle,
  User,
  LogIn,
  LogOut,
  Menu,
  X,
  Home,
  Search,
  Bell,
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [language, setLanguage] = useState<'en' | 'np'>('en');
  const labels = language === 'np'
    ? {
        feed: 'फिड',
        raiseVoice: 'आवाज उठाउनुहोस्',
        signIn: 'लगइन',
        homeFeed: 'होम',
        myProfile: 'मेरो प्रोफाइल',
        signOut: 'साइन आउट',
        searchPlaceholder: 'आवाज नेपालमा खोज्नुहोस्',
        titleHome: 'होम',
        create: 'पोस्ट गर्नुहोस्',
      }
    : {
        feed: 'Feed',
        raiseVoice: 'Raise Voice',
        signIn: 'Log In',
        homeFeed: 'Home',
        myProfile: 'My Profile',
        signOut: 'Log Out',
        searchPlaceholder: 'Search Awaaz Nepal',
        titleHome: 'Home',
        create: 'Create Post',
      };

  useEffect(() => {
    const stored = localStorage.getItem('awaaz-lang');
    if (stored === 'np' || stored === 'en') {
      setLanguage(stored);
      document.documentElement.lang = stored === 'np' ? 'ne' : 'en';
    }
  }, []);

  const toggleLanguage = () => {
    const next = language === 'en' ? 'np' : 'en';
    setLanguage(next);
    localStorage.setItem('awaaz-lang', next);
    document.documentElement.lang = next === 'np' ? 'ne' : 'en';
    window.dispatchEvent(new Event('language-change'));
  };

  useEffect(() => {
    if (!profileMenuOpen) return;
    const handler = () => setProfileMenuOpen(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [profileMenuOpen]);

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-[#242526] shadow-sm dark:shadow-none border-b border-gray-200 dark:border-[#393a3b]">
      <div className="max-w-[1920px] mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Left: Logo + Search */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-1.5">
              <div className="w-10 h-10 bg-[#1877F2] rounded-full flex items-center justify-center shadow-sm">
                <Megaphone className="w-5 h-5 text-white" />
              </div>
            </Link>
            <div className="hidden md:flex">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder={labels.searchPlaceholder}
                  className="w-60 pl-10 pr-4 py-2 text-sm bg-[#f0f2f5] dark:bg-[#3a3b3c] border-none rounded-full outline-none text-gray-900 dark:text-[#e4e6eb] placeholder-gray-500 dark:placeholder-[#b0b3b8] focus:ring-2 focus:ring-[#1877F2]/30 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Center: Nav Icons */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              href={user ? '/dashboard' : '/feed'}
              className="relative px-8 py-2 rounded-lg hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] transition-colors"
              title={labels.titleHome}
            >
              <Home className="w-6 h-6 text-[#1877F2] mx-auto" />
              <div className="absolute bottom-0 left-2 right-2 h-[3px] bg-[#1877F2] rounded-t-full" />
            </Link>
            {user && (
              <Link
                href="/post/create"
                className="relative px-8 py-2 rounded-lg hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] transition-colors group"
                title={labels.create}
              >
                <PlusCircle className="w-6 h-6 text-gray-500 dark:text-[#b0b3b8] group-hover:text-[#1877F2] mx-auto transition-colors" />
              </Link>
            )}
          </div>

          {/* Right: Actions */}
          <div className="hidden md:flex items-center gap-1">
            {user && (
              <button className="w-10 h-10 rounded-full bg-[#e4e6eb] dark:bg-[#3a3b3c] flex items-center justify-center hover:bg-[#d8dadf] dark:hover:bg-[#4e4f50] transition-colors">
                <Bell className="w-5 h-5 text-gray-800 dark:text-[#e4e6eb]" />
              </button>
            )}
            <button
              onClick={toggleLanguage}
              className="w-10 h-10 rounded-full bg-[#e4e6eb] dark:bg-[#3a3b3c] flex items-center justify-center hover:bg-[#d8dadf] dark:hover:bg-[#4e4f50] transition-colors text-xs font-bold text-gray-800 dark:text-[#e4e6eb]"
            >
              {language === 'en' ? 'EN' : 'ने'}
            </button>
            <ThemeToggle />
            {user ? (
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setProfileMenuOpen(!profileMenuOpen); }}
                  className="flex items-center gap-1 ml-1"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-[#1877F2] to-[#42b72a] rounded-full flex items-center justify-center text-white text-sm font-bold ring-2 ring-transparent hover:ring-[#1877F2]/30 transition-all">
                    {profile?.full_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                </button>
                {profileMenuOpen && (
                  <div className="absolute right-0 top-12 w-72 bg-white dark:bg-[#242526] rounded-lg shadow-2xl border border-gray-200 dark:border-[#393a3b] overflow-hidden z-50">
                    <div className="p-3">
                      <Link
                        href={`/profile/${user.id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] transition-colors"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        <div className="w-9 h-9 bg-gradient-to-br from-[#1877F2] to-[#42b72a] rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {profile?.full_name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="text-[15px] font-semibold text-gray-900 dark:text-[#e4e6eb]">{profile?.full_name || 'User'}</p>
                          <p className="text-xs text-gray-500 dark:text-[#b0b3b8]">{labels.myProfile}</p>
                        </div>
                      </Link>
                    </div>
                    <div className="border-t border-gray-200 dark:border-[#393a3b]" />
                    <div className="p-2">
                      <button
                        onClick={() => { signOut(); setProfileMenuOpen(false); }}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] transition-colors text-left"
                      >
                        <div className="w-9 h-9 rounded-full bg-[#e4e6eb] dark:bg-[#3a3b3c] flex items-center justify-center">
                          <LogOut className="w-4 h-4 text-gray-800 dark:text-[#e4e6eb]" />
                        </div>
                        <span className="text-[15px] font-medium text-gray-900 dark:text-[#e4e6eb]">{labels.signOut}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/auth/login" className="flex items-center gap-2 px-5 py-2 bg-[#1877F2] text-white rounded-lg text-sm font-semibold hover:bg-[#166FE5] transition-colors">
                <LogIn className="w-4 h-4" />
                <span>{labels.signIn}</span>
              </Link>
            )}
          </div>

          {/* Mobile */}
          <div className="flex md:hidden items-center gap-1">
            <button onClick={toggleLanguage} className="w-9 h-9 rounded-full bg-[#e4e6eb] dark:bg-[#3a3b3c] flex items-center justify-center text-xs font-bold text-gray-800 dark:text-[#e4e6eb]">
              {language === 'en' ? 'EN' : 'ने'}
            </button>
            <ThemeToggle />
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="w-9 h-9 rounded-full bg-[#e4e6eb] dark:bg-[#3a3b3c] flex items-center justify-center">
              {mobileMenuOpen ? <X className="w-5 h-5 text-gray-800 dark:text-[#e4e6eb]" /> : <Menu className="w-5 h-5 text-gray-800 dark:text-[#e4e6eb]" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden pb-3 pt-2 space-y-1">
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder={labels.searchPlaceholder} className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#f0f2f5] dark:bg-[#3a3b3c] rounded-full outline-none text-gray-900 dark:text-[#e4e6eb] placeholder-gray-500" />
            </div>
            <Link href={user ? '/dashboard' : '/feed'} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] text-gray-900 dark:text-[#e4e6eb]">
              <Home className="w-5 h-5 text-[#1877F2]" /><span className="text-[15px] font-medium">{labels.homeFeed}</span>
            </Link>
            {user ? (
              <>
                <Link href="/post/create" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] text-gray-900 dark:text-[#e4e6eb]">
                  <PlusCircle className="w-5 h-5 text-[#42b72a]" /><span className="text-[15px] font-medium">{labels.create}</span>
                </Link>
                <Link href={`/profile/${user.id}`} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] text-gray-900 dark:text-[#e4e6eb]">
                  <User className="w-5 h-5 text-[#1877F2]" /><span className="text-[15px] font-medium">{labels.myProfile}</span>
                </Link>
                <button onClick={() => { signOut(); setMobileMenuOpen(false); }} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] w-full text-left text-gray-900 dark:text-[#e4e6eb]">
                  <LogOut className="w-5 h-5 text-red-500" /><span className="text-[15px] font-medium">{labels.signOut}</span>
                </button>
              </>
            ) : (
              <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#1877F2] text-white mx-1">
                <LogIn className="w-5 h-5" /><span className="text-[15px] font-semibold">{labels.signIn}</span>
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
