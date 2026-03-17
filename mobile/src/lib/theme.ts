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

// Spacing scale — use throughout instead of arbitrary numbers
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// Typography presets
export const typography = {
  heading1: { fontSize: 28, fontWeight: '800' as const },
  heading2: { fontSize: 22, fontWeight: '800' as const },
  heading3: { fontSize: 18, fontWeight: '700' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodySmall: { fontSize: 13, fontWeight: '500' as const },
  caption: { fontSize: 11, fontWeight: '600' as const },
  micro: { fontSize: 10, fontWeight: '700' as const },
} as const;

// Border radius presets
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;

// Shadow presets (iOS + Android)
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
} as const;

// Layout constants
// NOTE: Do NOT use screenWidth/screenHeight — use useWindowDimensions() in components
export const layout = {
  navbarHeight: 56,
  bottomTabHeight: 80,
  padding: 16,
  borderRadius: 16,
};

// Standard bottom padding to clear the tab bar
export const TAB_BAR_PADDING = 100;

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
