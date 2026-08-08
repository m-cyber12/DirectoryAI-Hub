import { hasVerifiedScore, computeOverall, type Tool } from '@/data/tools';

/**
 * Honest ranking (audit fix 2.4 / trust sprint).
 *
 * The seed catalog carried invented `rating`, `reviewsCount`, `isTrending`
 * and `metrics` values that were never sourced. The UI stopped *displaying*
 * scores, but several ranking paths still secretly sorted by those fields —
 * which is worse than showing a score, because it is not auditable by users.
 *
 * This module is the single source of truth for "how should tools be
 * ordered", and it deliberately ignores every fabricated popularity signal.
 * Ordering is driven only by:
 *
 *   1. verification level (hands-on-tested > pricing-verified > listed-only),
 *   2. a small, explicit editorial bonus for `isFeatured` / `isEditorsChoice`
 *      (a transparent editorial judgement, not a fake crowd metric), and
 *   3. the tool's real hands-on score when one exists.
 *
 * Name is used only as a deterministic tiebreak. Nothing here reads
 * `rating`, `reviewsCount` or `isTrending`.
 */

/** 0–~110 rank: verification first, then verified score, then editorial flags. */
export function rankValue(t: Tool): number {
  let v = 0;
  if (hasVerifiedScore(t) && t.scores) {
    v += 100 + computeOverall(t.scores);
  } else if (t.verificationLevel === 'pricing-verified') {
    v += 50;
  }
  if (t.isFeatured) v += 3;
  if (t.isEditorsChoice) v += 2;
  return v;
}

/** Readable tier used when we want to explain why something ranked where it did. */
export function rankLabel(t: Tool): string {
  if (t.verificationLevel === 'hands-on-tested') return 'hands-on tested with evidence';
  if (t.verificationLevel === 'pricing-verified') return 'pricing source-checked';
  return 'catalogued only';
}

/** Generic comparator that orders two tools by the honest rank (desc), name as tiebreak. */
export function byRankDesc(a: Tool, b: Tool): number {
  const d = rankValue(b) - rankValue(a);
  return d !== 0 ? d : a.name.localeCompare(b.name);
}
