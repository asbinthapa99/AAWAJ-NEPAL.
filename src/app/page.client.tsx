'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
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

function getContent(lang: 'en' | 'np') {
  if (lang === 'np') {
    return {
      heroBadge: 'नेपाली नागरिकको आवाज',
      heroLead:
        'नेपालका समस्याहरूमा आवाज उठाउने, उत्तरदायित्व खोज्ने र परिवर्तन ल्याउने मुक्त मञ्च।',
      heroSub: 'नेपालका समस्याहरूमा आवाज उठाउने एकमात्र मञ्च।',
      joinFree: 'निःशुल्क सहभागी हुनुहोस्',
      browseIssues: 'समस्या हेर्नुहोस्',
      raiseVoice: 'आवाज उठाउनुहोस्',
      quickLoginTitle: 'छिटो लगइन गरेर सुरु गर्नुहोस्',
      quickLoginDesc: 'समस्या राख्न, समाचार हाल्न र सहयोग गर्न केही मिनेटमै लगइन गर्नुहोस्।',
      login: 'लगइन',
      register: 'खाता बनाउनुहोस्',
      whyTitle: 'किन आवाज नेपाल?',
      whySubtitle: 'आवाज उठाउन आवश्यक सबै कुरा यहाँ छ',
      newsTitle: 'समुदाय समाचार',
      newsSubtitle: 'स्थानीय अपडेट सबैले हेर्न सक्ने',
      latestNews: 'नयाँ समाचार',
      postNews: 'समाचार पोस्ट गर्नुहोस्',
      postNewsHint: 'समाचार पोस्ट गर्न लगइन गर्नुहोस्।',
      newsTitlePlaceholder: 'समाचार शीर्षक',
      newsBodyPlaceholder: 'छोटो सारांश',
      newsLinkPlaceholder: 'ऐच्छिक लिंक',
      postNewsButton: 'समाचार पोस्ट',
      goldTitle: 'आजको सुनचाँदीको भाउ',
      goldSubtitle: 'लाइभ नेपाली बजार दर (रु)',
      goldPriceLabel: 'आजका दरहरू',
      goldLastUpdated: 'अन्तिम अपडेट',
      goldError: 'हाल सुन/चाँदीको दर ल्याउन सकेनौं।',
      marketDashboardTitle: 'लाइभ बाजार मूल्य',
      marketDashboardSubtitle: 'क्रिप्टो र स्टक — रियल-टाइम',
      marketDisclaimer: '⚠️ कानूनी सूचना: यो जानकारी शैक्षिक र सूचनात्मक उद्देश्यको लागि मात्र हो। यो निवेश सल्लाह, वित्तीय सल्लाह वा कानूनी सल्लाह होइन। दर विलम्बित हुन सक्छन्। क्रिप्टो र स्टक बजार उच्च जोखिमको हुन्छ। निवेश गर्नु पहिले लाइसेन्स प्राप्त वित्तीय सलाहदाता, निवेश पेशेवर र वकिलको परामर्श लिनुहोस्। आवाज नेपाल यस जानकारीमा निर्भर गरेर भएको हानिको लागि कुनै उत्तरदायित्व लिंदैन। यो डेटा हेरेर तपाई सबै जोखिम मान्न सहमत हुनुहुन्छ।',
      marketError: 'बाजार डेटा लोड गर्न सकेन।',
      marketUpdated: 'अपडेट',
      topIssuesTitle: 'अहिलेका शीर्ष मुद्दा',
      topIssuesSubtitle: 'सबैभन्दा बढी समर्थन भएका समस्या',
      viewAll: 'सबै हेर्नुहोस् →',
      noPosts: 'अहिलेसम्म कुनै पोस्ट छैन — तपाईंले नै सुरु गर्नुहोस्!',
      comingSoon: 'छिट्टै आउने',
      whatsNext: 'अर्को अपडेटहरू',
      whatsNextSubtitle: 'तपाईंका लागि बनाइँदै गरेका फिचरहरू',
      supportTitle: 'आवाज नेपाललाई सहयोग गर्नुहोस्',
      supportDesc:
        'आवाज नेपाल सबैका लागि निःशुल्क छ। सर्भर, विकास र सुधारका लागि तपाईंको सहयोग चाहिन्छ।',
      faqTitle: 'बारम्बार सोधिने प्रश्न',
      faqSubtitle: 'जान्नुपर्ने सबै कुरा',
      pagesRights: 'पृष्ठ तथा अधिकार',
      quickLinks: 'छिटो लिंकहरू',
      social: 'सामाजिक',
      features: [
        {
          icon: Megaphone,
          title: 'आवाज उठाउनुहोस्',
          desc: 'कुनै पनि सार्वजनिक समस्या पोस्ट गरी देशभर देखिने बनाउनुहोस्।',
          color: 'text-red-500',
          bg: 'bg-red-50 dark:bg-red-900/20',
        },
        {
          icon: MapPin,
          title: 'जिल्ला तहमा पहुँच',
          desc: 'समस्या जिल्ला अनुसार ट्याग गर्दा स्थानीय निकायले छिटो प्रतिक्रिया दिन सक्छ।',
          color: 'text-blue-500',
          bg: 'bg-blue-50 dark:bg-blue-900/20',
        },
        {
          icon: Users,
          title: 'समुदायको समर्थन',
          desc: 'लाइक र टिप्पणीले अत्यावश्यक समस्या माथि ल्याउँछ।',
          color: 'text-green-500',
          bg: 'bg-green-50 dark:bg-green-900/20',
        },
        {
          icon: MessageSquare,
          title: 'खुला छलफल',
          desc: 'समाधान खोज्न, प्रमाण साझा गर्न र समुदायसँग सहकार्य गर्न।',
          color: 'text-purple-500',
          bg: 'bg-purple-50 dark:bg-purple-900/20',
        },
        {
          icon: ShieldCheck,
          title: 'प्रमाणित खाता',
          desc: 'सुरक्षित लगइन र प्रमाणित खाताले प्लेटफर्मलाई भरोसायोग्य बनाउँछ।',
          color: 'text-orange-500',
          bg: 'bg-orange-50 dark:bg-orange-900/20',
        },
        {
          icon: Globe,
          title: 'द्विभाषिक पहुँच',
          desc: 'अङ्ग्रेजी र नेपाली दुवैमा प्रयोग गर्न सकिने।',
          color: 'text-teal-500',
          bg: 'bg-teal-50 dark:bg-teal-900/20',
        },
      ],
      upcoming: [
        { icon: Bell, title: 'सूचना प्रणाली', desc: 'पोस्ट ट्रेन्ड वा अधिकारीले हेर्दा सूचना आउँछ।' },
        { icon: Rocket, title: 'सरकारी ड्यासबोर्ड', desc: 'प्रमाणित अधिकारीले प्रतिक्रिया र अपडेट दिन सक्छन्।' },
        { icon: TrendingUp, title: 'ट्रेन्ड रिपोर्ट', desc: 'हप्तावार/मासिक तथ्यांक र ट्रेन्ड विश्लेषण।' },
        { icon: HeartHandshake, title: 'एनजिओ + मिडिया सहयोग', desc: 'एनजिओ र मिडियासँग प्रत्यक्ष सहकार्य।' },
      ],
      faqs: [
        {
          q: 'के यो राजनीतिज्ञ वा सरकारी कार्यालयका लागि उपयोगी छ?',
          a: 'हो। आवाज नेपालले जनताको प्राथमिकता तुरुन्त देखाउँछ र छिटो प्रतिक्रिया दिन मद्दत गर्छ।',
        },
        {
          q: 'कसले पोस्ट गर्न सक्छ?',
          a: 'प्रमाणित खाता भएको कुनै पनि नागरिकले पोस्ट गर्न सक्छ।',
        },
        {
          q: 'लाइक/डिसलाइक कसरी काम गर्छ?',
          a: 'लाइकले दृश्यता बढाउँछ। डिसलाइकले भावनात्मक संकेत दिन्छ तर पोस्ट हट्दैन।',
        },
        {
          q: 'यो सरकारी प्लेटफर्म हो?',
          a: 'होइन। आवाज नेपाल स्वतन्त्र नागरिक मञ्च हो।',
        },
        {
          q: 'अधिकारीले जवाफ दिन सक्छन्?',
          a: 'छिट्टै प्रमाणित अधिकारिक ब्याज र प्रतिक्रिया सुविधा आउँदै छ।',
        },
      ],
    };
  }

  return {
    heroBadge: 'Voice of Nepali Citizens',
    heroLead:
      'A free platform for every Nepali citizen to raise civic problems, demand accountability, and create change together.',
    heroSub: 'नेपालका समस्याहरूमा आवाज उठाउने एकमात्र मञ्च।',
    joinFree: 'Join Free',
    browseIssues: 'Browse Issues',
    raiseVoice: 'Raise Your Voice',
    quickLoginTitle: 'Quick Login for Action',
    quickLoginDesc: 'Sign in to post issues, add news updates, and support civic action in minutes.',
    login: 'Log In',
    register: 'Create Account',
    whyTitle: 'Why Awaaz Nepal?',
    whySubtitle: 'Everything you need to make your voice heard',
    newsTitle: 'Community News',
    newsSubtitle: 'Local updates visible across the platform',
    latestNews: 'Latest News',
    postNews: 'Post News Update',
    postNewsHint: 'Log in to post news updates.',
    newsTitlePlaceholder: 'News title',
    newsBodyPlaceholder: 'Short summary',
    newsLinkPlaceholder: 'Optional link',
    postNewsButton: 'Post News',
    goldTitle: 'Gold & Silver Prices',
    goldSubtitle: 'Live Nepali market rates (NPR)',
    goldPriceLabel: 'Today rates',
    goldLastUpdated: 'Last updated',
    goldError: 'Unable to fetch gold/silver prices right now.',
    marketDashboardTitle: 'Live Market Prices',
    marketDashboardSubtitle: 'Crypto & Stocks — Real-time',
    marketDisclaimer: '⚠️ LEGAL DISCLAIMER: This information is for educational and informational purposes only. NOT investment advice, NOT financial advice, and NOT legal advice. Prices may be delayed. Crypto and stock markets carry significant risk. Consult a licensed financial advisor, investment professional, and lawyer before making any investment or trading decisions. Awaaz Nepal assumes no liability for losses resulting from reliance on this information. By viewing this data, you agree to assume all associated risks.',
    marketError: 'Unable to load market data.',
    marketUpdated: 'Updated',
    topIssuesTitle: 'Top Issues Right Now',
    topIssuesSubtitle: 'Most supported problems across Nepal',
    viewAll: 'View all →',
    noPosts: 'No posts yet — be the first to raise your voice!',
    comingSoon: 'Coming Soon',
    whatsNext: "What's Next",
    whatsNextSubtitle: "Features we're building for you",
    supportTitle: 'Support Awaaz Nepal',
    supportDesc:
      'Awaaz Nepal is free for every citizen. We rely on community support to keep the servers running, improve the platform, and fight for Nepali voices.',
    faqTitle: 'Frequently Asked Questions',
    faqSubtitle: 'Everything you need to know',
    pagesRights: 'Pages & Rights',
    quickLinks: 'Quick Links',
    social: 'Social',
    features: [
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
    ],
    upcoming: [
      { icon: Bell, title: 'Push Notifications', desc: 'Get alerts when your post trends or receives official attention.' },
      { icon: Rocket, title: 'Authority Dashboard', desc: 'Verified officials can respond and update actions taken.' },
      { icon: TrendingUp, title: 'Trend Reports', desc: 'Weekly insights for journalists, activists, and policymakers.' },
      { icon: HeartHandshake, title: 'NGO + Media Integration', desc: 'Direct collaboration with NGOs and media partners.' },
    ],
    faqs: [
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
    ],
  };
}

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
  const language = useSyncExternalStore<'en' | 'np'>(
    (callback) => {
      if (typeof window === 'undefined') return () => {};
      const handler = () => callback();
      window.addEventListener('storage', handler);
      window.addEventListener('language-change', handler);
      return () => {
        window.removeEventListener('storage', handler);
        window.removeEventListener('language-change', handler);
      };
    },
    () => (localStorage.getItem('awaaz-lang') === 'np' ? 'np' : 'en'),
    () => 'en'
  );
  const content = getContent(language);
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

  const [goldItems, setGoldItems] = useState<{ id: number; label: string; value: string }[]>([]);
  const [goldUpdatedAt, setGoldUpdatedAt] = useState<string>('');
  const [goldLoading, setGoldLoading] = useState(true);
  const [goldError, setGoldError] = useState('');

  const [marketItems, setMarketItems] = useState<any[]>([]);
  const [marketLoading, setMarketLoading] = useState(true);
  const [marketError, setMarketError] = useState('');
  const [marketUpdatedAt, setMarketUpdatedAt] = useState<string>('');

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

  useEffect(() => {
    let active = true;

    const fetchGoldPrice = async () => {
      setGoldLoading(true);
      setGoldError('');
      try {
        const response = await fetch('/api/gold-price');
        if (!response.ok) {
          throw new Error('Request failed');
        }
        const data = await response.json();
        if (!active) return;
        setGoldItems(Array.isArray(data?.items) ? data.items : []);
        setGoldUpdatedAt(data?.updated_at ?? '');
      } catch (error) {
        if (!active) return;
        setGoldError(content.goldError);
        setGoldItems([]);
      } finally {
        if (!active) return;
        setGoldLoading(false);
      }
    };

    fetchGoldPrice();
    const interval = setInterval(fetchGoldPrice, 5 * 60 * 1000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [content.goldError]);

  useEffect(() => {
    let active = true;

    const fetchMarketPrice = async () => {
      setMarketLoading(true);
      setMarketError('');
      try {
        const response = await fetch('/api/market-price');
        if (!response.ok) {
          throw new Error('Request failed');
        }
        const data = await response.json();
        if (!active) return;
        // Show both cryptos and stocks
        const allItems = [...(data.cryptos || []), ...(data.stocks || [])];
        setMarketItems(allItems);
        setMarketUpdatedAt(data?.updated_at ?? '');
      } catch (error) {
        if (!active) return;
        setMarketError(content.marketError);
        setMarketItems([]);
      } finally {
        if (!active) return;
        setMarketLoading(false);
      }
    };

    fetchMarketPrice();
    const interval = setInterval(fetchMarketPrice, 30 * 1000); // 30 seconds

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [content.marketError]);

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
      <section className="bg-gray-900 text-white py-2 shimmer-bar">
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
        <section className="relative mb-14 overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white via-red-50/30 to-blue-50/30 dark:from-gray-900 dark:via-red-950/20 dark:to-blue-950/20 animate-hero-glow mt-6 bg-sweep">
          <div className="flex flex-col-reverse sm:flex-row items-center gap-4 sm:gap-6 p-6 md:p-10">
            <div className="flex-1 text-center md:text-left z-10 animate-hero-fade-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-full text-sm font-medium mb-4 animate-float-slow">
                <Sparkles className="w-4 h-4" />
                {content.heroBadge}
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-3 leading-tight">
                {APP_NAME}{' '}
                <span className="text-lg md:text-2xl text-gray-400">({APP_NAME_NP})</span>
              </h1>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-lg mb-6">
                {content.heroLead}
                <br />
                <span className="text-xs">{content.heroSub}</span>
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                {user ? (
                  <Link
                    href="/post/create"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-blue-600 text-white rounded-2xl font-semibold hover:scale-105 hover:shadow-xl transition-all duration-300 shadow-lg shadow-red-500/20 text-sm"
                  >
                    <PlusCircle className="w-5 h-5" />
                    {content.raiseVoice}
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/auth/register"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-blue-600 text-white rounded-2xl font-semibold hover:scale-105 hover:shadow-xl transition-all duration-300 shadow-lg shadow-red-500/20 text-sm"
                    >
                      {content.joinFree}
                    </Link>
                    <Link
                      href="/feed"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                    >
                      {content.browseIssues}
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="w-28 h-36 sm:w-40 sm:h-52 md:w-56 md:h-72 flex-shrink-0 animate-hero-scale-in float-orbit">
              <NepalFlag />
            </div>
          </div>
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-red-200/20 dark:bg-red-800/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-blue-200/20 dark:bg-blue-800/10 rounded-full blur-3xl pointer-events-none" />
        </section>

        {/* Quick Login CTA */}
        <section className="mb-14 section-reveal">
          <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white/85 dark:bg-gray-900/70 backdrop-blur p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm hover-float">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">
                {content.quickLoginTitle}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {content.quickLoginDesc}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                {content.login}
              </Link>
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-gray-300 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <CircleUserRound className="w-4 h-4" />
                {content.register}
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mb-16 section-reveal-delay-1">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">{content.whyTitle}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{content.whySubtitle}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {content.features.map((f) => (
              <div
                key={f.title}
                className="feature-card p-6 rounded-2xl cursor-default"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                  e.currentTarget.style.setProperty('--mouse-x', `${x}%`);
                  e.currentTarget.style.setProperty('--mouse-y', `${y}%`);
                }}
              >
                <div className="card-spotlight" />
                <div className={`card-icon-wrap w-11 h-11 rounded-xl ${f.bg} flex items-center justify-center mb-4 relative z-10`}>
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1.5 relative z-10">{f.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed relative z-10">{f.desc}</p>
                <div className="card-accent" />
              </div>
            ))}
          </div>
        </section>

        {/* News Create (auth only) */}
        <section className="mb-16 section-reveal-delay-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">{content.newsTitle}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{content.newsSubtitle}</p>
            </div>
            <Link href="/feed" className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline">
              {content.viewAll}
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/85 dark:bg-gray-900/70 p-5 shadow-sm hover-float">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{content.latestNews}</h3>
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

            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/85 dark:bg-gray-900/70 p-5 shadow-sm hover-float">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{content.postNews}</h3>
              {!user ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">{content.postNewsHint}</p>
              ) : (
                <form onSubmit={handleCreateNews} className="space-y-3">
                  {newsError && (
                    <div className="text-xs text-red-600 dark:text-red-400">{newsError}</div>
                  )}
                  <input
                    value={newsTitle}
                    onChange={(e) => setNewsTitle(e.target.value)}
                    placeholder={content.newsTitlePlaceholder}
                    className="w-full px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 border border-transparent focus:border-blue-500 text-sm outline-none"
                  />
                  <textarea
                    value={newsBody}
                    onChange={(e) => setNewsBody(e.target.value)}
                    placeholder={content.newsBodyPlaceholder}
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 border border-transparent focus:border-blue-500 text-sm outline-none resize-none"
                  />
                  <input
                    value={newsLink}
                    onChange={(e) => setNewsLink(e.target.value)}
                    placeholder={content.newsLinkPlaceholder}
                    className="w-full px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 border border-transparent focus:border-blue-500 text-sm outline-none"
                  />
                  <button
                    type="submit"
                    disabled={newsSaving}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-blue-600 text-white text-sm font-semibold disabled:opacity-60"
                  >
                    {newsSaving ? 'Posting...' : content.postNewsButton}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* Gold Price */}
        <section className="mb-16 section-reveal">
          <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white/85 dark:bg-gray-900/70 p-6 sm:p-8 shadow-sm card-glow">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">{content.goldTitle}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{content.goldSubtitle}</p>
              </div>
              {goldUpdatedAt && (
                <div className="text-xs text-gray-400 dark:text-gray-500">
                  {content.goldLastUpdated}: {goldUpdatedAt}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-950/40 p-5 flex flex-col gap-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">{content.goldPriceLabel}</div>
              {goldLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                </div>
              ) : goldError ? (
                <div className="text-sm text-red-500">{goldError}</div>
              ) : goldItems.length === 0 ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">--</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                  {goldItems.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/70 px-4 py-3 hover-float"
                    >
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{item.label}</div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">{item.value || '--'}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>



        {/* Market Dashboard */}
        <section className="mb-16 section-reveal">
          <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white/85 dark:bg-gray-900/70 p-6 sm:p-8 shadow-sm card-glow">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">{content.marketDashboardTitle}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{content.marketDashboardSubtitle}</p>
              </div>
              {marketUpdatedAt && (
                <div className="text-xs text-gray-400 dark:text-gray-500">
                  {content.marketUpdated}: {marketUpdatedAt}
                </div>
              )}
            </div>

            <div className="space-y-4">
              {marketLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 py-8">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading market data...
                </div>
              ) : marketError ? (
                <div className="text-sm text-red-500 py-8">{marketError}</div>
              ) : marketItems.length === 0 ? (
                <div className="text-sm text-gray-500 dark:text-gray-400 py-8">No market data available.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {marketItems.map((item, idx) => {
                    const isPositive = (item.change ?? 0) >= 0;
                    return (
                      <div
                        key={idx}
                        className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/50 px-4 py-5 hover-float transition-all hover:border-gray-300 dark:hover:border-gray-700"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">{item.symbol}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{item.name}</div>
                          </div>
                          <div className={`text-2xl ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                            {item.icon || '📊'}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-xl font-bold text-gray-900 dark:text-white">
                            ${item.price?.toFixed(2) || '--'}
                          </div>
                          <div
                            className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold ${
                              isPositive
                                ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                                : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'
                            }`}
                          >
                            {isPositive ? '+' : ''}{item.change?.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Disclaimer for Market Data */}
            <div className="mt-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 p-3 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              {content.marketDisclaimer}
            </div>
          </div>
        </section>

        {/* Top Posts */}
        <section className="mb-16 section-reveal-delay-1">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">{content.topIssuesTitle}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{content.topIssuesSubtitle}</p>
            </div>
            <Link href="/feed" className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline">
              {content.viewAll}
            </Link>
          </div>
          {loadingPosts ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-900/60 shadow-sm">
              <Megaphone className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">{content.noPosts}</p>
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
              <Rocket className="w-3.5 h-3.5" /> {content.comingSoon}
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">{content.whatsNext}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{content.whatsNextSubtitle}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {content.upcoming.map((u) => (
              <div key={u.title} className="flex gap-4 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/85 dark:bg-gray-900/70 shadow-sm hover-float">
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
        <section className="mb-16 section-reveal-delay-2">
          <div className="relative overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-red-50 to-blue-50 dark:from-red-950/30 dark:to-blue-950/30 p-8 text-center bg-sweep">
            <HeartHandshake className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-3">{content.supportTitle}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-lg mx-auto mb-6">
              {content.supportDesc}
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
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">{content.faqTitle}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{content.faqSubtitle}</p>
          </div>
          <div className="space-y-2 max-w-2xl mx-auto">
            {content.faqs.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </section>

        {/* Footer Links */}
        <section className="pb-16">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white mb-2">{content.pagesRights}</p>
              <div className="space-y-1 text-gray-500 dark:text-gray-400">
                <Link href="/about" className="hover:text-gray-900 dark:hover:text-white">About</Link>
                <Link href="/terms" className="hover:text-gray-900 dark:hover:text-white">Terms of Service</Link>
                <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-white">Privacy Policy</Link>
                <Link href="/feed" className="hover:text-gray-900 dark:hover:text-white">All Issues</Link>
              </div>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white mb-2">{content.quickLinks}</p>
              <div className="space-y-1 text-gray-500 dark:text-gray-400">
                <Link href="/auth/login" className="hover:text-gray-900 dark:hover:text-white">Login</Link>
                <Link href="/auth/register" className="hover:text-gray-900 dark:hover:text-white">Register</Link>
                <Link href="/post/create" className="hover:text-gray-900 dark:hover:text-white">Raise a Voice</Link>
              </div>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white mb-2">{content.social}</p>
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
