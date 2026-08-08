'use client';

import Link from '@/i18n/navigation';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, RefreshCw, Home, Wrench } from 'lucide-react';

/**
 * Route-level error boundary (critique §6: "if one tool page crashes, the
 * whole app crashes — Next.js needs error.tsx"). Without this file any throw
 * inside a page unmounts the entire layout; with it, the broken route shows a
 * recovery screen while the header/footer navigation keeps working.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('errorPage');
  useEffect(() => {
    // Vercel Analytics / log integrations can pick this up; kept console-safe.
    console.error('Route error:', error.digest ?? error.message);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-20 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10">
        <AlertTriangle className="h-6 w-6 text-amber-400" aria-hidden="true" />
      </span>
      <h1 className="mt-6 text-2xl font-black tracking-tight text-white">
        {t('title')}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400">
        {t('text')}
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-2xs text-zinc-600">ref: {error.digest}</p>
      )}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-xl bg-accent-500 px-5 py-2.5 text-sm font-bold text-black hover:opacity-90"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" /> {t('retry')}
        </button>
        <Link
          href="/tools"
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-surface-1 px-5 py-2.5 text-sm font-bold text-zinc-200 hover:border-accent-500/50"
        >
          <Wrench className="h-4 w-4" aria-hidden="true" /> {t('browseTools')}
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-surface-1 px-5 py-2.5 text-sm font-bold text-zinc-200 hover:border-accent-500/50"
        >
          <Home className="h-4 w-4" aria-hidden="true" /> {t('home')}
        </Link>
      </div>
    </div>
  );
}
