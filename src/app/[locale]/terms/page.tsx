import type { Metadata } from 'next';
import Link from '@/i18n/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CONTACT_EMAIL, SITE_NAME } from '@/config/site';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of service for using the CreatorAI Hub directory, community reviews, public API, and tool submission service.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-surface-0 text-white">
      <Header />
      <main id="main" className="mx-auto max-w-3xl px-4 py-14">
        <h1 className="text-3xl font-black tracking-tight mb-2">Terms of Service</h1>
        <p className="text-xs text-zinc-500 mb-8">Last updated: August 4, 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-zinc-400">
          <section>
            <h2 className="text-lg font-bold text-white mb-2">1. Acceptance</h2>
            <p>By accessing {SITE_NAME} you agree to these terms. If you do not agree, please do not use the service.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">2. Nature of the service</h2>
            <p>
              {SITE_NAME} is an editorial directory. Tool listings, scores, and guides are informational opinions, not
              professional advice. Third-party tools are owned and operated by their respective vendors — we are not responsible
              for their pricing changes, availability, output quality, or terms. Always verify pricing on the vendor site before purchasing.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">3. Affiliate relationships</h2>
            <p>
              Some outbound links are affiliate links that may earn us a commission. This never changes the price you pay and never
              influences editorial scores. See our <Link href="/disclosure" className="text-accent-400 underline">disclosure</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">4. User content (reviews & submissions)</h2>
            <p>
              By posting a review or submitting a tool you grant us a worldwide, royalty-free license to display and moderate that
              content. You agree not to post: spam, undisclosed self-promotion (vendors reviewing their own tools), defamatory or
              unlawful content, or content you don&apos;t have rights to. We may edit for formatting or remove content that violates
              these rules.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">5. Accounts</h2>
            <p>
              You are responsible for activity under your account. We may suspend accounts that abuse the service (scraping beyond
              API limits, review manipulation, harassment).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">6. Public API</h2>
            <p>
              The public API is provided free for non-commercial use with attribution, subject to rate limits. We may modify or
              discontinue it with reasonable notice. Commercial use requires written permission.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">7. Intellectual property</h2>
            <p>
              Site design, editorial content, and curation are © {SITE_NAME}. Tool names, logos, and screenshots belong to their
              respective owners and are used for identification under nominative fair use.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">8. Disclaimer & liability</h2>
            <p>
              The service is provided &quot;as is&quot; without warranties. To the maximum extent permitted by law, our total liability for
              any claim related to the service is limited to $100.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">9. Changes</h2>
            <p>We may update these terms; continued use after changes constitutes acceptance. Material changes will be highlighted on this page.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">10. Contact</h2>
            <p>Questions? Email <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent-400 underline">{CONTACT_EMAIL}</a>.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
