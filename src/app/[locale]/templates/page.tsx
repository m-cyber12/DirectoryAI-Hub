import type { Metadata } from 'next';
import Link from '@/i18n/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { NewsletterForm } from '@/components/NewsletterForm';
import { Lock } from 'lucide-react';

/**
 * Audit fix 3.3.
 *
 * Two problems with the old page:
 *  1. The waitlist form called `setSubmitted(true)` with no network request at
 *     all — it showed "you're on the list!" and silently discarded the email.
 *     That is worse than having no form. It now posts to the real newsletter
 *     endpoint (with double opt-in) via the shared NewsletterForm.
 *  2. It was indexable, so Google saw a "coming soon" page as a ranking
 *     signal for the site. Now noindex until it actually ships.
 */

export const metadata: Metadata = {
  title: 'Creator Templates — Coming Soon',
  description: 'Production systems, AI prompt kits and revenue calculators for video creators.',
  // Do not index an empty page (audit fix 3.3).
  robots: { index: false, follow: true },
};

export default function TemplatesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-surface-0 text-foreground">
      <Header />

      <main id="main" className="flex-1 px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent-500/30 bg-accent-500/10 px-4 py-1.5 text-2xs font-bold text-accent-400">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" /> In development
          </span>

          <h1 className="text-4xl font-black tracking-tight md:text-5xl">
            Creator templates &amp; prompt kits
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-zinc-400">
            Production systems, prompt libraries for Runway and Veo, and cost calculators for
            planning a toolchain. We are building this after the core directory is finished — no
            date promised yet.
          </p>

          <div className="mx-auto mt-10 max-w-md rounded-2xl border border-white/10 bg-surface-1 p-6">
            <p className="mb-4 text-sm text-zinc-300">
              Want to hear when it ships? Join the main list — we will announce it there.
            </p>
            <NewsletterForm source="templates-waitlist" />
          </div>

          <p className="mt-8 text-sm text-zinc-500">
            In the meantime,{' '}
            <Link href="/stack-builder" className="text-accent-400 underline hover:text-accent-300">
              the Stack Builder
            </Link>{' '}
            already calculates monthly costs for a full toolchain.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
