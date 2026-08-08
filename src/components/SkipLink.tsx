'use client';

import { useTranslations } from 'next-intl';

/**
 * Accessibility skip link (audit fix 4.6) — moved into the locale layout so
 * the label is translated in every language.
 */
export function SkipLink() {
  const t = useTranslations('common');
  return (
    <a
      href="#main"
      className="sr-only z-[100] rounded-lg bg-accent-500 px-4 py-2 text-sm font-bold text-black focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
    >
      {t('skipToContent')}
    </a>
  );
}
