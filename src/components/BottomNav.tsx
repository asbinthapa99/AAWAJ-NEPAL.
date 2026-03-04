'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { Home, PlusSquare, Heart, User, Search } from 'lucide-react';
import { Avatar } from './ui/Avatar';

export default function BottomNav() {
  const { user, profile } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const isActive = (path: string) => {
    if (path === '/dashboard') return pathname === '/dashboard';
    if (path === '/notifications') return pathname === '/notifications';
    if (path.startsWith('/profile')) return pathname.startsWith('/profile');
    return pathname === path;
  };

  const navItems = [
    { href: '/dashboard', icon: Home, label: 'Home' },
    { href: '/feed', icon: Search, label: 'Explore' },
    { href: '/post/create', icon: PlusSquare, label: 'Create' },
    { href: '/notifications', icon: Heart, label: 'Activity' },
    { href: `/profile/${user.id}`, icon: User, label: 'Profile', isProfile: true },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border safe-area-bottom"
      style={{
        background: 'hsl(var(--background)/0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}>
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-14 h-full transition-all duration-200 ${
                active ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              {item.isProfile ? (
                <div className={`w-7 h-7 rounded-full overflow-hidden ${active ? 'ring-2 ring-foreground' : ''}`}>
                  <Avatar
                    src={profile?.avatar_url || undefined}
                    fallback={profile?.full_name || 'U'}
                    size="sm"
                  />
                </div>
              ) : item.href === '/post/create' ? (
                <div className="w-7 h-7 rounded-lg border-2 border-current flex items-center justify-center">
                  <span className="text-lg font-light leading-none">+</span>
                </div>
              ) : (
                <item.icon
                  className="w-6 h-6"
                  strokeWidth={active ? 2.5 : 1.5}
                  fill={active && item.href !== '/post/create' ? 'currentColor' : 'none'}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
