import { notFound } from 'next/navigation';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { AppProviders } from '@/context/AppProviders';
import { ThemeProvider } from '@/components/ThemeProvider';
import { CookieConsent } from '@/components/CookieConsent';
import { AnnouncementBanner } from '@/components/AnnouncementBanner';
import { SmoothScroll } from '@/components/SmoothScroll';
import { SkipLink } from '@/components/SkipLink';

/**
 * Locale layout — everything that must exist inside <html> for every
 * language: the intl provider (dictionaries), theme, auth/bookmark context,
 * smooth scroll, announcement banner and the cookie consent.
 *
 * generateStaticParams pre-renders all 8 locales at build time so every
 * language version of every static page is served from the edge cache.
 */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  return (
    <NextIntlClientProvider>
      <ThemeProvider>
        <SmoothScroll>
          <AppProviders>
            <SkipLink />
            <AnnouncementBanner />
            {children}
            <CookieConsent />
          </AppProviders>
        </SmoothScroll>
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
