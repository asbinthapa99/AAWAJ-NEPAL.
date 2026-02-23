import type { Metadata } from 'next';
import { Suspense } from 'react';
import HomeClient from './page.client';

export const metadata: Metadata = {
  title: 'Awaaz Nepal — Voice for Citizens of Nepal',
  description:
    'Raise civic problems, highlight urgent issues, and help leaders respond faster. Awaaz Nepal is the public voice of Nepal.',
  openGraph: {
    title: 'Awaaz Nepal — Voice for Citizens of Nepal',
    description:
      'Raise civic problems, highlight urgent issues, and help leaders respond faster. Awaaz Nepal is the public voice of Nepal.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Awaaz Nepal — Voice for Citizens of Nepal',
    description:
      'Raise civic problems, highlight urgent issues, and help leaders respond faster. Awaaz Nepal is the public voice of Nepal.',
  },
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <HomeClient />
    </Suspense>
  );
}
