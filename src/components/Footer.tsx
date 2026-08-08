'use client';

import Link from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { ALL_TOOLS, hasVerifiedScore } from '@/data/tools';
import { SITE_NAME } from '@/config/site';
import { REAL_CATEGORIES, categorySlug, getCategoryTools } from '@/lib/categories';

/**
 * Footer — fully localized (i18n, 2026-08-07).
 *
 * Deliberately a CLIENT component: several pages import it from client
 * components (CompareClient, StackBuilderClient, LoginClient, account), so it
 * must only use client-safe APIs. All strings come from the per-locale
 * message dictionaries (useTranslations), which are available client-side via
 * NextIntlClientProvider.
 */
export function Footer() {
  const t = useTranslations('footer');
  const tc = useTranslations('categories');

  const testedCount = ALL_TOOLS.filter(hasVerifiedScore).length;
  const hasAffiliates = ALL_TOOLS.some((x) => x.affiliateProgram);
  const year = new Date().getFullYear();

  // Top categories by size, for internal link equity.
  const topCategories = [...REAL_CATEGORIES]
    .sort((a, b) => getCategoryTools(b).length - getCategoryTools(a).length)
    .slice(0, 6);

  const label = (c: string) => (tc.has(c) ? tc(c) : c);

  return (
    <footer className="footer-glow border-t border-white/5 bg-black px-4 py-12">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 text-2xs md:grid-cols-6">
        <div className="col-span-2">
          <h2 className="mb-3 font-bold text-white">{SITE_NAME}</h2>
          <p className="mb-3 leading-relaxed text-zinc-500">
            {t('taglineBlurb', { count: ALL_TOOLS.length, tested: testedCount })}
          </p>
          {hasAffiliates ? (
            <p className="text-2xs leading-relaxed text-zinc-600">
              <span className="font-semibold text-zinc-500">{t('ftcDisclosure')}</span>{' '}
              <Link href="/disclosure" className="underline hover:text-zinc-400">
                {t('learnMore')}
              </Link>
            </p>
          ) : (
            <p className="text-2xs leading-relaxed text-zinc-600">
              <span className="font-semibold text-zinc-500">{t('noAffiliate')}</span>{' '}
              <Link href="/disclosure" className="underline hover:text-zinc-400">
                {t('ourPosition')}
              </Link>
            </p>
          )}
        </div>

        <div>
          <h2 className="mb-3 font-bold text-white">{t('directory')}</h2>
          <ul className="space-y-2 text-zinc-500">
            <li><Link href="/tools" className="hover:text-accent-400">{t('allTools')}</Link></li>
            <li><Link href="/tools?pricing=Free" className="hover:text-accent-400">{t('freeTools')}</Link></li>
            <li><Link href="/tools?tested=1" className="hover:text-accent-400">{t('testedTools')}</Link></li>
            <li><Link href="/trending" className="hover:text-accent-400">{t('trendingSaved')}</Link></li>
            <li><Link href="/compare" className="hover:text-accent-400">{t('compare')}</Link></li>
            <li><Link href="/stack-builder" className="hover:text-accent-400">{t('stackBuilder')}</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 font-bold text-white">{t('categories')}</h2>
          <ul className="space-y-2 text-zinc-500">
            {topCategories.map((c) => (
              <li key={c}>
                <Link href={`/category/${categorySlug(c)}`} className="hover:text-accent-400">
                  {label(c)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-3 font-bold text-white">{t('resources')}</h2>
          <ul className="space-y-2 text-zinc-500">
            <li><Link href="/guide" className="hover:text-accent-400">{t('gettingStartedGuide')}</Link></li>
            <li><Link href="/benchmark" className="hover:text-accent-400">{t('benchmarkLab')}</Link></li>
            <li><Link href="/calculators" className="hover:text-accent-400">{t('freeCalculators')}</Link></li>
            <li><Link href="/deals" className="hover:text-accent-400">{t('dealsCodes')}</Link></li>
            <li><Link href="/changelog" className="hover:text-accent-400">{t('whatsNew')}</Link></li>
            <li><Link href="/graveyard" className="hover:text-accent-400">{t('toolGraveyard')}</Link></li>
            <li><Link href="/blog" className="hover:text-accent-400">{t('guides')}</Link></li>
            <li><Link href="/news" className="hover:text-accent-400">{t('aiNewsFeed')}</Link></li>
            <li><Link href="/best-of" className="hover:text-accent-400">{t('bestOf')}</Link></li>
            <li><Link href="/developers" className="hover:text-accent-400">{t('publicApi')}</Link></li>
            <li><Link href="/feed.xml" className="hover:text-accent-400">{t('rssFeed')}</Link></li>
            <li><Link href="/feed-tools.xml" className="hover:text-accent-400">{t('newToolsRss')}</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 font-bold text-white">{t('company')}</h2>
          <ul className="space-y-2 text-zinc-500">
            <li><Link href="/about" className="hover:text-accent-400">{t('aboutMethodology')}</Link></li>
            <li><Link href="/founders" className="hover:text-accent-400">{t('claimYourTool')}</Link></li>
            <li><Link href="/submit" className="hover:text-accent-400">{t('submitTool')}</Link></li>
            <li><Link href="/contact" className="hover:text-accent-400">{t('contact')}</Link></li>
            <li><Link href="/privacy" className="hover:text-accent-400">{t('privacy')}</Link></li>
            <li><Link href="/terms" className="hover:text-accent-400">{t('terms')}</Link></li>
            <li><Link href="/disclosure" className="hover:text-accent-400">{t('disclosure')}</Link></li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-7xl border-t border-white/5 pt-6 text-center text-2xs text-zinc-600">
        {t('copyright', { year, name: SITE_NAME })}
      </div>
    </footer>
  );
}
