'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import NepalFlag from '@/components/NepalFlag3D';
import PostCard from '@/components/PostCard';
import { APP_NAME, APP_NAME_NP } from '@/lib/constants';
import { Post, News } from '@/lib/types';
import {
  Megaphone,
  TrendingUp,
  PlusCircle,
  Loader2,
  ShieldCheck,
  Globe,
  Bell,
  Users,
  HeartHandshake,
  ChevronDown,
  Rocket,
  MapPin,
  MessageSquare,
  Newspaper,
  Sparkles,
  LogIn,
  CircleUserRound,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Megaphone,
    title: 'Raise Your Voice',
    desc: 'Post any civic problem and make it visible to the entire country.',
    color: 'text-red-500',
    bg: 'bg-red-50 dark:bg-red-900/20',
  },
  {
    icon: MapPin,
    title: 'District-Level Reach',
    desc: 'Tag issues by district so local leaders and agencies can respond faster.',
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
  },
  {
    icon: Users,
    title: 'Community Support',
    desc: 'Likes and comments highlight the most urgent problems in your area.',
    color: 'text-green-500',
    bg: 'bg-green-50 dark:bg-green-900/20',
  },
  {
    icon: MessageSquare,
    title: 'Open Discussion',
    desc: 'Discuss solutions, share evidence, and collaborate with your community.',
    color: 'text-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
  },
  {
    icon: ShieldCheck,
    title: 'Verified Accounts',
    desc: 'Secure login and verified accounts keep the platform trustworthy.',
    color: 'text-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
  },
  {
    icon: Globe,
    title: 'Bilingual Access',
    desc: 'Supports both English and Nepali so everyone can participate.',
    color: 'text-teal-500',
    bg: 'bg-teal-50 dark:bg-teal-900/20',
  },
];

const UPCOMING = [
  { icon: Bell, title: 'Push Notifications', desc: 'Get alerts when your post trends or receives official attention.' },
  { icon: Rocket, title: 'Authority Dashboard', desc: 'Verified officials can respond and update actions taken.' },
  { icon: TrendingUp, title: 'Trend Reports', desc: 'Weekly insights for journalists, activists, and policymakers.' },
  { icon: HeartHandshake, title: 'NGO + Media Integration', desc: 'Direct collaboration with NGOs and media partners.' },
];

