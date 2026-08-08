import {
  ALL_TOOLS,
  CATEGORIES,
  PRICING_OPTIONS,
  hasVerifiedScore,
  type Tool,
  type Category,
  type PricingOption,
} from '@/data/tools';
import { searchToolsAdvanced } from '@/lib/search';
import { rankValue as honestRankValue } from '@/lib/ranking';

export const PAGE_SIZE = 24;

export type SortKey = 'relevance' | 'rating' | 'newest' | 'price-low' | 'price-high' | 'name';

/**
 * Verification facet (critique §4 — "combined filters like free + shorts +
 * auto-captions were impossible"). Values:
 *   any          — everything
 *   tested       — hands-on-tested with published evidence
 *   price-checked— at least pricing-verified
 *   listed       — catalogued only, no verification claim
 */
export type VerificationFilter = 'any' | 'tested' | 'price-checked' | 'listed';

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'relevance', label: 'Best match' },
  { value: 'rating', label: 'Top Verified (Tested First)' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price: low to high' },
  { value: 'price-high', label: 'Price: high to low' },
  { value: 'name', label: 'Name A–Z' },
];

export interface ToolQuery {
  q: string;
  category: Category;
  pricing: PricingOption;
  sort: SortKey;
  page: number;
  /** Only show tools we have actually run (kept for old ?tested=1 links). */
  testedOnly: boolean;
  /** AND-combined capability tags, e.g. ["Shorts", "Auto-Captions"]. */
  tags: string[];
  /** Verification-level facet. */
  verification: VerificationFilter;
}

const VERIFICATION_OPTIONS: VerificationFilter[] = ['any', 'tested', 'price-checked', 'listed'];

/** Parse untrusted search params into a validated query. */
export function parseToolQuery(sp: Record<string, string | string[] | undefined>): ToolQuery {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

  const rawCategory = one(sp.category);
  const rawPricing = one(sp.pricing);
  const rawSort = one(sp.sort) as SortKey;
  const rawVerification = one(sp.verification) as VerificationFilter;
  const pageNum = parseInt(one(sp.page) || '1', 10);

  // Tags are only accepted if they exist verbatim in the catalog — prevents
  // garbage params from producing silently-empty pages.
  const catalogTags = new Set<string>();
  for (const t of ALL_TOOLS) for (const tag of t.tags) catalogTags.add(tag.toLowerCase());
  const tags = one(sp.tags)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6)
    .filter((tag) => catalogTags.has(tag.toLowerCase()));

  return {
    q: one(sp.q).slice(0, 80),
    category: (CATEGORIES as readonly string[]).includes(rawCategory)
      ? (rawCategory as Category)
      : 'All',
    pricing: (PRICING_OPTIONS as readonly string[]).includes(rawPricing)
      ? (rawPricing as PricingOption)
      : 'All',
    sort: SORT_OPTIONS.some((o) => o.value === rawSort) ? rawSort : 'relevance',
    page: Number.isFinite(pageNum) && pageNum > 0 ? Math.min(pageNum, 500) : 1,
    testedOnly: one(sp.tested) === '1',
    tags,
    verification:
      VERIFICATION_OPTIONS.includes(rawVerification)
        ? rawVerification
        : one(sp.tested) === '1'
          ? 'tested'
          : 'any',
  };
}

function priceValue(s?: string): number {
  if (!s) return 0;
  const m = s.match(/[\d.]+/);
  return m ? parseFloat(m[0]) : 0;
}

/** Sort value for a tool — now uses the honest central ranking (audit fix 2.4). */
function rankValue(t: Tool): number {
  return honestRankValue(t);
}

