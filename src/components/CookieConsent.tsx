'use client';

import React, { useEffect, useState } from 'react';
import Link from '@/i18n/navigation';
import { Cookie, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

/**
 * Audit fix 1.7 — the reverse consent problem.
 *
 * The old banner asked permission for "optional analytics cookies" at a time
 * when the site had no analytics at all, and offered an "Accept All" button
 * that did precisely nothing either way. Asking consent for processing that
 * does not happen is its own compliance defect: it misdescribes what the site
 * does, and it trains users to click through real consent requests.
 *
 * What actually happens now:
 *   - Vercel Analytics and Speed Insights are cookieless and store no
 *     cross-site identifier, so under GDPR/ePrivacy they do not require prior
 *     consent.
 *   - localStorage is used only for your own bookmarks and this dismissal —
 *     strictly necessary for a feature you asked for.
 *
 * So this is an honest notice with a dismiss control, not a fake choice. If a
 * genuinely consent-requiring tool is ever added (ad pixels, cross-site
 * tracking), restore a real two-button opt-in and gate the script on it.
 */
export function CookieConsent() {
  const t = useTranslations('cookie');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem('cah_privacy_notice_seen')) setVisible(true);
    } catch {
      /* storage blocked — just don't show the notice */
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem('cah_privacy_notice_seen', '1');
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    // Slim, single-line bar (refactor 2026-08-06): the previous bottom card was
    // large enough to cover CTAs/cards on first visit. This compact bar sits at
    // the very bottom edge, fades quickly, and stays out of the content's way.
    <div
      role="region"
      aria-label="Privacy notice"
      className="fixed inset-x-0 bottom-0 z-[60]"
    >
      <div className="border-t border-white/10 bg-surface-0/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5">
          <Cookie className="h-4 w-4 shrink-0 text-accent-400" aria-hidden="true" />
          <p className="min-w-0 flex-1 text-2xs leading-snug text-zinc-400">
            <strong className="text-zinc-200">{t('title')}.</strong> {t('text')}{' '}
            <Link href="/privacy" className="text-accent-400 underline hover:text-accent-300">
              {t('privacyLink')}
            </Link>
          </p>
          <button
            onClick={dismiss}
            className="rounded-lg bg-accent-500 px-3 py-1.5 text-2xs font-bold text-black transition-opacity hover:opacity-90"
          >
            {t('accept')}
          </button>
          <button
            onClick={dismiss}
            aria-label={t('decline')}
            className="rounded-lg p-1 text-zinc-500 hover:text-white"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
