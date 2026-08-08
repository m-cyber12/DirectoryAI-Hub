import type { Metadata } from 'next';
import Link from '@/i18n/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CONTACT_EMAIL, SITE_NAME, SITE_URL } from '@/config/site';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'CreatorAI Hub privacy policy: what data we collect, how we use it, GDPR rights, and cookie usage.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  const hostName = new URL(SITE_URL).hostname;

  return (
    <div className="min-h-screen bg-surface-0 text-white">
      <Header />
      <main id="main" className="mx-auto max-w-3xl px-4 py-14">
        <h1 className="text-3xl font-black tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-xs text-zinc-500 mb-8">Last updated: August 4, 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-zinc-400">
          <section>
            <h2 className="text-lg font-bold text-white mb-2">1. Who we are</h2>
            <p>
              {SITE_NAME} (&quot;we&quot;, &quot;us&quot;) operates {hostName}, a curated directory of AI tools for video
              creators. This policy explains what personal data we collect, why, and your rights over it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">2. Data we collect</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><span className="text-zinc-300 font-semibold">Account data:</span> if you sign in, we store your email address and authentication identifiers via our auth provider (Supabase).</li>
              <li><span className="text-zinc-300 font-semibold">Newsletter:</span> your email address and signup source, only when you subscribe.</li>
              <li><span className="text-zinc-300 font-semibold">Reviews:</span> the display name, rating, and text you voluntarily submit.</li>
              <li><span className="text-zinc-300 font-semibold">Bookmarks:</span> saved-tool lists, stored locally on your device and — only for signed-in users — synced to your account.</li>
              <li><span className="text-zinc-300 font-semibold">Click analytics:</span> when you click an outbound tool link we log the tool name, timestamp, and referring page. We do not log your identity with clicks.</li>
              <li><span className="text-zinc-300 font-semibold">Tool submissions:</span> the tool details and contact email you provide.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">3. What we don&apos;t do</h2>
            <p>We do not sell your personal data. We do not run third-party advertising trackers. We do not share your email with tool vendors.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">4. Cookies</h2>
            <p>
              Essential cookies/localStorage keep you signed in and remember preferences (bookmarks, cookie consent, compare
              selections). Optional analytics cookies are only set if you click &quot;Accept All&quot; on the consent banner. You can
              clear them any time in your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">5. Affiliate links</h2>
            <p>
              Some outbound links are affiliate links. Vendors may set their own cookies on their own domains after you leave our
              site; their privacy policies apply there. See our <Link href="/disclosure" className="text-accent-400 underline">affiliate disclosure</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">6. Data storage & processors</h2>
            <p>
              Data is processed by Vercel (hosting) and Supabase (database & authentication). Both are GDPR-compliant processors
              with EU standard contractual clauses.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">7. Your rights (GDPR / CCPA)</h2>
            <p>
              You may request access, correction, export, or deletion of your personal data at any time by emailing{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent-400 underline">{CONTACT_EMAIL}</a>. We respond
              within 30 days. Newsletter emails include a one-click unsubscribe link.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">8. Children</h2>
            <p>This service is not directed to children under 16 and we do not knowingly collect their data.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">9. Changes</h2>
            <p>We will update this page when the policy changes and revise the &quot;last updated&quot; date above.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
