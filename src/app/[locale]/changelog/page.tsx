import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from '@/i18n/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ALL_TOOLS, Tool } from '@/data/tools';
import { GRAVEYARD } from '@/data/graveyard';
import { SmartImage } from '@/components/SmartImage';
import { NewsletterForm } from '@/components/NewsletterForm';
import { Calendar, TrendingUp, AlertTriangle, Sparkles, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'changelog' });
  return {
    title: t('title'),
    description: t('description'),
    alternates: { canonical: '/changelog' },
    openGraph: { title: t('title'), description: t('description'), url: '/changelog', type: 'website' },
  };
}

export default async function ChangelogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'changelog' });

  const newTools = ALL_TOOLS.filter((t) => t.isNew).slice(0, 6);
  const recentlyVerified = ALL_TOOLS.filter((t) => t.verificationLevel !== 'listed-only').slice(0, 8);
  const latestDead = GRAVEYARD.slice(0, 4);

  // Real, auditable numbers (audit fix 2.7) — replaces the invented
  // "198 verified" and "3,400+ creators" claims that contradicted the catalog.
  const priceCheckedCount = ALL_TOOLS.filter((t) => t.verificationLevel !== 'listed-only').length;
  const testedCount = ALL_TOOLS.filter((t) => t.verificationLevel === 'hands-on-tested').length;

  return (
    <div className="min-h-screen bg-surface-0 text-white">
      <Header />

      <main id="main" className="mx-auto max-w-5xl px-4 py-14">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/10">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-accent-500/10 border border-accent-500/20 px-4 py-1.5 text-xs font-semibold text-accent-300 mb-4">
              <Calendar className="h-3.5 w-3.5" /> Friday Editorial Pulse — Week 32, 2026
            </span>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">{t('heading')}</h1>
            <p className="mt-3 max-w-2xl text-sm text-zinc-400 leading-relaxed">
              We audit pricing changes, publish new 24-point hands-on tests, track newly launched AI video tools,
              and archive discontinued products every Friday.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-surface-1 border border-white/10 rounded-2xl px-5 py-3">
            <ShieldCheck className="h-6 w-6 text-emerald-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">Catalog Integrity</div>
              <div className="text-2xs text-zinc-500">
                {ALL_TOOLS.length} tools catalogued · {priceCheckedCount} price-checked · {testedCount} hands-on tested
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: This Week's Hands-On Tests & Price Checks */}
        <section className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <span>Recently Verified &amp; Tested Tools</span>
            </h2>
            <Link href="/tools?tested=1" className="text-xs text-accent-400 hover:underline flex items-center gap-1 font-bold">
              View all verified <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            {recentlyVerified.map((tool) => (
              <div
                key={tool.slug}
                className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4 hover:border-accent-500/30 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-2xs font-bold ${
                        tool.verificationLevel === 'hands-on-tested'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-accent-500/15 text-accent-300 border border-accent-500/30'
                      }`}
                    >
                      {tool.verificationLevel === 'hands-on-tested' ? 'Tested' : 'Price Checked'}
                    </span>
                    <span className="text-2xs text-zinc-500">Aug 2026</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <SmartImage
                      src={tool.logo}
                      alt=""
                      width={36}
                      height={36}
                      className="h-9 w-9 rounded-xl border border-white/10 object-cover"
                    />
                    <div className="min-w-0">
                      <Link href={`/tool/${tool.slug}`} className="text-sm font-bold text-white hover:text-accent-300 truncate block">
                        {tool.name}
                      </Link>
                      <div className="text-2xs text-emerald-400 font-mono">{tool.startingPrice || 'Free'}</div>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/tool/${tool.slug}`}
                  className="mt-4 block text-center rounded-xl bg-surface-2 border border-white/10 py-1.5 text-2xs font-semibold text-zinc-300 hover:text-white"
                >
                  View Details &rarr;
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: Newly Added to Catalog */}
        <section className="mt-14">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent-400" />
              <span>Newly Added to Directory</span>
            </h2>
            <span className="text-xs text-zinc-500">Curated this month</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {newTools.map((tool) => (
              <div
                key={tool.slug}
                className="rounded-2xl border border-white/10 bg-surface-1 p-5 hover:border-accent-500/30 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <SmartImage
                    src={tool.logo}
                    alt=""
                    width={44}
                    height={44}
                    className="h-11 w-11 rounded-xl border border-white/10 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <Link href={`/tool/${tool.slug}`} className="text-sm font-bold text-white hover:text-accent-300 truncate">
                        {tool.name}
                      </Link>
                      <span className="rounded-md bg-accent-500/20 px-2 py-0.5 text-2xs font-bold text-accent-300">
                        NEW
                      </span>
                    </div>
                    <p className="text-2xs text-zinc-400 truncate">{tool.category}</p>
                  </div>
                </div>
                <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">{tool.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Recent Shutdowns & Graveyard Alerts */}
        <section className="mt-14 rounded-3xl border border-rose-500/20 bg-rose-500/5 p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-400" />
                <span>Recent Tool Shutdowns &amp; Discontinuations</span>
              </h2>
              <p className="mt-1 text-xs text-zinc-400">
                We continuously monitor link health so you never build your workflow on dead software.
              </p>
            </div>
            <Link href="/graveyard" className="text-xs text-rose-300 hover:underline font-bold">
              View Graveyard ({GRAVEYARD.length}) &rarr;
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {latestDead.map((dead) => (
              <div key={dead.slug} className="rounded-2xl border border-rose-500/20 bg-black/40 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold text-rose-300">{dead.name}</span>
                  <span className="text-2xs font-bold uppercase text-zinc-500">{dead.diedAt}</span>
                </div>
                <p className="mt-1 text-xs text-zinc-400">{dead.cause}</p>
                <div className="mt-3 text-2xs text-zinc-300">
                  <span className="font-bold text-emerald-400">Recommended migration:</span>{' '}
                  {dead.replacements.join(' · ')}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Newsletter Archive Card */}
        <section className="mt-14 rounded-3xl border border-accent-500/30 bg-gradient-to-r from-accent-500/15 via-surface-1 to-surface-2 p-8 text-center">
          <h2 className="text-2xl font-extrabold text-white">Get Friday Pulse in Your Inbox</h2>
          <p className="mt-2 max-w-xl mx-auto text-sm text-zinc-300">
            Join the launch waitlist for a short weekly breakdown of price changes, benchmark releases and
            graveyard updates for the AI video tools we actually test. We never invent audience numbers — when
            the newsletter is live you will be the first to know.
          </p>
          <div className="mt-6 max-w-md mx-auto">
            <NewsletterForm source="changelog-page" />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
