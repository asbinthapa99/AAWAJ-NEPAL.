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
  title: 'About — GuffGaff',
  description:
    'Learn about GuffGaff, our mission, development, privacy rights, legal policies, and open-source license.',
};

const GITHUB_REPO = 'https://github.com/asbinthapa99/AAWAJ-NEPAL';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-14">
        {/* Page Header */}
        <header className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
            About GuffGaff
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
            Everything you need to know about the platform — our mission, how to
            contribute, your rights, and the rules that keep this space safe.
          </p>
        </header>

        {/* What is GuffGaff */}
        <Section
          icon={<Megaphone className="w-5 h-5 text-primary" />}
          title="What is GuffGaff?"
        >
          <p>
            <strong>GuffGaff (गफगाफ)</strong> is a free, open civic
            engagement platform built for the people of Nepal. It empowers
            citizens — especially youth — to publicly raise issues affecting their
            communities, support each other&apos;s voices, and hold authorities
            accountable.
          </p>
          <p>
            Whether it&apos;s a broken road in your ward, corruption in a local
            office, or a policy that hurts the public — GuffGaff gives you a
            space to speak up, gather community support, and push for change.
          </p>
        </Section>

        {/* Mission */}
        <Section
          icon={<Heart className="w-5 h-5 text-destructive" />}
          title="Our Mission"
        >
          <ul className="list-disc list-inside space-y-1.5">
            <li>Give every Nepali citizen a platform to voice their concerns.</li>
            <li>Create transparency and accountability in governance at all levels.</li>
            <li>Build a supportive community where issues are heard, not ignored.</li>
            <li>Promote constructive civic participation over hate or misinformation.</li>
          </ul>
        </Section>

        {/* Development & Contributing */}
        <Section
          icon={<Code2 className="w-5 h-5 text-primary" />}
          title="Development & Contributing"
        >
          <p>
            GuffGaff is an <strong>open-source project</strong> built with
            Next.js, Supabase, TypeScript, and Tailwind CSS. The source code is
            publicly available on GitHub for transparency.
          </p>

          <div className="mt-3 flex flex-wrap gap-3">
            <a
              href={GITHUB_REPO}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 transition"
            >
              <Github className="w-4 h-4" />
              View on GitHub
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href={`${GITHUB_REPO}/issues`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-accent transition"
            >
              <AlertTriangle className="w-4 h-4" />
              Report a Bug / Request Feature
            </a>
          </div>

          <div className="mt-4 p-4 rounded-lg bg-warning/5 border border-warning/20 text-sm">
            <p className="font-semibold text-warning mb-1">
              🛠 How to Contribute
            </p>
            <ol className="list-decimal list-inside space-y-1 text-warning/80">
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
          icon={<AlertTriangle className="w-5 h-5 text-warning" />}
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
            className="inline-flex items-center gap-2 mt-2 text-primary hover:underline text-sm font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            Open a New Issue on GitHub
          </a>
          <p className="mt-2 text-sm text-muted-foreground">
            Please include clear steps to reproduce bugs, screenshots if possible,
            and your browser/device info.
          </p>
        </Section>

        {/* Privacy Rights */}
        <Section
          icon={<Shield className="w-5 h-5 text-success" />}
          title="Your Privacy Rights"
        >
          <p>We take your privacy seriously. Here&apos;s what you should know:</p>
          <ul className="list-disc list-inside space-y-1.5 mt-2">
            <li>We collect only the <strong>minimum data</strong> required to operate the platform.</li>
            <li>Your posts are <strong>public by design</strong> — do not share sensitive personal information.</li>
            <li>We <strong>never sell</strong> your data to third parties.</li>
            <li>You can <strong>delete your posts</strong> at any time from your profile.</li>
            <li>Authentication is handled securely via <strong>Supabase Auth</strong>.</li>
            <li>Cookies are used only for essential session management and preference storage.</li>
          </ul>
          <p className="mt-3">
            For full details, read our{' '}
            <Link href="/privacy" className="text-primary hover:underline font-medium">
              Privacy Policy
            </Link>.
          </p>
        </Section>

        {/* Misuse & Legal Consequences */}
        <Section
          icon={<Scale className="w-5 h-5 text-destructive" />}
          title="Misuse & Legal Consequences"
        >
          <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
            <p className="font-bold text-destructive mb-2">
              ⚠️ Warning: Misuse Will Have Consequences
            </p>
            <p className="text-destructive/80 text-sm mb-3">
              GuffGaff is a platform for constructive civic engagement. Any
              misuse of this platform is strictly prohibited and may result in
              legal action under the laws of Nepal.
            </p>
          </div>

          <h4 className="font-semibold mt-4 mb-2">
            The following activities are strictly prohibited:
          </h4>
          <ul className="list-disc list-inside space-y-1.5">
            <li><strong>Defamation:</strong> Posting false information to damage someone&apos;s reputation.</li>
            <li><strong>Hate speech:</strong> Content targeting groups based on ethnicity, religion, gender, or caste.</li>
            <li><strong>Harassment & threats:</strong> Intimidating or threatening any user.</li>
            <li><strong>Misinformation:</strong> Deliberately spreading false news.</li>
            <li><strong>Impersonation:</strong> Pretending to be someone else.</li>
            <li><strong>Spam & abuse:</strong> Flooding with irrelevant or promotional content.</li>
            <li><strong>Illegal content:</strong> Any content violating Nepali law.</li>
          </ul>

          <p className="mt-3 text-sm text-muted-foreground">
            By using GuffGaff, you acknowledge that you are solely responsible
            for the content you post. The platform reserves the right to cooperate
            with law enforcement agencies when required.
          </p>
        </Section>

        {/* Open Source License */}
        <Section
          icon={<BookOpen className="w-5 h-5 text-primary" />}
          title="Open Source License (MIT)"
        >
          <p>
            GuffGaff is released under the{' '}
            <strong>MIT License</strong>. This means the source code is freely
            available for viewing, learning, and contributing.
          </p>

          <div className="mt-3 p-4 rounded-lg bg-primary/5 border border-primary/20 text-sm">
            <p className="font-semibold text-primary mb-2">
              📋 Important: What the MIT License Allows & What It Doesn&apos;t
            </p>
            <div className="space-y-2 text-primary/80">
              <p>✅ You <strong>can</strong> view, fork, and study the source code.</p>
              <p>✅ You <strong>can</strong> contribute back via pull requests.</p>
              <p>✅ You <strong>can</strong> use portions with proper attribution.</p>
              <p>⚠️ You <strong>must</strong> include the original copyright notice.</p>
              <p>❌ You <strong>cannot</strong> claim this project as your own.</p>
              <p>❌ You <strong>should not</strong> deploy a clone to mislead users into thinking it is GuffGaff.</p>
            </div>
          </div>

          <p className="mt-3 text-sm text-muted-foreground">
            The full license text is available in the{' '}
            <a
              href={`${GITHUB_REPO}/blob/main/LICENSE`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              LICENSE
            </a>{' '}
            file on GitHub.
          </p>
        </Section>

        {/* Community Guidelines */}
        <Section
          icon={<Users className="w-5 h-5 text-success" />}
          title="Community Guidelines"
        >
          <p>To keep GuffGaff a healthy and productive space:</p>
          <ul className="list-disc list-inside space-y-1.5 mt-2">
            <li>Be respectful — disagree with ideas, not people.</li>
            <li>Post real issues with evidence when possible.</li>
            <li>Support others by upvoting genuine concerns.</li>
            <li>Report content that violates our policies.</li>
            <li>Do not use the platform for personal feuds or propaganda.</li>
          </ul>
        </Section>

        {/* Contact */}
        <Section
          icon={<Info className="w-5 h-5 text-primary" />}
          title="Contact & Support"
        >
          <p>For questions, concerns, or legal inquiries:</p>
          <ul className="list-disc list-inside space-y-1.5 mt-2">
            <li>
              <strong>GitHub Issues:</strong>{' '}
              <a href={`${GITHUB_REPO}/issues`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                {GITHUB_REPO.replace('https://', '')}/issues
              </a>
            </li>
            <li>
              <strong>Email:</strong>{' '}
              <a href="mailto:support@guffgaff.com" className="text-primary hover:underline">
                support@guffgaff.com
              </a>
            </li>
          </ul>
        </Section>

        {/* Related Links */}
        <footer className="pt-6 border-t border-border flex flex-wrap gap-4 text-sm">
          <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
          <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
          <a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            GitHub Repository
          </a>
        </footer>
      </div>
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
        <h2 className="text-xl font-bold text-foreground">
          {title}
        </h2>
      </div>
      <div className="text-muted-foreground text-sm leading-relaxed space-y-2 pl-7">
        {children}
      </div>
    </section>
  );
}
