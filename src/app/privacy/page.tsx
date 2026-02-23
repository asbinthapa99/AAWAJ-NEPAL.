import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — Awaaz Nepal',
  description: 'How Awaaz Nepal collects, uses, and protects your data.',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
      <header>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
          Privacy Policy
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-xs">
          Last updated: June 2025
        </p>
      </header>

      <Section title="1. Information We Collect">
        <p>When you use Awaaz Nepal, we may collect:</p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>
            <strong>Account information:</strong> Email address, display name,
            and profile picture (provided during registration or via OAuth).
          </li>
          <li>
            <strong>User-generated content:</strong> Posts, comments, votes, and
            uploaded images.
          </li>
          <li>
            <strong>Usage data:</strong> IP address, browser type, device
            information, pages visited, and timestamps — collected automatically
            for security and analytics.
          </li>
          <li>
            <strong>Cookies:</strong> Essential cookies for session management,
            theme preference, and language preference.
          </li>
        </ul>
      </Section>

      <Section title="2. How We Use Your Data">
        <ul className="list-disc list-inside space-y-1">
          <li>To operate and maintain the platform.</li>
          <li>To authenticate your identity and manage your account.</li>
          <li>To display your posts and profile publicly as intended.</li>
          <li>To prevent abuse, spam, and security threats.</li>
          <li>To comply with legal obligations and law enforcement requests.</li>
        </ul>
      </Section>

      <Section title="3. Data Sharing">
        <p>We <strong>do not sell</strong> your personal data. We may share data only:</p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>With law enforcement agencies when legally required or when platform rules are violated.</li>
          <li>With service providers (Supabase, Vercel) who process data on our behalf under strict confidentiality.</li>
          <li>When you voluntarily make content public by posting on the platform.</li>
        </ul>
      </Section>

      <Section title="4. Data Storage & Security">
        <p>
          Your data is stored securely using <strong>Supabase</strong> (PostgreSQL
          database with Row Level Security) and <strong>Vercel</strong> hosting.
          We implement industry-standard security measures including encryption
          in transit (HTTPS), secure authentication tokens, and access controls.
        </p>
        <p className="mt-2">
          However, no system is 100% secure. You are responsible for keeping your
          login credentials safe.
        </p>
      </Section>

      <Section title="5. Your Rights">
        <p>You have the right to:</p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li><strong>Access</strong> your personal data held by us.</li>
          <li><strong>Delete</strong> your posts at any time from your profile.</li>
          <li><strong>Update</strong> your profile information.</li>
          <li><strong>Request deletion</strong> of your account by contacting us.</li>
          <li><strong>Withdraw consent</strong> for data processing (this may limit platform functionality).</li>
        </ul>
      </Section>

      <Section title="6. Children's Privacy">
        <p>
          Awaaz Nepal is not intended for users under the age of 16. We do not
          knowingly collect data from minors. If we learn that a user is under
          16, their account will be suspended.
        </p>
      </Section>

      <Section title="7. Third-Party Services">
        <p>
          We use the following third-party services, each with their own privacy
          policies:
        </p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>
            <strong>Supabase</strong> — Authentication, database, and file storage.
          </li>
          <li>
            <strong>Vercel</strong> — Hosting and edge delivery.
          </li>
          <li>
            <strong>Google / Facebook OAuth</strong> — Optional social login.
          </li>
        </ul>
      </Section>

      <Section title="8. Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. Changes will be
          posted on this page with an updated date. Continued use of the
          platform constitutes acceptance of the updated policy.
        </p>
      </Section>

      <Section title="9. Contact">
        <p>
          For privacy-related questions or data requests, contact us at{' '}
          <a href="mailto:support@awaaznepal.com" className="text-blue-600 dark:text-blue-400 hover:underline">
            support@awaaznepal.com
          </a>{' '}
          or open an issue on{' '}
          <a
            href="https://github.com/asbinthapa99/AAWAJ-NEPAL/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            GitHub
          </a>.
        </p>
      </Section>

      <footer className="pt-4 border-t border-gray-200 dark:border-gray-800 flex gap-4 text-xs">
        <Link href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">
          Terms of Service
        </Link>
        <Link href="/about" className="text-blue-600 dark:text-blue-400 hover:underline">
          About
        </Link>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
      <div>{children}</div>
    </section>
  );
}