export function filterTools(query: ToolQuery, source: Tool[] = ALL_TOOLS): Tool[] {
  let result = source;

  if (query.category !== 'All') result = result.filter((t) => t.category === query.category);
  if (query.pricing !== 'All') result = result.filter((t) => t.pricing === query.pricing);
  if (query.testedOnly || query.verification === 'tested') {
    result = result.filter(hasVerifiedScore);
  } else if (query.verification === 'price-checked') {
    result = result.filter((t) => t.verificationLevel !== 'listed-only');
  } else if (query.verification === 'listed') {
    result = result.filter((t) => t.verificationLevel === 'listed-only');
  }
  if (query.tags.length > 0) {
    const wanted = query.tags.map((t) => t.toLowerCase());
    result = result.filter((t) => {
      const toolTags = t.tags.map((x) => x.toLowerCase());
      return wanted.every((tag) => toolTags.includes(tag));
    });
  }

  const searched = query.q.trim().length > 0;
  if (searched) result = searchToolsAdvanced(query.q, result, 400);

  // 'relevance' keeps the search engine's ordering; with no query it means
  // "tools we can actually vouch for first".
  if (query.sort === 'relevance' && searched) return result;

  const sorted = [...result];
  switch (query.sort) {
    case 'newest':
      sorted.sort((a, b) => (b.launchDate || '').localeCompare(a.launchDate || ''));
      break;
    case 'price-low':
      sorted.sort((a, b) => priceValue(a.startingPrice) - priceValue(b.startingPrice));
      break;
    case 'price-high':
      sorted.sort((a, b) => priceValue(b.startingPrice) - priceValue(a.startingPrice));
      break;
    case 'name':
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'rating':
      sorted.sort((a, b) => rankValue(b) - rankValue(a));
      break;
    case 'relevance':
    default:
      sorted.sort((a, b) => {
        const av = hasVerifiedScore(a) ? 1 : 0;
        const bv = hasVerifiedScore(b) ? 1 : 0;
        if (av !== bv) return bv - av;
        return rankValue(b) - rankValue(a);
      });
  }
  return sorted;
}

export function paginate<T>(items: T[], page: number, size = PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(items.length / size));
  const safePage = Math.min(Math.max(1, page), totalPages);
  return {
    items: items.slice((safePage - 1) * size, safePage * size),
    page: safePage,
    totalPages,
    total: items.length,
  };
}

/** Build a canonical query string, omitting defaults so URLs stay clean. */
export function buildToolsHref(q: Partial<ToolQuery>, page?: number): string {
  const sp = new URLSearchParams();
  if (q.q) sp.set('q', q.q);
  if (q.category && q.category !== 'All') sp.set('category', q.category);
  if (q.pricing && q.pricing !== 'All') sp.set('pricing', q.pricing);
  if (q.sort && q.sort !== 'relevance') sp.set('sort', q.sort);
  if (q.testedOnly) sp.set('tested', '1');
  if (q.tags && q.tags.length > 0) sp.set('tags', q.tags.join(','));
  if (q.verification && q.verification !== 'any') sp.set('verification', q.verification);
  if (page && page > 1) sp.set('page', String(page));
  const s = sp.toString();
  return `/tools${s ? `?${s}` : ''}`;
}

/** Counts per category/pricing/tag so filter labels can show "(30)" (audit 4.4). */
export function facetCounts(source: Tool[] = ALL_TOOLS, topTags = 18) {
  const category = new Map<string, number>();
  const pricing = new Map<string, number>();
  const tagCount = new Map<string, number>();
  for (const t of source) {
    category.set(t.category, (category.get(t.category) || 0) + 1);
    pricing.set(t.pricing, (pricing.get(t.pricing) || 0) + 1);
    for (const tag of t.tags) {
      tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
    }
  }
  // Most common tags first — these become the combinable capability filters.
  const tags = [...tagCount.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, topTags);
  return {
    category,
    pricing,
    tags,
    tested: source.filter(hasVerifiedScore).length,
    priceChecked: source.filter((t) => t.verificationLevel !== 'listed-only').length,
    listed: source.filter((t) => t.verificationLevel === 'listed-only').length,
    total: source.length,
  };
}
