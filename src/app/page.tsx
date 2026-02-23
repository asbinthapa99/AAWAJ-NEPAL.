'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Post } from '@/lib/types';
import PostCard from '@/components/PostCard';
import { APP_NAME, APP_NAME_NP } from '@/lib/constants';
import {
  Megaphone, TrendingUp, PlusCircle, Loader2,
  ShieldCheck, Globe, Bell, Users, HeartHandshake,
  ChevronDown, Rocket, MapPin, MessageSquare,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import NepalFlag from '@/components/NepalFlag3D';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const FEATURES = [
  {
    icon: Megaphone,
    title: 'Raise Your Voice',
    desc: 'Post any civic problem — roads, health, education, governance — and get it seen by thousands.',
    color: 'text-red-500',
    bg: 'bg-red-50 dark:bg-red-900/20',
  },
  {
    icon: MapPin,
    title: 'District-Level Reach',
    desc: 'Tag your problem to a specific district across all 77 districts of Nepal for precise accountability.',
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
  },
  {
    icon: Users,
    title: 'Community Support',
    desc: 'Support posts you agree with. The most supported issues rise to the top and get attention.',
    color: 'text-green-500',
    bg: 'bg-green-50 dark:bg-green-900/20',
  },
  {
    icon: MessageSquare,
    title: 'Open Discussion',
    desc: 'Comment, discuss, and collaborate on solutions with fellow Nepali citizens.',
    color: 'text-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
  },
  {
    icon: ShieldCheck,
    title: 'Safe & Verified',
    desc: 'Sign in with Google for secure, verified accounts. No spam, no bots.',
    color: 'text-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
  },
  {
    icon: Globe,
    title: 'Bilingual Platform',
    desc: 'Fully supports both English and Nepali (नेपाली) so every citizen can participate.',
    color: 'text-teal-500',
    bg: 'bg-teal-50 dark:bg-teal-900/20',
  },
];

const UPCOMING = [
  { icon: Bell, title: 'Push Notifications', desc: 'Get notified when your post gains traction or receives a response from authorities.' },
  { icon: Rocket, title: 'Official Authority Dashboard', desc: 'Government officials and NGOs can claim a verified badge and respond to issues directly.' },
  { icon: TrendingUp, title: 'Trend Reports', desc: 'Weekly and monthly trend reports showing the most pressing issues across Nepal.' },
  { icon: HeartHandshake, title: 'NGO & Media Integration', desc: 'Connect verified journalists and NGOs to high-urgency posts for real-world action.' },
];

const FAQS = [
  {
    q: 'Who can post on Awaaz Nepal?',
    a: 'Anyone with a Google account or email can sign up for free and post about any civic issue affecting Nepal.',
  },
  {
    q: 'Is this platform affiliated with the government?',
    a: 'No. Awaaz Nepal is an independent citizen platform. We are not affiliated with any government body or political party.',
  },
  {
    q: 'How do I support a post?',
    a: "Click the Support button on any post. The more supports a post gets, the higher it ranks in Trending.",
  },
  {
    q: 'Can I post anonymously?',
    a: 'Currently all posts are tied to your account. Anonymous posting is on our roadmap for a future update.',
  },
  {
    q: 'What types of problems can I post?',
    a: 'Infrastructure, education, health, environment, governance, safety, employment, social issues, culture, technology — anything affecting the public.',
  },
  {
    q: 'Is Awaaz Nepal free to use?',
    a: 'Yes, completely free. We are supported by community donations to keep the platform running.',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        {q}
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 ml-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-3">
          {a}
        </div>
      )}
    </div>
  );
}

function HomeContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      router.replace(`/auth/callback?code=${code}`);
    }
  }, [searchParams, router]);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('posts')
        .select('*, author:profiles(*)')
        .order('supports_count', { ascending: false })
        .limit(3);
      setPosts(data || []);
      setLoading(false);
    };
    fetchPosts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4">

      {/* ── HERO ── */}
      <section className="relative mb-16 overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white via-red-50/30 to-blue-50/30 dark:from-gray-900 dark:via-red-950/20 dark:to-blue-950/20 animate-hero-glow mt-6">
        <div className="flex flex-col-reverse sm:flex-row items-center gap-4 sm:gap-6 p-6 md:p-10">
          <div className="flex-1 text-center md:text-left z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-full text-sm font-medium mb-4">
              <Megaphone className="w-4 h-4" />
              Voice of Nepali Citizens
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-3 leading-tight">
              {APP_NAME}{' '}
              <span className="text-lg md:text-2xl text-gray-400">({APP_NAME_NP})</span>
            </h1>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-lg mb-6">
              A free platform for every Nepali citizen to raise civic problems, demand accountability, and create change together.
              <br />
              <span className="text-xs">नेपालका समस्याहरूमा आवाज उठाउने एकमात्र मञ्च।</span>
            </p>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              {user ? (
                <Link
                  href="/post/create"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-blue-600 text-white rounded-2xl font-semibold hover:scale-105 hover:shadow-xl transition-all duration-300 shadow-lg shadow-red-500/20 text-sm"
                >
                  <PlusCircle className="w-5 h-5" />
                  Raise Your Voice
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth/register"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-blue-600 text-white rounded-2xl font-semibold hover:scale-105 hover:shadow-xl transition-all duration-300 shadow-lg shadow-red-500/20 text-sm"
                  >
                    Join Free
                  </Link>
                  <Link
                    href="/feed"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                  >
                    Browse Issues
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="w-28 h-36 sm:w-40 sm:h-52 md:w-56 md:h-72 flex-shrink-0">
            <NepalFlag />
          </div>
        </div>
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-red-200/20 dark:bg-red-800/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-blue-200/20 dark:bg-blue-800/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* ── FEATURES ── */}
      <section className="mb-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Why Awaaz Nepal?</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Everything you need to make your voice heard</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center mb-3`}>
                <f.icon className={`w-5 h-5 ${f.color}`} />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{f.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TOP POSTS ── */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Top Issues Right Now</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Most supported problems across Nepal</p>
          </div>
          <Link
            href="/feed"
            className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1"
          >
            View all →
          </Link>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
            <Megaphone className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No posts yet — be the first to raise your voice!</p>
            {user && (
              <Link href="/post/create" className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-gradient-to-r from-red-500 to-blue-600 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
                <PlusCircle className="w-4 h-4" /> Create Post
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
            <div className="text-center pt-2">
              <Link
                href="/feed"
                className="inline-flex items-center gap-2 px-6 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                See all issues →
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* ── UPCOMING ── */}
      <section className="mb-16">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium mb-3">
            <Rocket className="w-3.5 h-3.5" /> Coming Soon
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">What&apos;s Next</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Features we&apos;re building for you</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {UPCOMING.map((u) => (
            <div key={u.title} className="flex gap-4 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                <u.icon className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{u.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{u.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SUPPORT US ── */}
      <section className="mb-16">
        <div className="relative overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-red-50 to-blue-50 dark:from-red-950/30 dark:to-blue-950/30 p-8 text-center">
          <HeartHandshake className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-3">Support Awaaz Nepal</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-lg mx-auto mb-6">
            Awaaz Nepal is free for every citizen. We rely on community support to keep the servers running, improve the platform, and fight for Nepali voices. Even a small donation helps.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href="https://www.buymeacoffee.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-blue-600 text-white rounded-2xl font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-red-500/20 text-sm"
            >
              ☕ Buy Us a Coffee
            </a>
            <a
              href="https://github.com/asbinthapa99/AAWAJ-NEPAL"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
            >
              ⭐ Star on GitHub
            </a>
          </div>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-200/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-200/20 rounded-full blur-3xl pointer-events-none" />
        </div>
      </section>

      {/* ── FAQS ── */}
      <section className="mb-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Frequently Asked Questions</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Everything you need to know</p>
        </div>
        <div className="space-y-2 max-w-2xl mx-auto">
          {FAQS.map((faq) => (
            <FAQItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
      </section>

    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}

