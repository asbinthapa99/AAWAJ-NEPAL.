export const APP_NAME = 'GuffGaff';
export const APP_NAME_NP = 'गफगाफ';
export const APP_TAGLINE = 'Connect. Share. Discuss.';
export const APP_TAGLINE_NP = 'जोडिनुहोस् · साझा गर्नुहोस् · छलफल गर्नुहोस्';
export const APP_DESCRIPTION =
  'A social platform for Nepali people to connect, share thoughts, raise issues, and discuss what matters.';

export const URGENCY_CONFIG = {
  low: {
    label: 'Low',
    labelNp: 'कम',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    borderColor: 'border-green-300 dark:border-green-700',
  },
  medium: {
    label: 'Medium',
    labelNp: 'मध्यम',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    borderColor: 'border-yellow-300 dark:border-yellow-700',
  },
  high: {
    label: 'High',
    labelNp: 'उच्च',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    borderColor: 'border-orange-300 dark:border-orange-700',
  },
  critical: {
    label: 'Critical',
    labelNp: 'गम्भीर',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    borderColor: 'border-red-300 dark:border-red-700',
  },
} as const;

export const POSTS_PER_PAGE = 10;
