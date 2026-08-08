import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { SmartImage } from '@/components/SmartImage';
import Link from '@/i18n/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ALL_TOOLS, Tool } from '@/data/tools';
import { Flame, ExternalLink, BadgePercent, ShieldCheck, Sparkles, HandCoins } from 'lucide-react';
import { byRankDesc } from '@/lib/ranking';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'deals' });
  return {
    title: t('title'),
    description: t('description'),
    alternates: { canonical: '/deals' },
    openGraph: { title: t('title'), description: t('description'), url: '/deals', type: 'website' },
  };
}

/**
 * Honesty rewrite (critique §8, §11-6):
 *
 * The previous version of this page advertised "exclusive promo codes"
 * (CREATORAI20, DESCRIPT15, CREATOR50, SUB10) marked "Verified / Tested and
 * active" — none of those codes exist or were ever agreed with the vendors.
 * Fake coupons next to affiliate-style CTAs are an FTC deceptive-practice risk
 * and destroy exactly the trust this site is built on.
 *
 * This page now only lists things we can stand behind:
 *  - pricing models straight from the catalog (Free / Freemium / Free Trial)
 *  - the subset of tools whose price we actually source-checked
 *  - an open invitation for vendors to submit a real, verifiable deal
 */

export default async function DealsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'deals' });

  const freeTools = ALL_TOOLS.filter((t) => t.pricing === 'Free')
    .sort(byRankDesc)
    .slice(0, 10);
  const freemium = ALL_TOOLS.filter((t) => t.pricing === 'Freemium')
    .sort(byRankDesc)
    .slice(0, 12);
  const trials = ALL_TOOLS.filter((t) => t.pricing === 'Free Trial')
    .sort(byRankDesc)
    .slice(0, 8);
  const priceChecked = ALL_TOOLS.filter((t) => t.verificationLevel === 'pricing-verified').slice(0, 10);

  const Section = ({ title, sub, tools, showSource = false }: { title: string; sub: string; tools: Tool[]; showSource?: boolean }) => (
    <section className="mb-12">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mb-5 text-2xs text-zinc-500">{sub}</p>
      {tools.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-surface-1 p-4 text-sm text-zinc-400">
          Nothing in this group yet — <Link href="/submit" className="text-accent-400 underline">submit a tool</Link> to grow the catalog.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {tools.map((t) => (
            <div key={t.slug} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-surface-1 p-4 transition-colors hover:border-accent-500/30">
              <SmartImage src={t.logo} alt="" width={40} height={40} loading="lazy" className="h-10 w-10 rounded-xl border border-white/10 object-cover" />
              <div className="min-w-0 flex-1">
                <Link href={`/tool/${t.slug}`} className="text-sm font-bold text-white hover:text-accent-300">{t.name}</Link>
                <p className="truncate text-2xs text-zinc-500">{t.tagline}</p>
                <p className="text-2xs font-semibold text-emerald-400">
                  {t.pricing}
                  {t.startingPrice && t.pricing !== 'Free' ? ` · paid from ${t.startingPrice}` : ''}
                </p>
                {showSource && t.pricingSourceUrl && t.pricingCheckedAt && (
                  <a
                    href={t.pricingSourceUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="text-2xs text-zinc-500 underline hover:text-zinc-300"
                  >
                    price source · checked {t.pricingCheckedAt}
                  </a>
                )}
              </div>
              <a
                href={`/go/${t.slug}`}
                target="_blank"
                rel={
                  t.affiliateProgram
                    ? 'noopener noreferrer nofollow sponsored'
                    : 'noopener noreferrer nofollow'
                }
                className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-surface-2 px-3 py-2 text-2xs font-bold text-white transition-colors hover:bg-accent-500 hover:text-black"
              >
                Get It <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  return (
    <div className="min-h-screen bg-surface-0 text-white">
      <Header />
      <main id="main" className="mx-auto max-w-5xl px-4 py-14">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent-500/20 bg-accent-500/10 px-4 py-1.5 text-2xs font-semibold text-accent-300">
          <Flame className="h-3.5 w-3.5" aria-hidden="true" /> No fake coupons — ever
        </span>
        <h1 className="mb-2 text-3xl font-black tracking-tight md:text-4xl">{t('heading')}</h1>
        <p className="mb-4 max-w-2xl text-sm leading-relaxed text-zinc-400">
          Most AI-tool deal pages invent promo codes that never work. We do not publish a single
          coupon unless a vendor confirms it and we can verify it. What we <em>can</em> guarantee:
          every free plan and free trial below is taken straight from the catalog, and
          source-checked prices link to the vendor page.
        </p>
        <p className="mb-10 inline-flex items-center gap-1.5 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-2xs text-amber-200/80">
          <BadgePercent className="h-3.5 w-3.5" aria-hidden="true" /> Where a vendor pays us via an affiliate program it is labelled
          &quot;sponsored&quot; — it never changes the price you pay or what we list.
        </p>

        {/* Vendor deal submission */}
        <section className="mb-14 rounded-3xl border border-accent-500/30 bg-gradient-to-br from-accent-500/10 via-surface-1 to-surface-2 p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <HandCoins className="h-5 w-5 text-accent-400" aria-hidden="true" />
                Vendor with a real creator discount?
              </h2>
              <p className="mt-2 max-w-xl text-sm text-zinc-400">
                Send us the code, the terms and an expiry date. We test it at checkout before it is
                published, and we label it with the date it was verified.
              </p>
            </div>
            <Link
              href="/contact"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-accent-500 px-5 py-3 text-sm font-bold text-black hover:opacity-90"
            >
              Submit a deal <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </section>

        <Section
          title="Pricing we source-checked by hand"
          sub="A human opened the vendor's pricing page and confirmed the number — the source and date are linked on every card."
          tools={priceChecked}
          showSource
        />
        <Section
          title="100% free AI video tools"
          sub="Genuinely free core products, no credit card required."
          tools={freeTools}
        />
        <Section
          title="Freemium — start free, upgrade later"
          sub="Usable free tiers with optional paid plans for heavier workloads."
          tools={freemium}
        />
        <Section
          title="Free trials"
          sub="Test pro features before committing to a subscription."
          tools={trials}
        />

        <aside className="mt-4 flex items-start gap-3 rounded-2xl border border-white/10 bg-surface-1 p-5 text-2xs leading-relaxed text-zinc-500">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
          <p>
            <strong className="text-zinc-300">Why no promo codes yet?</strong> Publishing unverified
            codes is the fastest way to lose your trust, so this section stays empty until we hold a
            confirmed offer. <Sparkles className="inline h-3 w-3 text-accent-300" aria-hidden="true" />{' '}
            Join the <Link href="/#newsletter" className="text-accent-400 underline">briefing list</Link> and
            you&apos;ll hear about real deals the moment they are verified.
          </p>
        </aside>
      </main>
      <Footer />
    </div>
  );
}
