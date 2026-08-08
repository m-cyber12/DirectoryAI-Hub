import type { Metadata } from 'next';
import Link from '@/i18n/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { NewsletterForm } from '@/components/NewsletterForm';
import { Lock } from 'lucide-react';

/**
 * Audit fix 3.3 — same two problems as /templates: the waitlist form threw the
 * email away (`setSubmitted(true)` with no request), and the page was
 * indexable while empty. Both fixed.
 */

export const metadata: Metadata = {
  title: 'AI Video Jobs — Coming Soon',
  description: 'A job board for AI video editors, motion designers and creator-economy roles.',
  robots: { index: false, follow: true },
};

export default function JobsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-surface-0 text-foreground">
      <Header />

      <main id="main" className="flex-1 px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent-500/30 bg-accent-500/10 px-4 py-1.5 text-2xs font-bold text-accent-400">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" /> In development
          </span>

          <h1 className="text-4xl font-black tracking-tight md:text-5xl">AI video jobs</h1>

          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-zinc-400">
            A focused board for AI video editors, motion designers, and creator-economy roles. We
            will open this once there is enough audience to make posting worthwhile for employers —
            an empty job board helps nobody.
          </p>

          <div className="mx-auto mt-10 max-w-md rounded-2xl border border-white/10 bg-surface-1 p-6">
            <p className="mb-4 text-sm text-zinc-300">
              Get notified when it opens — for hiring or for looking.
            </p>
            <NewsletterForm source="jobs-waitlist" />
          </div>

          <p className="mt-8 text-sm text-zinc-500">
            Hiring right now?{' '}
            <Link href="/contact" className="text-accent-400 underline hover:text-accent-300">
              Get in touch
            </Link>{' '}
            and we will share the role with our list.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
