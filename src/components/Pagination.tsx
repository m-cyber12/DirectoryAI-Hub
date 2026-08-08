import Link from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Audit fix 1.4 — real crawlable pagination.
 *
 * The catalog previously used a "Load More" button, which no crawler clicks.
 * That left 176 of 200 tools invisible to Google. These are genuine <a href>
 * links rendered on the server, so every page of the catalog is reachable.
 */
export function Pagination({
  page,
  totalPages,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
}): React.JSX.Element | null {
  const t = useTranslations('common');
  if (totalPages <= 1) return null;

  // Compact window: 1 … 4 5 [6] 7 8 … 20
  const pages: (number | 'gap')[] = [];
  const push = (n: number | 'gap') => pages.push(n);
  const window = 2;

  for (let i = 1; i <= totalPages; i++) {
    const inWindow = Math.abs(i - page) <= window;
    const isEdge = i === 1 || i === totalPages;
    if (inWindow || isEdge) push(i);
    else if (pages[pages.length - 1] !== 'gap') push('gap');
  }

  const linkBase =
    'inline-flex h-10 min-w-10 items-center justify-center rounded-lg border px-3 text-sm font-semibold transition-colors';

  return (
    <nav
      className="mt-10 flex flex-wrap items-center justify-center gap-2"
      aria-label={t('pagination')}
    >
      {page > 1 ? (
        <Link
          href={hrefFor(page - 1)}
          rel="prev"
          className={`${linkBase} border-white/10 bg-surface-1 text-zinc-300 hover:border-accent-500/40 hover:text-accent-300`}
          aria-label={t('prev')}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          <span className="ms-1 hidden sm:inline">{t('prev')}</span>
        </Link>
      ) : (
        <span
          className={`${linkBase} cursor-not-allowed border-white/5 bg-surface-1/50 text-zinc-600`}
          aria-disabled="true"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          <span className="ms-1 hidden sm:inline">{t('prev')}</span>
        </span>
      )}

      {pages.map((p, i) =>
        p === 'gap' ? (
          <span key={`gap-${i}`} className="px-1 text-sm text-zinc-600" aria-hidden="true">
            …
          </span>
        ) : p === page ? (
          <span
            key={p}
            aria-current="page"
            className={`${linkBase} border-accent-500/50 bg-accent-500/15 font-mono tabular-nums text-accent-300`}
          >
            {p}
          </span>
        ) : (
          <Link
            key={p}
            href={hrefFor(p)}
            className={`${linkBase} border-white/10 bg-surface-1 font-mono tabular-nums text-zinc-300 hover:border-accent-500/40 hover:text-accent-300`}
            aria-label={`${t('page')} ${p}`}
          >
            {p}
          </Link>
        )
      )}

      {page < totalPages ? (
        <Link
          href={hrefFor(page + 1)}
          rel="next"
          className={`${linkBase} border-white/10 bg-surface-1 text-zinc-300 hover:border-accent-500/40 hover:text-accent-300`}
          aria-label={t('next')}
        >
          <span className="me-1 hidden sm:inline">{t('next')}</span>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : (
        <span
          className={`${linkBase} cursor-not-allowed border-white/5 bg-surface-1/50 text-zinc-600`}
          aria-disabled="true"
        >
          <span className="me-1 hidden sm:inline">{t('next')}</span>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </span>
      )}
    </nav>
  );
}
