import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Info,
  Code2,
  AlertTriangle,
  Shield,
  Scale,
  Github,
  ExternalLink,
  Heart,
  Users,
  Megaphone,
  BookOpen,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'About — Awaaz Nepal',
  description:
    'Learn about Awaaz Nepal, our mission, development, privacy rights, legal policies, and open-source license.',
};

const GITHUB_REPO = 'https://github.com/asbinthapa99/AAWAJ-NEPAL';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-14">
      {/* Page Header */}
      <header className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
          About Awaaz Nepal
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-sm sm:text-base">
          Everything you need to know about the platform — our mission, how to
          contribute, your rights, and the rules that keep this space safe.
        </p>
      </header>

      {/* What is Awaaz Nepal */}
      <Section
        icon={<Megaphone className="w-5 h-5 text-red-600" />}
        title="What is Awaaz Nepal?"
      >
        <p>
          <strong>Awaaz Nepal (आवाज नेपाल)</strong> is a free, open civic
          engagement platform built for the people of Nepal. It empowers
          citizens — especially youth — to publicly raise issues affecting their
          communities, support each other&apos;s voices, and hold authorities
          accountable.
        </p>
        <p>
          Whether it&apos;s a broken road in your ward, corruption in a local
          office, or a policy that hurts the public — Awaaz Nepal gives you a
          space to speak up, gather community support, and push for change.
        </p>
      </Section>

      {/* Mission */}
      <Section
        icon={<Heart className="w-5 h-5 text-pink-600" />}
        title="Our Mission"
      >
        <ul className="list-disc list-inside space-y-1.5">
          <li>Give every Nepali citizen a platform to voice their concerns.</li>
          <li>
            Create transparency and accountability in governance at all levels.
          </li>
          <li>
            Build a supportive community where issues are heard, not ignored.
          </li>
          <li>
            Promote constructive civic participation over hate or
            misinformation.
          </li>
        </ul>
      </Section>

      {/* Development & Contributing */}
      <Section
        icon={<Code2 className="w-5 h-5 text-blue-600" />}
        title="Development & Contributing"
      >
        <p>
          Awaaz Nepal is an <strong>open-source project</strong> built with
          Next.js, Supabase, TypeScript, and Tailwind CSS. The source code is
          publicly available on GitHub for transparency.
        </p>

        <div className="mt-3 flex flex-wrap gap-3">
          <a
            href={GITHUB_REPO}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium hover:opacity-90 transition"
          >
            <Github className="w-4 h-4" />
            View on GitHub
            <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href={`${GITHUB_REPO}/issues`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <AlertTriangle className="w-4 h-4" />
            Report a Bug / Request Feature
          </a>
        </div>

        <div className="mt-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-sm">
          <p className="font-semibold text-amber-800 dark:text-amber-300 mb-1">
            🛠 How to Contribute
          </p>
          <ol className="list-decimal list-inside space-y-1 text-amber-700 dark:text-amber-400">
            <li>Fork the repository on GitHub.</li>
            <li>Create a feature branch from <code>main</code>.</li>
            <li>Make your changes and write clear commit messages.</li>
            <li>Open a Pull Request describing what you changed and why.</li>
            <li>Wait for review — we&apos;ll merge quality contributions.</li>
          </ol>
        </div>
      </Section>

      {/* Raise an Issue */}
      <Section
        icon={<AlertTriangle className="w-5 h-5 text-orange-600" />}
        title="Raise an Issue"
      >
        <p>
          Found a bug? Have a feature idea? Something not working right? You can
          raise an issue directly on our GitHub repository:
        </p>
        <a
          href={`${GITHUB_REPO}/issues/new`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-2 text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
        >
          <ExternalLink className="w-4 h-4" />
          Open a New Issue on GitHub
        </a>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Please include clear steps to reproduce bugs, screenshots if possible,
          and your browser/device info.
        </p>
      </Section>

      {/* Privacy Rights */}
      <Section
        icon={<Shield className="w-5 h-5 text-green-600" />}
        title="Your Privacy Rights"
      >
        <p>We take your privacy seriously. Here&apos;s what you should know:</p>
        <ul className="list-disc list-inside space-y-1.5 mt-2">
          <li>
            We collect only the <strong>minimum data</strong> required to
            operate the platform (email, display name, profile picture).
          </li>
          <li>
            Your posts are <strong>public by design</strong> — this is a civic
            platform. Do not share sensitive personal information in posts.
          </li>
          <li>
            We <strong>never sell</strong> your data to third parties.
          </li>
          <li>
            You can <strong>delete your posts</strong> at any time from your
            profile.
          </li>
          <li>
            Authentication is handled securely via{' '}
            <strong>Supabase Auth</strong> with support for email/password and
            OAuth (Google, Facebook).
          </li>
          <li>
            Cookies are used only for essential session management and
            preference storage (theme, language).
          </li>
        </ul>
        <p className="mt-3">
          For full details, read our{' '}
          <Link
            href="/privacy"
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </Section>

      {/* Misuse & Legal Consequences */}
      <Section
        icon={<Scale className="w-5 h-5 text-red-700" />}
        title="Misuse & Legal Consequences"
      >
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
          <p className="font-bold text-red-800 dark:text-red-300 mb-2">
            ⚠️ Warning: Misuse Will Have Consequences
          </p>
          <p className="text-red-700 dark:text-red-400 text-sm mb-3">
            Awaaz Nepal is a platform for constructive civic engagement. Any
            misuse of this platform is strictly prohibited and may result in
            legal action under the laws of Nepal.
          </p>
        </div>

        <h4 className="font-semibold mt-4 mb-2">
          The following activities are strictly prohibited:
        </h4>
        <ul className="list-disc list-inside space-y-1.5">
          <li>
            <strong>Defamation:</strong> Posting false information to damage
            someone&apos;s reputation.
          </li>
          <li>
            <strong>Hate speech:</strong> Content targeting individuals or
            groups based on ethnicity, religion, gender, caste, or other
            protected characteristics.
          </li>
          <li>
            <strong>Harassment & threats:</strong> Intimidating, bullying, or
            threatening any user or individual.
          </li>
          <li>
            <strong>Misinformation:</strong> Deliberately spreading false news
            or fabricated claims.
          </li>
          <li>
            <strong>Impersonation:</strong> Pretending to be someone else or a
            government official.
          </li>
          <li>
            <strong>Spam & abuse:</strong> Flooding the platform with
            irrelevant, duplicate, or promotional content.
          </li>
          <li>
            <strong>Illegal content:</strong> Any content that violates Nepali
            law, including the Electronic Transactions Act 2063.
          </li>
        </ul>

        <h4 className="font-semibold mt-4 mb-2">Consequences include:</h4>
        <ul className="list-disc list-inside space-y-1.5">
          <li>Immediate removal of offending content.</li>
          <li>Temporary or permanent account suspension.</li>
          <li>
            Reporting to relevant authorities with available user data (IP
            address, email, timestamps).
          </li>
          <li>
            <strong>Legal prosecution</strong> under applicable Nepali laws,
            including but not limited to:
          </li>
          <ul className="list-disc list-inside ml-6 space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <li>Electronic Transactions Act, 2063 (2008)</li>
            <li>National Penal Code, 2074 (2017)</li>
            <li>Privacy Act, 2075 (2018)</li>
            <li>Defamation and libel provisions</li>
          </ul>
        </ul>

        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          By using Awaaz Nepal, you acknowledge that you are solely responsible
          for the content you post. The platform reserves the right to cooperate
          with law enforcement agencies when required.
        </p>
      </Section>

      {/* Open Source License */}
      <Section
        icon={<BookOpen className="w-5 h-5 text-purple-600" />}
        title="Open Source License (MIT)"
      >
        <p>
          Awaaz Nepal is released under the{' '}
          <strong>MIT License</strong>. This means the source code is freely
          available for viewing, learning, and contributing.
        </p>

        <div className="mt-3 p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-sm">
          <p className="font-semibold text-purple-800 dark:text-purple-300 mb-2">
            📋 Important: What the MIT License Allows & What It Doesn&apos;t
          </p>
          <div className="space-y-2 text-purple-700 dark:text-purple-400">
            <p>
              ✅ You <strong>can</strong> view, fork, and study the source code.
            </p>
            <p>
              ✅ You <strong>can</strong> contribute back via pull requests.
            </p>
            <p>
              ✅ You <strong>can</strong> use portions of the code in your own
              projects with proper attribution.
            </p>
            <p>
              ⚠️ You <strong>must</strong> include the original copyright notice
              and license in any copy or substantial portion of the software.
            </p>
            <p>
              ❌ You <strong>cannot</strong> claim this project as your own
              original work.
            </p>
            <p>
              ❌ You <strong>should not</strong> deploy a clone of this platform
              to compete directly or mislead users into thinking it is Awaaz
              Nepal.
            </p>
          </div>
        </div>

        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          The full license text is available in the{' '}
          <a
            href={`${GITHUB_REPO}/blob/main/LICENSE`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            LICENSE
          </a>{' '}
          file on GitHub.
        </p>
      </Section>

      {/* Community Guidelines */}
      <Section
        icon={<Users className="w-5 h-5 text-teal-600" />}
        title="Community Guidelines"
      >
        <p>To keep Awaaz Nepal a healthy and productive space:</p>
        <ul className="list-disc list-inside space-y-1.5 mt-2">
          <li>Be respectful — disagree with ideas, not people.</li>
          <li>
            Post real issues with evidence when possible (photos, documents).
          </li>
          <li>Support others by upvoting genuine concerns.</li>
          <li>Report content that violates our policies using the report button.</li>
          <li>
            Do not use the platform for personal feuds or political propaganda.
          </li>
        </ul>
      </Section>

      {/* Contact */}
      <Section
        icon={<Info className="w-5 h-5 text-sky-600" />}
        title="Contact & Support"
      >
        <p>
          For questions, concerns, or legal inquiries, reach out through any of
          these channels:
        </p>
        <ul className="list-disc list-inside space-y-1.5 mt-2">
          <li>
            <strong>GitHub Issues:</strong>{' '}
            <a
              href={`${GITHUB_REPO}/issues`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {GITHUB_REPO.replace('https://', '')}/issues
            </a>
          </li>
          <li>
            <strong>Email:</strong>{' '}
            <a
              href="mailto:support@awaaznepal.com"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              support@awaaznepal.com
            </a>
          </li>
        </ul>
      </Section>

      {/* Related Links */}
      <footer className="pt-6 border-t border-gray-200 dark:border-gray-800 flex flex-wrap gap-4 text-sm">
        <Link
          href="/privacy"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          Privacy Policy
        </Link>
        <Link
          href="/terms"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          Terms of Service
        </Link>
        <a
          href={GITHUB_REPO}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          GitHub Repository
        </a>
      </footer>
    </div>
  );
}

/* Reusable section wrapper */
function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {title}
        </h2>
      </div>
      <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed space-y-2 pl-7">
        {children}
      </div>
    </section>
  );
}
