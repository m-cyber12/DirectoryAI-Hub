import { defineRouting } from 'next-intl/routing';

/**
 * Locale routing — the single source of truth for which languages the site
 * ships. English is the default and lives at `/` (no prefix). Every other
 * locale gets a clean, crawlable prefix: `/es`, `/pt`, `/fr`, `/de`, `/zh`,
 * `/ar`, `/fa`.
 *
 * `localeDetection: true` (default) means first-time visitors are offered
 * their Accept-Language match when it differs from the default, and every
 * page emits the full hreflang `alternates` block.
 */
export const routing = defineRouting({
  locales: ['en', 'es', 'pt', 'fr', 'de', 'zh', 'ar', 'fa'],
  defaultLocale: 'en',
  localePrefix: 'as-needed',
});

export type Locale = (typeof routing.locales)[number];

/** Locales that require right-to-left layout. */
export const RTL_LOCALES: ReadonlySet<string> = new Set(['ar', 'fa']);

export const isRTL = (locale: string) => RTL_LOCALES.has(locale);

/**
 * Human-readable native names for the language switcher.
 * `native` is the label shown in the switcher, `en` the label shown in
 * English UI contexts.
 */
export const LOCALE_META: Record<
  Locale,
  { native: string; en: string; flag: string; dir: 'ltr' | 'rtl' }
> = {
  en: { native: 'English', en: 'English', flag: '🇬🇧', dir: 'ltr' },
  es: { native: 'Español', en: 'Spanish', flag: '🇪🇸', dir: 'ltr' },
  pt: { native: 'Português', en: 'Portuguese', flag: '🇵🇹', dir: 'ltr' },
  fr: { native: 'Français', en: 'French', flag: '🇫🇷', dir: 'ltr' },
  de: { native: 'Deutsch', en: 'German', flag: '🇩🇪', dir: 'ltr' },
  zh: { native: '简体中文', en: 'Chinese (Simplified)', flag: '🇨🇳', dir: 'ltr' },
  ar: { native: 'العربية', en: 'Arabic', flag: '🇸🇦', dir: 'rtl' },
  fa: { native: 'فارسی', en: 'Persian (Farsi)', flag: '🇮🇷', dir: 'rtl' },
};

/** Locales that the professional translation engine produces (all except English). */
export const TRANSLATED_LOCALES = routing.locales.filter((l) => l !== 'en') as Exclude<
  Locale,
  'en'
>[];
