import type { Metadata } from 'next';
import { Suspense } from 'react';
import HomeClient from './page.client';

export const metadata: Metadata = {
  title: 'GuffGaff — Voice for Citizens of Nepal',
  description:
    'Raise civic problems, highlight urgent issues, and help leaders respond faster. GuffGaff is the public voice of Nepal.',
  openGraph: {
    title: 'GuffGaff — Voice for Citizens of Nepal',
    description:
      'Raise civic problems, highlight urgent issues, and help leaders respond faster. GuffGaff is the public voice of Nepal.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GuffGaff — Voice for Citizens of Nepal',
    description:
      'Raise civic problems, highlight urgent issues, and help leaders respond faster. GuffGaff is the public voice of Nepal.',
  },
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <HomeClient />
    </Suspense>
  );
}
