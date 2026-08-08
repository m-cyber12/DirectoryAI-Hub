import { supabase } from '@/lib/supabase';

/**
 * Real approved-review statistics, used to decide whether an aggregateRating
 * may legally and safely be emitted.
 *
 * Audit fix 1.2 — the old tool page always emitted:
 *     ratingCount: Math.max(tool.reviewsCount, 1)
 * For the 153 generated tools reviewsCount was 0, so the site told Google
 * "1 person rated this 4.8" on pages with no reviews at all. Google treats
 * that as structured-data spam; the usual outcome is losing rich results
 * entirely, sometimes a manual action.
 *
 * This reads the actual approved rows. If Supabase is unavailable it returns
 * zero, which means no aggregateRating is emitted — failing closed is the
 * correct behaviour for a trust signal.
 */

export interface ReviewStats {
  count: number;
  average: number;
}

const EMPTY: ReviewStats = { count: 0, average: 0 };

export async function getApprovedReviewStats(toolSlug: string): Promise<ReviewStats> {
  if (!supabase) return EMPTY;

  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('tool_slug', toolSlug)
      .eq('status', 'approved');

    if (error || !data || data.length === 0) return EMPTY;

    const ratings = data
      .map((r) => Number((r as { rating: number }).rating))
      .filter((n) => Number.isFinite(n) && n >= 1 && n <= 5);

    if (ratings.length === 0) return EMPTY;

    const sum = ratings.reduce((a, b) => a + b, 0);
    return {
      count: ratings.length,
      average: Math.round((sum / ratings.length) * 10) / 10,
    };
  } catch {
    // Never let a stats failure break a build or a page render.
    return EMPTY;
  }
}
