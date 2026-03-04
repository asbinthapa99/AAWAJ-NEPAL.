import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service — GuffGaff',
  description: 'Terms and conditions for using the GuffGaff platform.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <header>
          <h1 className="text-3xl font-extrabold text-foreground mb-2">
            Terms of Service
          </h1>
          <p className="text-muted-foreground text-xs">
            Last updated: June 2025
          </p>
        </header>

        <Section title="1. Acceptance of Terms">
          <p>
            By accessing or using GuffGaff (&quot;the Platform&quot;), you agree to be
            bound by these Terms of Service. If you do not agree, do not use the
            Platform.
          </p>
        </Section>

        <Section title="2. Eligibility">
          <ul className="list-disc list-inside space-y-1">
            <li>You must be at least 16 years old to create an account.</li>
            <li>
              You must provide accurate information during registration. Fake or
              impersonating accounts will be suspended.
            </li>
          </ul>
        </Section>

        <Section title="3. User-Generated Content">
          <p>
            You retain ownership of content you post on GuffGaff. By posting
            content, you grant us a non-exclusive, royalty-free license to display,
            distribute, and promote your content within the Platform.
          </p>
          <p className="mt-2">
            You are <strong>solely responsible</strong> for the content you post.
            The Platform does not endorse or verify user-submitted content.
          </p>
        </Section>

        <Section title="4. Acceptable Use Policy">
          <p>When using GuffGaff, you agree <strong>not</strong> to:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Post false, misleading, or defamatory content.</li>
            <li>Engage in hate speech, harassment, threats, or bullying.</li>
            <li>Impersonate any person or entity.</li>
            <li>Post spam, advertisements, or irrelevant promotional content.</li>
            <li>Upload illegal, obscene, or harmful material.</li>
            <li>Attempt to hack, disrupt, or exploit the Platform&apos;s infrastructure.</li>
            <li>Use automated tools (bots, scrapers) to interact with the Platform without permission.</li>
            <li>Violate any applicable laws, including the Electronic Transactions Act, 2063 of Nepal.</li>
          </ul>
        </Section>

        <Section title="5. Content Moderation & Removal">
          <p>
            We reserve the right to remove any content that violates these Terms,
            without prior notice. Users who repeatedly violate policies may have
            their accounts permanently suspended.
          </p>
          <p className="mt-2">
            Community members can report objectionable content using the report
            button available on each post.
          </p>
        </Section>

        <Section title="6. Legal Consequences of Misuse">
          <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20 text-destructive">
            <p className="font-semibold mb-1">⚠️ Warning</p>
            <p>
              Misuse of this platform — including defamation, hate speech,
              harassment, or spreading misinformation — may result in:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Immediate account suspension and content removal.</li>
              <li>
                Reporting to Nepal Police Cyber Bureau with all available user data
                (IP address, email, device info, timestamps).
              </li>
              <li>
                <strong>Criminal prosecution</strong> under applicable laws of Nepal, including:
              </li>
              <ul className="list-disc list-inside ml-6 space-y-0.5 text-xs">
                <li>Electronic Transactions Act, 2063 (2008)</li>
                <li>National Penal Code, 2074 (2017) — Defamation, Libel</li>
                <li>Privacy Act, 2075 (2018)</li>
              </ul>
              <li>Civil liability for damages caused by defamatory content.</li>
            </ul>
          </div>
        </Section>

        <Section title="7. Intellectual Property">
          <p>
            The GuffGaff name, logo, design, and codebase are the intellectual
            property of the project maintainers. The source code is available under
            the{' '}
            <a
              href="https://github.com/asbinthapa99/AAWAJ-NEPAL/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              MIT License
            </a>
            , which permits use with attribution but does not permit
            misrepresentation of origin.
          </p>
        </Section>

        <Section title="8. Disclaimers">
          <ul className="list-disc list-inside space-y-1">
            <li>The Platform is provided <strong>&quot;as is&quot;</strong> without warranties of any kind.</li>
            <li>We do not guarantee the accuracy, completeness, or reliability of user-submitted content.</li>
            <li>We are not liable for any damages arising from the use of the Platform.</li>
            <li>Service availability may be interrupted for maintenance or unforeseen circumstances.</li>
          </ul>
        </Section>

        <Section title="9. Limitation of Liability">
          <p>
            To the maximum extent permitted by law, GuffGaff and its
            maintainers shall not be liable for any indirect, incidental, special,
            or consequential damages arising out of your use of the Platform.
          </p>
        </Section>

        <Section title="10. Modifications">
          <p>
            We may update these Terms at any time. Changes take effect immediately
            upon posting. Continued use of the Platform constitutes acceptance of
            the revised Terms. We recommend reviewing this page periodically.
          </p>
        </Section>

        <Section title="11. Governing Law">
          <p>
            These Terms are governed by and construed in accordance with the
            laws of Nepal. Any disputes shall be subject to the exclusive
            jurisdiction of the courts of Nepal.
          </p>
        </Section>

        <Section title="12. Contact">
          <p>
            For questions about these Terms, contact us at{' '}
            <a href="mailto:support@guffgaff.com" className="text-primary hover:underline">
              support@guffgaff.com
            </a>{' '}
            or raise an issue on{' '}
            <a
              href="https://github.com/asbinthapa99/AAWAJ-NEPAL/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              GitHub
            </a>.
          </p>
        </Section>

        <footer className="pt-4 border-t border-border flex gap-4 text-xs">
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          <Link href="/about" className="text-primary hover:underline">
            About
          </Link>
        </footer>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      <div>{children}</div>
    </section>
  );
}