const FAQS = [
  {
    q: 'Is this useful for politicians and government offices?',
    a: 'Yes. Awaaz Nepal surfaces public concerns in real time so leaders can see what matters and respond faster.',
  },
  {
    q: 'Who can post on Awaaz Nepal?',
    a: 'Any citizen with a verified account can post problems affecting their community.',
  },
  {
    q: 'How do likes and dislikes work?',
    a: 'Likes raise visibility. Dislikes provide sentiment signals but do not hide posts.',
  },
  {
    q: 'Is this platform affiliated with the government?',
    a: 'No. Awaaz Nepal is an independent civic platform built for public accountability.',
  },
  {
    q: 'Can officials respond to posts?',
    a: 'That feature is coming soon with verified authority badges and responses.',
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

export default function HomeClient() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const [news, setNews] = useState<News[]>([]);
  const [newsTitle, setNewsTitle] = useState('');
  const [newsBody, setNewsBody] = useState('');
  const [newsLink, setNewsLink] = useState('');
  const [newsError, setNewsError] = useState('');
  const [newsSaving, setNewsSaving] = useState(false);

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      router.replace(`/auth/callback?code=${code}`);
    }
  }, [searchParams, router]);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoadingPosts(true);
      const { data } = await supabase
        .from('posts')
        .select('*, author:profiles(*)')
        .order('supports_count', { ascending: false })
        .limit(3);
      setPosts(data || []);
      setLoadingPosts(false);
    };

    const fetchNews = async () => {
      const { data } = await supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);
      setNews(data || []);
    };

    fetchPosts();
    fetchNews();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (!newsTitle.trim() || !newsBody.trim()) {
      setNewsError('Title and summary are required.');
      return;
    }

    setNewsSaving(true);
    setNewsError('');

    const { error } = await supabase.from('news').insert({
      author_id: user.id,
      title: newsTitle.trim(),
      body: newsBody.trim(),
      link: newsLink.trim() || null,
    });

    if (error) {
      setNewsError(error.message);
      setNewsSaving(false);
      return;
    }

    setNewsTitle('');
    setNewsBody('');
    setNewsLink('');
    setNewsSaving(false);

    const { data } = await supabase
      .from('news')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(6);
    setNews(data || []);
  };

  return (
    <div className="relative">
      <div className="particle-bg" aria-hidden />

      {/* News Bar */}
      <section className="bg-gray-900 text-white py-2">
        <div className="max-w-5xl mx-auto px-4 flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-red-300">
            <Newspaper className="w-4 h-4" />
            Live News
          </div>
          <div className="news-marquee">
            <div className="news-track">
              {news.length === 0 ? (
                <span className="text-xs text-gray-300">No news posted yet.</span>
              ) : (
                news.map((item) => (
                  <span key={item.id} className="news-item">
                    {item.title}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4">
        {/* HERO */}
        <section className="relative mb-14 overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white via-red-50/30 to-blue-50/30 dark:from-gray-900 dark:via-red-950/20 dark:to-blue-950/20 animate-hero-glow mt-6">
          <div className="flex flex-col-reverse sm:flex-row items-center gap-4 sm:gap-6 p-6 md:p-10">
            <div className="flex-1 text-center md:text-left z-10 animate-hero-fade-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-full text-sm font-medium mb-4 animate-float-slow">
                <Sparkles className="w-4 h-4" />
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
            <div className="w-28 h-36 sm:w-40 sm:h-52 md:w-56 md:h-72 flex-shrink-0 animate-hero-scale-in">
              <NepalFlag />
            </div>
          </div>
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-red-200/20 dark:bg-red-800/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-blue-200/20 dark:bg-blue-800/10 rounded-full blur-3xl pointer-events-none" />
        </section>

        {/* Quick Login CTA */}
        <section className="mb-14">
          <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/70 backdrop-blur p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">
                Quick Login for Action
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Sign in to post issues, add news updates, and support civic action in minutes.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Log In
              </Link>
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-gray-300 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <CircleUserRound className="w-4 h-4" />
                Create Account
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Why Awaaz Nepal?</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Everything you need to make your voice heard</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div key={f.title} className={`p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:shadow-md transition-shadow animate-stagger-${i + 1}`}>
                <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center mb-3`}>
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* News Create (auth only) */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Community News</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Local updates visible across the platform</p>
            </div>
            <Link href="/feed" className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline">
              View all issues →
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Latest News</h3>
              <div className="space-y-3">
                {news.length === 0 ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400">No news yet.</p>
                ) : (
                  news.map((item) => (
                    <div key={item.id} className="flex flex-col gap-1 border-b border-gray-100 dark:border-gray-800 pb-3 last:border-0 last:pb-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{item.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{item.body}</p>
                      {item.link && (
                        <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                          Read more →
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Post News Update</h3>
              {!user ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">Log in to post news updates.</p>
              ) : (
                <form onSubmit={handleCreateNews} className="space-y-3">
                  {newsError && (
                    <div className="text-xs text-red-600 dark:text-red-400">{newsError}</div>
                  )}
                  <input
                    value={newsTitle}
                    onChange={(e) => setNewsTitle(e.target.value)}
                    placeholder="News title"
                    className="w-full px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 border border-transparent focus:border-blue-500 text-sm outline-none"
                  />
                  <textarea
                    value={newsBody}
                    onChange={(e) => setNewsBody(e.target.value)}
                    placeholder="Short summary"
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 border border-transparent focus:border-blue-500 text-sm outline-none resize-none"
                  />
                  <input
                    value={newsLink}
                    onChange={(e) => setNewsLink(e.target.value)}
                    placeholder="Optional link"
                    className="w-full px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 border border-transparent focus:border-blue-500 text-sm outline-none"
                  />
                  <button
                    type="submit"
                    disabled={newsSaving}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-blue-600 text-white text-sm font-semibold disabled:opacity-60"
                  >
                    {newsSaving ? 'Posting...' : 'Post News'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* Top Posts */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Top Issues Right Now</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Most supported problems across Nepal</p>
            </div>
            <Link href="/feed" className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline">
              View all →
            </Link>
          </div>
          {loadingPosts ? (
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
            </div>
          )}
        </section>

        {/* Upcoming */}
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

        {/* Support */}
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

        {/* FAQ */}
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

        {/* Footer Links */}
        <section className="pb-16">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white mb-2">Pages & Rights</p>
              <div className="space-y-1 text-gray-500 dark:text-gray-400">
                <Link href="/terms" className="hover:text-gray-900 dark:hover:text-white">Terms of Service</Link>
                <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-white">Privacy Policy</Link>
                <Link href="/feed" className="hover:text-gray-900 dark:hover:text-white">All Issues</Link>
              </div>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white mb-2">Quick Links</p>
              <div className="space-y-1 text-gray-500 dark:text-gray-400">
                <Link href="/auth/login" className="hover:text-gray-900 dark:hover:text-white">Login</Link>
                <Link href="/auth/register" className="hover:text-gray-900 dark:hover:text-white">Register</Link>
                <Link href="/post/create" className="hover:text-gray-900 dark:hover:text-white">Raise a Voice</Link>
              </div>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white mb-2">Social</p>
              <div className="flex gap-3">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-icon"
                  aria-label="Facebook"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden>
                    <path d="M24 12.073c0-6.627-5.373-12-12-12S0 5.446 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-icon"
                  aria-label="X"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden>
                    <path d="M18.244 2H21l-6.53 7.46L22 22h-6.828l-5.35-6.99L3.8 22H1l6.98-8.07L2 2h6.93l4.83 6.29L18.244 2zm-1.197 18h1.53L7.08 4H5.46l11.587 16z" />
                  </svg>
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-icon"
                  aria-label="YouTube"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden>
                    <path d="M23.5 6.19a3 3 0 0 0-2.12-2.12C19.64 3.5 12 3.5 12 3.5s-7.64 0-9.38.57A3 3 0 0 0 .5 6.19 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.81 3 3 0 0 0 2.12 2.12c1.74.57 9.38.57 9.38.57s7.64 0 9.38-.57a3 3 0 0 0 2.12-2.12A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.81ZM9.75 15.5v-7l6 3.5-6 3.5Z" />
                  </svg>
                </a>
                <a
                  href="https://tiktok.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-icon"
                  aria-label="TikTok"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden>
                    <path d="M19.321 5.562a5.8 5.8 0 0 1-3.543-1.203V15.4a4.6 4.6 0 1 1-3.784-4.52v2.56a2.2 2.2 0 1 0 1.584 2.1V0h2.2a5.78 5.78 0 0 0 3.543 3.49v2.072Z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
