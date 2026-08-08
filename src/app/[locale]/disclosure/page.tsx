import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from '@/i18n/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ALL_TOOLS } from '@/data/tools';

/**
 * Audit fix 1.6.
 *
 * The old disclosure asserted an active affiliate relationship and described
 * commission income. In reality only 15 of 200 tools had an affiliateUrl, all
 * of them guessed patterns (?via=creatoraihub) for programs that had never
 * been joined — so no commission could be earned by anyone. Claiming a
 * material connection that does not exist is its own FTC problem, in the
 * opposite direction to the usual one.
 *
 * The page now renders the true state, computed from the catalog, and will
 * switch automatically once real programs are approved and
 * `affiliateProgram` is set on those tools.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'disclosure' });
  return {
    title: t('title'),
    description: t('description'),
    alternates: { canonical: '/disclosure' },
    openGraph: { title: t('title'), description: t('description'), url: '/disclosure', type: 'website' },
  };
}

export default async function DisclosurePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'disclosure' });

  const affiliateTools = ALL_TOOLS.filter((t) => t.affiliateProgram);
  const hasAffiliates = affiliateTools.length > 0;

  return (
    <div className="min-h-screen bg-surface-0 text-foreground">
      <Header />

      <main id="main" className="mx-auto max-w-2xl px-4 py-14">
        <h1 className="mb-6 text-3xl font-black tracking-tight">{t('heading')}</h1>

        {hasAffiliates ? (
          <div className="space-y-4 text-sm leading-relaxed text-zinc-300">
            <p className="rounded-xl border border-accent-500/25 bg-accent-500/5 p-4">
              <strong className="text-accent-300">Current status:</strong> we earn commission on{' '}
              <strong className="font-mono tabular-nums text-white">{affiliateTools.length}</strong>{' '}
              of the {ALL_TOOLS.length} tools listed. Every other outbound link earns us nothing.
            </p>

            <p>
              In accordance with FTC guidelines (16 CFR Part 255), we disclose that some outbound
              links are affiliate links. If you click one and subscribe, we may receive a commission
              at no extra cost to you.
            </p>

            <h2 className="pt-2 text-lg font-bold text-white">Tools we earn from</h2>
            <ul className="list-disc space-y-1 pl-5">
              {affiliateTools.map((t) => (
                <li key={t.slug}>
                  <Link href={`/tool/${t.slug}`} className="text-accent-400 underline hover:text-accent-300">
                    {t.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="space-y-4 text-sm leading-relaxed text-zinc-300">
            <p className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4">
              <strong className="text-emerald-300">Current status: we earn nothing.</strong> As of
              today, CreatorAI Hub has no active affiliate relationship with any of the{' '}
              {ALL_TOOLS.length} tools listed. Every outbound link goes to the vendor&apos;s plain
              URL and no commission is generated.
            </p>

            <p>
              We are stating this plainly because the opposite claim is also a disclosure problem.
              Asserting a paid relationship that does not exist misleads readers about our
              incentives just as surely as hiding a real one would.
            </p>

            <p>
              We do intend to join affiliate programs, because that is how a directory like this
              stays free and ad-free. When that happens:
            </p>

            <ul className="list-disc space-y-1.5 pl-5">
              <li>This page will list every tool we earn from, by name.</li>
              <li>
                Those links — and only those links — will carry{' '}
                <code className="rounded bg-surface-2 px-1.5 py-0.5 text-2xs">rel=&quot;sponsored&quot;</code>.
              </li>
              <li>The tool page itself will say so, in the listing.</li>
            </ul>
          </div>
        )}

        <div className="mt-8 space-y-4 border-t border-white/10 pt-6 text-sm leading-relaxed text-zinc-300">
          <h2 className="text-lg font-bold text-white">Rules that do not change</h2>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              Commission <strong className="text-white">never</strong> affects a score, a ranking
              position, or whether a tool is listed at all.
            </li>
            <li>
              Scores come only from tools we have{' '}
              <Link href="/benchmark" className="text-accent-400 underline hover:text-accent-300">
                actually tested
              </Link>
              , using a computed weighted average we cannot hand-adjust.
            </li>
            <li>
              Every tool links to its vendor whether or not an affiliate program exists for it.
            </li>
            <li>
              If we ever sell placement, it will be labelled &ldquo;Sponsored&rdquo; and excluded
              from scoring entirely.
            </li>
            <li>
              Outbound links route through our{' '}
              <code className="rounded bg-surface-2 px-1.5 py-0.5 text-2xs">/go/</code> redirect so
              we can measure clicks and detect dead links.
            </li>
          </ul>

          <p className="text-zinc-400">
            Questions about any of this?{' '}
            <Link href="/contact" className="text-accent-400 underline hover:text-accent-300">
              Ask us
            </Link>
            . See also our{' '}
            <Link href="/about" className="text-accent-400 underline hover:text-accent-300">
              editorial methodology
            </Link>
            .
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
