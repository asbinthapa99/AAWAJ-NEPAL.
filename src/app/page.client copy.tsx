'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import NepalFlag from '@/components/NepalFlag3D';
import { CryptoDashboard } from '@/components/CryptoDashboard';
import { ParticlesBackground } from '@/components/ParticlesBackground';
import ThemeToggle from '@/components/ThemeToggle';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { APP_NAME, APP_NAME_NP } from '@/lib/constants';
import {
  Dropdown,
  DropdownItem,
} from '@/components/ui/Dropdown';
import {
  Megaphone,
  TrendingUp,
  Loader2,
  ShieldCheck,
  Globe,
  Bell,
  Users,
  MapPin,
  MessageSquare,
  Newspaper,
  ChevronDown,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Lock,
  Flame,
  Heart,
  MessageCircle,
  Eye,
  Bookmark,
  ThumbsUp,
  Sparkles,
  Zap,
  Star,
  Code2,
  ExternalLink,
  Github,
  Upload,
  Vote,
  Award,
  Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

// --- TEXT CONTENT ---
function getContent(lang: 'en' | 'np') {
  if (lang === 'np') {
    return {
      heroBadge: 'नागरिक उत्तरदायित्व मञ्च',
      heroLead: 'नेपालका समस्याहरूमा आवाज उठाउने, उत्तरदायित्व खोज्ने र परिवर्तन ल्याउने मुक्त मञ्च।',
      heroSub: 'तपाईंको क्षेत्रको पहिलो रिपोर्टर बन्नुहोस्।',
      joinFree: 'सुरु गर्नुहोस्',
      browseIssues: 'समस्याहरू हेर्नुहोस्',
      stats: { users: '१०,०००+', issues: '५,०००+', resolved: '१,२००+' },
      howItWorksTitle: 'कसरी काम गर्छ?',
      howItWorks: [
        { title: 'समस्या पोस्ट गर्नुहोस्', desc: 'आफ्नो क्षेत्रको समस्या फोटो र विवरणसहित राख्नुहोस्।' },
        { title: 'समर्थन जुटाउनुहोस्', desc: 'समुदायले तपाईंको पोस्टमा लाइक र भोट गरेर दृश्यता बढाउँछन्।' },
        { title: 'समाधान खोज्नुहोस्', desc: 'अधिकारी र सरोकारवालाहरूले प्रत्यक्ष प्रतिक्रिया दिन्छन्।' },
      ],
      featuresTitle: 'तपाईंको आवाज सुनिनेछ',
      features: [
        { icon: MapPin, title: 'जिल्ला अनुसार ट्र्याकिङ', desc: 'हरेक समस्यालाई जिल्ला र गाउँपालिकासम्म ट्र्याक गरिन्छ।' },
        { icon: ShieldCheck, title: 'प्रमाणित रिपोर्टहरू', desc: 'स्पाम रोक्न सुरक्षित र प्रमाणित खाता प्रणाली।' },
        { icon: BarChart3, title: 'प्रत्यक्ष तथ्यांक', desc: 'कुन क्षेत्रमा कस्ता समस्या छन् भन्ने प्रत्यक्ष डेटा हेर्नुहोस्।' },
        { icon: Users, title: 'समुदायको शक्ति', desc: 'तपाईं एक्लो हुनुहुन्न। हजारौं नागरिकहरूको साथ छ।' },
      ],
      trustTitle: 'सुरक्षित र विश्वसनीय',
      faqTitle: 'बारम्बार सोधिने प्रश्न',
      faqs: [
        { q: 'के यो सरकारी मञ्च हो?', a: 'होइन। यो नागरिकहरूद्वारा सञ्चालित एक स्वतन्त्र नागरिक प्रविधि मञ्च हो।' },
        { q: 'के मेरो जानकारी सुरक्षित रहन्छ?', a: 'तपाईंको गोपनीयता र डाटा सुरक्षा हाम्रो पहिलो प्राथमिकता हो। तपाईंको सटीक स्थान पूर्व स्वीकृति बिना कहिल्यै साझा गरिँदैन।' },
        { q: 'के म अज्ञात रूपमा पोस्ट गर्न सक्छु?', a: 'हो। बोटहरू रोक्न खाता प्रमाणीकरण आवश्यक भए तापनि, तपाईंले संवेदनशील समस्याहरूको लागि व्यक्तिगत पोस्टहरूमा आफ्नो नाम लुकाउन सक्नुहुन्छ।' },
        { q: 'अधिकारीले कसरी जवाफ दिन्छन्?', a: 'प्रमाणित सरकारी अधिकारीहरूले विशेष ड्यासबोर्ड मार्फत ट्रेन्डिङ समस्याहरूमा आधिकारिक अपडेटहरू दिन सक्छन्।' },
        { q: 'के यो मञ्च निःशुल्क हो?', a: 'हो। यो मञ्च सबै नागरिकहरूको लागि १००% निःशुल्क हो र सधैं रहनेछ।' },
        { q: 'ट्रेन्डिङ समस्याहरूलाई के हुन्छ?', a: 'समुदायको महत्त्वपूर्ण समर्थन प्राप्त गरेका समस्याहरूलाई स्थानीय एजेन्सीहरू र गैरसरकारी संस्थाहरूद्वारा प्रत्यक्ष हस्तक्षेपको लागि प्राथमिकता दिइन्छ।' },
      ],
      footerPages: 'नीति र नियमहरू',
      goldTitle: 'नेपाली बजार अद्यावधिक',
    };
  }

  return {
    heroBadge: 'Civic Accountability Platform',
    heroLead: 'Raise civic problems, demand accountability, and create real change in Nepal.',
    heroSub: 'Be the first reporter in your district.',
    joinFree: 'Start Free',
    browseIssues: 'Browse Issues',
    stats: { users: '10,000+', issues: '5,000+', resolved: '1,200+' },
    howItWorksTitle: 'How It Works',
    howItWorks: [
      { title: 'Report an Issue', desc: 'Post a localized civic problem with photos and exact location.' },
      { title: 'Gather Support', desc: 'The community upvotes and verifies the issue, raising its visibility.' },
      { title: 'Drive Resolution', desc: 'Local leaders and officials see trending issues and provide official status updates.' },
    ],
    featuresTitle: 'Built for Action',
    features: [
      { icon: MapPin, title: 'Hyper-Local Tracking', desc: 'Issues are strictly categorized by district and municipality for rapid targeting.' },
      { icon: ShieldCheck, title: 'Verified Activity', desc: 'Strict authentication prevents spam and ensures every voice belongs to a real citizen.' },
      { icon: BarChart3, title: 'Open Analytics', desc: 'Access public dashboards showing which districts resolve the most issues.' },
      { icon: Users, title: 'Community Driven', desc: 'Algorithms prioritize issues based on local demographic validation.' },
    ],
    trustTitle: 'Transparent & Secure',
    faqTitle: 'Frequently Asked Questions',
    faqs: [
      { q: 'Is this a government platform?', a: 'No. GuffGaff is an independent civic tech platform built by and for the public.' },
      { q: 'Is my data secure?', a: 'Yes. We use enterprise-grade encryption and strict data minimization policies. Your precise location is never shared without explicit consent.' },
      { q: 'Can I post anonymously?', a: 'While we require account verification to prevent bots, you can choose to hide your name on individual posts for sensitive issues.' },
      { q: 'How do officials respond?', a: 'Verified government officials receive special dashboard access to post binding status updates on trending issues.' },
      { q: 'Is this platform free?', a: 'Yes. The civic accountability tools are 100% free for all citizens.' },
      { q: 'What happens to trending issues?', a: 'Issues that gain significant community traction are prioritized for direct intervention by partnered local agencies and NGOs.' },
    ],
    footerPages: 'Legal & Policies',
    goldTitle: 'Live Market Updates',
  };
}

// --- COMMUNITY POST CARDS ---
const DUMMY_POSTS = [
  {
    id: 1,
    category: 'Infrastructure',
    categoryColor: '#f97316',
    categoryBg: 'rgba(249,115,22,0.12)',
    title: 'Broken road near Kalanki has caused 3 accidents this month alone',
    body: 'The pothole-ridden stretch on Ring Road near Kalanki has been ignored for over 8 months. Three minor accidents have been reported. Local ward office refuses to address the issue.',
    district: 'Kathmandu',
    upvotes: 847,
    comments: 124,
    views: 3241,
    timeAgo: '2h ago',
    author: 'Ramesh K.',
    authorInitials: 'RK',
    authorColor: '#6366f1',
    trending: true,
  },
  {
    id: 2,
    category: 'Water Supply',
    categoryColor: '#06b6d4',
    categoryBg: 'rgba(6,182,212,0.12)',
    title: 'No water supply for 12 consecutive days in Baneshwor area',
    body: 'Residents of Baneshwor ward 10 have had zero water supply for nearly two weeks. KUKL has not responded to multiple complaints filed through their portal.',
    district: 'Kathmandu',
    upvotes: 612,
    comments: 89,
    views: 2108,
    timeAgo: '5h ago',
    author: 'Sunita M.',
    authorInitials: 'SM',
    authorColor: '#06b6d4',
    trending: false,
  },
  {
    id: 3,
    category: 'Education',
    categoryColor: '#a855f7',
    categoryBg: 'rgba(168,85,247,0.12)',
    title: 'School in Pokhara lacks basic toilets for 400+ students',
    body: 'Prithvi Secondary School in Pokhara-12 has only 2 functional toilets for over 400 students. Girls frequently miss classes due to the lack of facilities.',
    district: 'Kaski',
    upvotes: 1203,
    comments: 198,
    views: 5870,
    timeAgo: '1d ago',
    author: 'Anita S.',
    authorInitials: 'AS',
    authorColor: '#a855f7',
    trending: true,
  },
  {
    id: 4,
    category: 'Health',
    categoryColor: '#ef4444',
    categoryBg: 'rgba(239,68,68,0.12)',
    title: 'Dharan hospital running out of essential medicines every week',
    body: 'BP Koirala Institute patients are being asked to buy medicines from outside the hospital. This is the 6th consecutive week of shortage. No response from health ministry.',
    district: 'Sunsari',
    upvotes: 934,
    comments: 143,
    views: 4120,
    timeAgo: '3h ago',
    author: 'Dr. Bikash P.',
    authorInitials: 'BP',
    authorColor: '#ef4444',
    trending: false,
  },
  {
    id: 5,
    category: 'Environment',
    categoryColor: '#22c55e',
    categoryBg: 'rgba(34,197,94,0.12)',
    title: 'Bagmati river garbage dump growing unchecked for months',
    body: 'A massive illegal dumping site near Thapathali has been expanding without any intervention from Kathmandu Metropolitan City. The stench and health risk to nearby residents is severe.',
    district: 'Kathmandu',
    upvotes: 778,
    comments: 66,
    views: 2990,
    timeAgo: '6h ago',
    author: 'Nirmala R.',
    authorInitials: 'NR',
    authorColor: '#22c55e',
    trending: false,
  },
  {
    id: 6,
    category: 'Electricity',
    categoryColor: '#f59e0b',
    categoryBg: 'rgba(245,158,11,0.12)',
    title: 'Daily 8-hour load shedding returns to Chitwan districts',
    body: 'Despite NEA assurances, residents of Bharatpur and Ratnanagar are experiencing 8–10 hours of daily power cuts. Businesses and hospitals are under severe strain.',
    district: 'Chitwan',
    upvotes: 1455,
    comments: 231,
    views: 6800,
    timeAgo: '12h ago',
    author: 'Pradeep G.',
    authorInitials: 'PG',
    authorColor: '#f59e0b',
    trending: true,
  },
];

function PostCard({ post, idx }: { post: typeof DUMMY_POSTS[0]; idx: number }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <div
      className="post-card group relative flex flex-col rounded-2xl border border-border/50 bg-card hover:border-border transition-all duration-300 overflow-hidden cursor-pointer"
      style={{ animationDelay: `${idx * 80}ms` }}
    >
      {/* Top accent line — subtle, color only */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-30 group-hover:opacity-80 transition-opacity duration-400"
        style={{ background: `linear-gradient(90deg, transparent, ${post.categoryColor}, transparent)` }}
      />

      <div className="relative z-10 p-4 flex flex-col gap-3">
        {/* Header: category badge + time */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase"
              style={{ color: post.categoryColor, background: post.categoryBg }}
            >
              {post.category}
            </span>
            {post.trending && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-orange-500/80">
                <Flame className="w-2.5 h-2.5" /> Hot
              </span>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground tabular-nums">{post.timeAgo}</span>
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-foreground leading-snug tracking-tight">
          {post.title}
        </h3>

        {/* Body — 2 lines */}
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {post.body}
        </p>

        {/* District — muted, no color background */}
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground/70">
          <MapPin className="w-3 h-3 shrink-0" />
          <span>{post.district}</span>
        </div>

        {/* Divider */}
        <div className="h-px bg-border/50" />

        {/* Footer: avatar + stats */}
        <div className="flex items-center justify-between gap-2">
          {/* Author */}
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0"
              style={{ background: `linear-gradient(135deg, ${post.authorColor}, ${post.categoryColor})` }}
            >
              {post.authorInitials}
            </div>
            <span className="text-[11px] font-medium text-muted-foreground">{post.author}</span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}
              className="flex items-center gap-1 text-[11px] transition-all duration-200 hover:scale-110 active:scale-95"
            >
              <ThumbsUp className={`w-3 h-3 transition-colors ${liked ? 'fill-current text-primary' : 'text-muted-foreground'}`} />
              <span className={liked ? 'text-primary font-semibold' : 'text-muted-foreground'}>{liked ? post.upvotes + 1 : post.upvotes}</span>
            </button>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <MessageCircle className="w-3 h-3" />
              <span>{post.comments}</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setSaved(!saved); }}
              className="transition-all duration-200 hover:scale-110 active:scale-95"
            >
              <Bookmark className={`w-3 h-3 transition-colors ${saved ? 'fill-current text-primary' : 'text-muted-foreground'}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FAQItem({ q, a, isLast }: { q: string; a: string; isLast?: boolean }) {

  const [open, setOpen] = useState(false);
  return (
    <div className={`bg-card overflow-hidden transition-all duration-200 ${!isLast ? 'border-b border-border/60' : ''}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 text-left font-medium text-foreground hover:text-primary transition-colors focus:outline-none"
      >
        <span className="font-semibold pr-4">{q}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div
        className="px-6 text-sm text-muted-foreground overflow-hidden transition-all duration-300 ease-in-out bg-card"
        style={{ maxHeight: open ? '300px' : '0', opacity: open ? 1 : 0, paddingBottom: open ? '1.5rem' : '0' }}
      >
        <div className="pt-2 leading-relaxed">{a}</div>
      </div>
    </div>
  );
}

// --- MAIN PAGE ---
export default function HomeClient() {
  const language = useSyncExternalStore<'en' | 'np'>(
    (callback) => {
      if (typeof window === 'undefined') return () => { };
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

  const [goldItems, setGoldItems] = useState<{ id: number; label: string; value: string }[]>([]);
  const [goldUpdatedAt, setGoldUpdatedAt] = useState<string>('');
  const [goldLoading, setGoldLoading] = useState(true);
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) router.replace(`/auth/callback?code=${code}`);
  }, [searchParams, router]);

  useEffect(() => {
    if (user) router.replace('/dashboard');
  }, [user, router]);


  useEffect(() => {
    if (user) return;
    let active = true;
    const fetchGoldPrice = async () => {
      try {
        const response = await fetch('/api/gold-price');
        const data = await response.json();
        if (!active) return;
        setGoldItems(Array.isArray(data?.items) ? data.items : []);
        setGoldUpdatedAt(data?.updated_at ?? '');
      } catch {
        // quiet fail
      } finally {
        if (active) setGoldLoading(false);
      }
    };
    fetchGoldPrice();
    return () => { active = false; };
  }, [user]);

  if (user) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;


  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">

      {/* FLOATING NAVBAR - LEMURIAN STYLE */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-max px-4 pointer-events-none animate-fade-in-up" style={{ animationDuration: '0.8s' }}>
        <nav className="flex items-center justify-between gap-6 sm:gap-12 p-2 px-3 sm:px-4 bg-background/70 dark:bg-[#2A2B36]/90 backdrop-blur-2xl rounded-full shadow-2xl shadow-primary/5 border border-border/50 pointer-events-auto">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity shrink-0 pl-2">
            <Globe className="w-5 h-5" />
            <span className="font-medium text-sm hidden sm:block tracking-wide">{APP_NAME}</span>
          </Link>

          {/* Center Links (Desktop) */}
          <div className="hidden md:flex items-center gap-2 text-sm font-medium text-foreground/80">
            <a href="#about" className="px-5 py-2.5 rounded-full hover:bg-secondary hover:text-foreground transition-all">Features</a>
            <a href="#markets" className="px-5 py-2.5 rounded-full hover:bg-secondary hover:text-foreground transition-all">Markets</a>
            <a href="#faqs" className="px-5 py-2.5 rounded-full hover:bg-secondary hover:text-foreground transition-all">FAQs</a>
          </div>

          {/* Right Area: Toggles & Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Desktop Language Toggle */}
            <div className="hidden md:flex items-center gap-1 bg-secondary/50 rounded-full p-1 border border-border/50">
              <button
                onClick={() => { localStorage.setItem('awaaz-lang', 'en'); window.dispatchEvent(new Event('language-change')); }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${language === 'en' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                EN
              </button>
              <button
                onClick={() => { localStorage.setItem('awaaz-lang', 'np'); window.dispatchEvent(new Event('language-change')); }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${language === 'np' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                ने
              </button>
            </div>

            {/* Desktop Theme Toggle */}
            <div className="hidden md:block scale-90">
              <ThemeToggle />
            </div>

            {/* Desktop Login */}
            <Link href="/auth/login" className="px-5 py-2 rounded-full border border-border text-foreground text-sm font-medium hover:bg-secondary transition-colors whitespace-nowrap hidden md:block">
              Login
            </Link>

            {/* Always Visible Contact */}
            <a href="mailto:ihyaet@gmail.com" className="px-5 py-2 rounded-full bg-foreground text-background text-sm font-bold hover:opacity-90 transition-opacity whitespace-nowrap">
              Contact
            </a>

            {/* Mobile Menu Dropdown */}
            <div className="md:hidden block">
              <Dropdown
                align="right"
                className="w-56 mt-2 rounded-2xl border-border/60 bg-card/95 backdrop-blur-xl shadow-xl p-2"
                trigger={
                  <button className="p-2 rounded-full hover:bg-secondary text-foreground transition-colors outline-none focus:ring-2 focus:ring-primary/20">
                    <Menu className="w-5 h-5" />
                  </button>
                }
              >
                <div className="flex flex-col gap-1">
                  <DropdownItem className="rounded-xl px-4 py-3">
                    <a href="#about" className="text-sm font-medium w-full text-foreground relative z-10 block">Features</a>
                  </DropdownItem>
                  <DropdownItem className="rounded-xl px-4 py-3">
                    <a href="#markets" className="text-sm font-medium w-full text-foreground relative z-10 block">Markets</a>
                  </DropdownItem>
                  <DropdownItem className="rounded-xl px-4 py-3">
                    <a href="#faqs" className="text-sm font-medium w-full text-foreground relative z-10 block">FAQs</a>
                  </DropdownItem>

                  <div className="h-px bg-border/40 my-2 mx-2" />

                  <DropdownItem className="rounded-xl px-4 py-3">
                    <Link href="/auth/login" className="text-sm font-medium w-full text-foreground relative z-10 block">Login to Account</Link>
                  </DropdownItem>

                  <div className="h-px bg-border/40 my-2 mx-2" />

                  {/* Mobile Toggles */}
                  <div className="flex items-center justify-between px-4 py-2">
                    <div className="flex items-center gap-1 bg-secondary/50 rounded-full p-1 border border-border/50">
                      <button
                        onClick={(e) => { e.preventDefault(); localStorage.setItem('awaaz-lang', 'en'); window.dispatchEvent(new Event('language-change')); }}
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${language === 'en' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        EN
                      </button>
                      <button
                        onClick={(e) => { e.preventDefault(); localStorage.setItem('awaaz-lang', 'np'); window.dispatchEvent(new Event('language-change')); }}
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${language === 'np' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        ने
                      </button>
                    </div>
                    <div className="scale-90">
                      <ThemeToggle />
                    </div>
                  </div>
                </div>
              </Dropdown>
            </div>

          </div>
        </nav>
      </div>

      <main className="flex-1">

        {/* 2. HERO SECTION */}
        <section className="relative pt-28 pb-32 sm:pt-44 sm:pb-48 overflow-hidden">
          {/* Animated 3D Mesh Background */}
          <div className="mesh-bg" />

          <ParticlesBackground />

          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-primary/20 blur-[120px] rounded-full pointer-events-none opacity-50 dark:opacity-20" />

          <div className="container relative mx-auto px-4 sm:px-6 z-10 text-center flex flex-col items-center">

            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full backdrop-blur-md shadow-lg text-xs font-bold mb-8 animate-fade-in-up hero-badge"
              style={{ animationDelay: '0ms' }}
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-spin" style={{ animationDuration: '3s' }} />
              <span className="hero-badge-text">{content.heroBadge}</span>
              <Zap className="w-3 h-3 text-cyan-400" />
            </div>

            <h1
              className="text-5xl sm:text-6xl md:text-8xl font-black mb-6 max-w-5xl balance-text animate-fade-in-up tracking-tighter leading-[0.95]"
              style={{ animationDelay: '100ms' }}
            >
              <span className="hero-title-gradient">{APP_NAME}</span>
            </h1>

            <p className="text-lg sm:text-2xl font-normal max-w-3xl mb-12 leading-relaxed balance-text animate-fade-in-up tracking-tight" style={{ animationDelay: '200ms' }}>
              <span className="text-foreground/60">{content.heroLead.split(',')[0]},</span>
              {content.heroLead.includes(',') && (
                <span className="text-foreground/90 font-medium"> {content.heroLead.split(',').slice(1).join(',')}</span>
              )}
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-full text-base font-semibold shadow-lg shadow-primary/25 h-14 px-8 w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 transition-colors group"
              >
                {content.joinFree}
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/feed"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-full text-base font-semibold border border-input h-14 px-8 w-full sm:w-auto bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                {content.browseIssues}
              </Link>
            </div>

            {/* Stats / Proof Row */}
            <div className="mt-16 grid grid-cols-3 gap-8 sm:gap-16 pt-8 border-t border-border/30 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
              <div className="flex flex-col items-center group cursor-default">
                <span className="text-3xl font-black text-primary group-hover:scale-110 transition-transform duration-300 inline-block">
                  <AnimatedCounter value={10000} suffix="+" />
                </span>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mt-1 flex items-center gap-1">
                  <Users className="w-3 h-3 text-primary/70" /> Citizens
                </span>
              </div>
              <div className="flex flex-col items-center group cursor-default">
                <span className="text-3xl font-black text-primary group-hover:scale-110 transition-transform duration-300 inline-block">
                  <AnimatedCounter value={5000} suffix="+" />
                </span>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mt-1 flex items-center gap-1">
                  <Megaphone className="w-3 h-3 text-primary/70" /> Issues
                </span>
              </div>
              <div className="flex flex-col items-center group cursor-default">
                <span className="text-3xl font-black text-primary group-hover:scale-110 transition-transform duration-300 inline-block">
                  <AnimatedCounter value={1200} suffix="+" />
                </span>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-primary/70" /> Resolved
                </span>
              </div>
            </div>

          </div>
        </section>

        {/* 3. HOW IT WORKS (3-Step Flow) */}
        <section className="py-24 bg-transparent relative z-10 overflow-hidden">
          {/* Decorative floating badges */}
          <div className="absolute top-8 left-8 hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold animate-float">
            <Star className="w-3 h-3 fill-current" /> Step by Step
          </div>
          <div className="absolute top-8 right-8 hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold animate-float" style={{ animationDelay: '1.5s' }}>
            <Zap className="w-3 h-3" /> Simple
          </div>

          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-xs font-bold text-violet-400 mb-5">
                <Zap className="w-3.5 h-3.5" /> How it works
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight hiw-heading">{content.howItWorksTitle}</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Animated SVG Connecting Line */}
              <div className="hidden md:block absolute top-[28px] left-[16.6%] right-[16.6%] h-[2px] z-0 overflow-visible">
                <svg width="100%" height="2" className="overflow-visible absolute inset-0">
                  <line x1="0" y1="1" x2="100%" y2="1" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6" className="text-border" />
                  <line x1="0" y1="1" x2="100%" y2="1" stroke="url(#flow-gradient2)" strokeWidth="2" strokeDasharray="6 6" strokeDashoffset="100" className="animate-[dash_3s_linear_infinite]" />
                  <circle r="4" cy="1" className="fill-violet-500 drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]">
                    <animate attributeName="cx" from="0" to="100%" dur="3s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur="3s" repeatCount="indefinite" />
                  </circle>
                  <defs>
                    <linearGradient id="flow-gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0" />
                      <stop offset="50%" stopColor="#8b5cf6" stopOpacity="1" />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
                <style jsx>{`@keyframes dash { to { stroke-dashoffset: 0; } }`}</style>
              </div>

              {[{ icon: Upload, color: '#f97316', bg: 'rgba(249,115,22,0.12)' }, { icon: Vote, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' }, { icon: Award, color: '#10b981', bg: 'rgba(16,185,129,0.12)' }].map((stepMeta, idx) => (
                <div key={idx} className="relative z-10 flex flex-col items-center text-center group">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg mb-6 shadow-lg step-icon transition-all duration-500 group-hover:scale-125 group-hover:rotate-6 group-hover:shadow-xl"
                    style={{ background: stepMeta.bg, color: stepMeta.color, boxShadow: `0 8px 32px ${stepMeta.color}30`, border: `1.5px solid ${stepMeta.color}40` }}
                  >
                    <stepMeta.icon className="w-6 h-6" />
                  </div>
                  <div
                    className="text-[10px] font-black uppercase tracking-widest mb-2 px-2.5 py-0.5 rounded-full"
                    style={{ color: stepMeta.color, background: stepMeta.bg }}
                  >
                    Step {idx + 1}
                  </div>
                  <h3 className="text-xl font-bold mb-3 tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>{content.howItWorks[idx].title}</h3>
                  <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">{content.howItWorks[idx].desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. FEATURES BENTO GRID */}
        <section id="about" className="py-24 scroll-mt-32 relative bg-gradient-to-b from-transparent via-background to-primary/5">
          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-20 relative">
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/15 blur-[80px] rounded-full pointer-events-none" />
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-xs font-bold text-cyan-400 mb-6 shadow-sm">
                <Zap className="w-4 h-4" /> Platform Features
              </div>
              <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight features-heading">{content.featuresTitle}</h2>
              <p className="text-muted-foreground text-lg leading-relaxed">Everything you need to report problems and track them to resolution in one seamless application.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {content.features.map((feature, idx) => {
                let spanClass = "";
                // Premium offset layout
                if (idx === 0) spanClass = "md:col-span-2 lg:col-span-2 min-h-[280px]";
                else if (idx === 1) spanClass = "md:col-span-1 lg:col-span-1 lg:row-span-2 min-h-[280px]";
                else if (idx === 2) spanClass = "md:col-span-1 lg:col-span-1 min-h-[250px]";
                else if (idx === 3) spanClass = "md:col-span-1 lg:col-span-1 min-h-[250px]";

                return (
                  <div
                    key={idx}
                    className={`group relative overflow-hidden rounded-[2rem] border border-border/60 bg-card/60 backdrop-blur-sm hover:border-primary/40 transition-all duration-700 hover:shadow-2xl hover:shadow-primary/5 p-8 flex flex-col ${spanClass}`}
                  >
                    {/* Animated shine line */}
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />

                    {/* Hover Glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                    <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 shadow-inner border border-primary/10 flex items-center justify-center transform group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500 mb-auto">
                      <feature.icon className="w-8 h-8 text-primary" />
                    </div>

                    <div className="relative z-10 mt-8 transform group-hover:-translate-y-1 transition-transform duration-500">
                      <h3 className="text-2xl font-bold mb-3 text-foreground tracking-tight">{feature.title}</h3>
                      <p className="text-base text-muted-foreground leading-relaxed font-medium">{feature.desc}</p>
                    </div>
                  </div>
                );
              })}

              {/* ─── Premium Gold & Silver Market Widget ─── */}
              <div className="col-span-1 md:col-span-2 lg:col-span-3 mt-8">
                <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
                  {/* Widget Header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                        <TrendingUp className="w-4.5 h-4.5 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{content.goldTitle}</p>
                        <p className="text-[11px] text-muted-foreground">Nepal Bullion Market · Per Tola</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Live</span>
                    </div>
                  </div>

                  {/* Price Grid */}
                  {goldLoading ? (
                    <div className="flex items-center gap-2 px-5 py-6 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Syncing rates…</span>
                    </div>
                  ) : goldItems.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-border/40">
                      {goldItems.map((item) => (
                        <div key={item.id} className="flex flex-col gap-1.5 px-5 py-4 hover:bg-muted/30 transition-colors duration-200">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground truncate">{item.label}</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-xs text-muted-foreground font-medium">₨</span>
                            <span className="text-xl font-bold text-foreground tabular-nums tracking-tight">{item.value}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground/60">NPR / Tola</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-5 py-6 text-sm text-muted-foreground">Rates currently unavailable.</div>
                  )}

                  {/* Footer note */}
                  <div className="px-5 py-3 border-t border-border/40 bg-muted/20">
                    <p className="text-[11px] text-muted-foreground">Rates are indicative and may vary. Data sourced from Nepal bullion market.</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 5. COMMUNITY POSTS FEED */}
        <section className="py-24 relative bg-gradient-to-b from-primary/5 via-transparent to-transparent">
          {/* Background shimmer blobs */}
          <div className="absolute top-12 left-1/4 w-72 h-72 bg-primary/8 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute bottom-12 right-1/4 w-56 h-56 bg-purple-500/8 blur-[80px] rounded-full pointer-events-none" />

          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            {/* Section header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-xs font-bold text-primary mb-5 shadow-sm">
                  <Newspaper className="w-3.5 h-3.5" />
                  Live Community Feed
                </div>
                <h2 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.1] mb-3">
                  What people are<br />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-purple-500">talking about</span>
                </h2>
                <p className="text-muted-foreground text-base max-w-sm leading-relaxed">
                  Real issues. Real districts. Real impact from citizens across Nepal.
                </p>
              </div>
              <Link
                href="/feed"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-foreground text-background text-sm font-bold hover:opacity-90 transition-opacity whitespace-nowrap shadow-lg shadow-foreground/10 self-start sm:self-auto shrink-0"
              >
                View all posts
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Post cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {DUMMY_POSTS.map((post, idx) => (
                <PostCard key={post.id} post={post} idx={idx} />
              ))}
            </div>

            {/* Bottom "Built for Action" grid */}
            <div className="mt-14 rounded-2xl border border-border/50 bg-card overflow-hidden">
              <div className="px-6 pt-6 pb-4 border-b border-border/40">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Built for Action</p>
                <h3 className="text-base font-semibold text-foreground mt-0.5">Hyper-local issue tracking across Nepal</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-border/40">
                {[
                  { icon: MapPin, label: 'District Tracking', desc: 'Every issue pinned to an exact district and ward.' },
                  { icon: MessageCircle, label: 'Community Voting', desc: 'Citizens upvote real problems for faster attention.' },
                  { icon: Eye, label: 'Live Progress', desc: 'Track status changes from raised to resolved.' },
                  { icon: ArrowRight, label: 'Take Action', desc: 'One tap to report, sign a petition, or share.' },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="flex flex-col gap-2 p-5 hover:bg-muted/30 transition-colors duration-200 group">
                    <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center text-primary group-hover:bg-primary/12 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <p className="text-sm font-semibold text-foreground leading-tight">{label}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
              <div className="px-6 py-4 border-t border-border/40 flex items-center justify-between gap-4">
                <p className="text-xs text-muted-foreground">Join <span className="font-semibold text-foreground">10,000+</span> citizens already raising their voice</p>
                <Link
                  href="/auth/register"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-foreground text-background text-xs font-bold hover:opacity-90 transition-opacity shrink-0"
                >
                  <Megaphone className="w-3.5 h-3.5" />
                  Raise an Issue
                </Link>
              </div>
            </div>

          </div>
        </section>

        {/* 6. CRYPTO DASHBOARD */}
        <div id="markets" className="scroll-mt-32">
          {/* ⚠️ Legal Disclaimer */}
          <div className="container mx-auto px-4 sm:px-6 pt-8 pb-2">
            <div className="flex items-start gap-3 px-5 py-4 rounded-2xl border border-amber-500/30 bg-amber-500/6 backdrop-blur-sm">
              <div className="shrink-0 w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center mt-0.5">
                <span className="text-amber-500 text-base leading-none">⚠️</span>
              </div>
              <div className="text-xs leading-relaxed text-muted-foreground">
                <span className="font-bold text-amber-500 uppercase tracking-wide text-[11px]">Disclaimer &amp; Caution</span>
                <br />
                The cryptocurrency market data displayed below is <strong className="text-foreground">for informational purposes only</strong>. We do <strong className="text-foreground">not promote, endorse, or recommend</strong> any cryptocurrency investment or trading activity. Please note that <strong className="text-foreground">cryptocurrency trading and investment are currently banned / legally restricted in Nepal</strong> by the Nepal Rastra Bank (NRB). This information must not be used to influence financial decisions. Always consult a licensed financial advisor and comply with applicable laws.
              </div>
            </div>
          </div>
          <CryptoDashboard />
        </div>


        {/* 6. TRUST & FAQ */}
        <section id="faqs" className="pt-24 pb-32 bg-background scroll-mt-32 relative z-10">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
            {/* Header / Shield */}
            <div className="text-center mb-16 relative z-10 flex flex-col items-center">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/8 blur-[100px] rounded-full pointer-events-none" />

              <div className="w-24 h-24 rounded-[2rem] trust-icon-box flex items-center justify-center mb-8 relative z-10 animate-float">
                <ShieldCheck className="w-10 h-10 text-emerald-400" />
              </div>

              <h2 className="text-4xl sm:text-5xl font-extrabold mb-6 tracking-tight trust-heading">{content.trustTitle}</h2>
              <p className="text-muted-foreground block mx-auto max-w-2xl text-lg leading-relaxed px-4">
                We believe in complete transparency. Our systems are built to ensure every report is genuine and your privacy is maintained.
              </p>
            </div>

            {/* Two Cards */}
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8 mb-24 max-w-4xl mx-auto">
              <div className="p-8 rounded-[2rem] bg-card/80 backdrop-blur-sm border border-border/60 hover:border-border transition-all flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5 shadow-sm">
                <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-7 h-7 text-green-500" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-2 text-foreground">Human Verification</h4>
                  <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">Automated spam filters and strict auth prevent bot manipulation.</p>
                </div>
              </div>
              <div className="p-8 rounded-[2rem] bg-card/80 backdrop-blur-sm border border-border/60 hover:border-border transition-all flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5 shadow-sm">
                <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Lock className="w-7 h-7 text-blue-500" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-2 text-foreground">Data Privacy</h4>
                  <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">Minimal data collection. Your exact location is blurred automatically.</p>
                </div>
              </div>
            </div>

            {/* FAQ Split Section */}
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-start">
              {/* Left Column */}
              <div className="lg:col-span-5 flex flex-col items-start px-4 sm:px-0">
                <h3 className="text-4xl sm:text-5xl font-extrabold mb-6 tracking-tight leading-[1.1] faq-heading">
                  {content.faqTitle}
                </h3>
                <p className="text-muted-foreground text-lg leading-relaxed mb-10 max-w-sm">
                  We believe in complete transparency. Our systems are built to ensure every citizen has a voice safely and securely.
                </p>
                <a href="mailto:ihyaet@gmail.com" className="px-8 py-3.5 rounded-full bg-foreground text-background text-sm font-bold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg shadow-foreground/10">
                  Contact now
                </a>
              </div>

              {/* Right Column */}
              <div className="lg:col-span-7 flex flex-col w-full border border-border/60 rounded-[2rem] bg-card overflow-hidden shadow-sm">
                {content.faqs.map((faq, idx) => (
                  <FAQItem key={idx} q={faq.q} a={faq.a} isLast={idx === content.faqs.length - 1} />
                ))}
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="relative bg-background border-t border-border/40 overflow-hidden">
        {/* Subtle footer glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-40 bg-primary/5 blur-[60px] rounded-full pointer-events-none" />

        <div className="container mx-auto px-4 sm:px-6 py-10 relative z-10">
          {/* Top row */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 pb-8 border-b border-border/40">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shadow-lg">
                <Megaphone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <span className="font-black text-base tracking-tight footer-brand-text">{APP_NAME}</span>
                <span className="text-muted-foreground text-xs font-normal ml-1.5">© 2026</span>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-medium text-muted-foreground">
              <a href="mailto:ihyaet@gmail.com" className="hover:text-primary transition-colors duration-200 flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5" /> Contact
              </a>
              <Link href="/about" className="hover:text-primary transition-colors duration-200">About</Link>
              <Link href="/terms" className="hover:text-primary transition-colors duration-200">Terms</Link>
              <Link href="/privacy" className="hover:text-primary transition-colors duration-200">Privacy</Link>
            </div>
          </div>

          {/* Developer attribution row */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                Civic tech for Nepal
              </span>
              <span className="text-border">·</span>
              <span>Made with</span>
              <Heart className="w-3 h-3 text-rose-400 fill-current animate-pulse" />
              <span>in Nepal 🇳🇵</span>
            </div>

            {/* Developer credit */}
            <a
              href="https://asbinthapa.info.np"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2.5 px-4 py-2 rounded-full border border-border/60 bg-card/60 backdrop-blur-sm hover:border-primary/50 hover:bg-card transition-all duration-300 shadow-sm hover:shadow-primary/10 hover:shadow-md dev-credit-pill"
            >
              {/* Dev avatar */}
              <div className="w-6 h-6 rounded-full dev-avatar flex items-center justify-center text-[10px] font-black text-white shrink-0 transition-transform duration-300 group-hover:scale-110">
                🧑‍💻
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-[10px] text-muted-foreground font-medium">Developed &amp; Managed by</span>
                <span className="text-xs font-bold dev-name-gradient">asbinthapa</span>
              </div>
              <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors duration-200 ml-0.5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
