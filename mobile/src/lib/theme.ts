import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Colors matching the web app's HSL theme system
export const colors = {
  light: {
    background: '#ffffff',
    foreground: '#0a0a0a',
    card: '#ffffff',
    cardBorder: '#e5e5e5',
    primary: '#dc2626',
    primaryForeground: '#ffffff',
    muted: '#f5f5f5',
    mutedForeground: '#737373',
    accent: '#f5f5f5',
    border: '#e5e5e5',
    destructive: '#ef4444',
    success: '#22c55e',
    warning: '#f59e0b',
    rose: '#f43f5e',
  },
  dark: {
    background: '#0a0a0a',
    foreground: '#fafafa',
    card: '#171717',
    cardBorder: '#262626',
    primary: '#dc2626',
    primaryForeground: '#ffffff',
    muted: '#262626',
    mutedForeground: '#a3a3a3',
    accent: '#262626',
    border: '#262626',
    destructive: '#ef4444',
    success: '#22c55e',
    warning: '#f59e0b',
    rose: '#f43f5e',
  },
};

// Category colors
export const categoryColors: Record<string, string> = {
  infrastructure: '#f59e0b',
  education: '#3b82f6',
  health: '#ef4444',
  environment: '#22c55e',
  governance: '#8b5cf6',
  safety: '#f97316',
  employment: '#06b6d4',
  social: '#ec4899',
  culture: '#a855f7',
  technology: '#6366f1',
  other: '#6b7280',
};

// Layout constants
export const layout = {
  screenWidth: width,
  screenHeight: height,
  navbarHeight: 56,
  bottomTabHeight: 80,
  padding: 16,
  borderRadius: 16,
};

// Time formatting
export function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHr < 24) return `${diffHr}h`;
  if (diffDay < 7) return `${diffDay}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
