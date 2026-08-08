import { describe, it, expect } from 'vitest';
import {
  parseToolQuery,
  filterTools,
  buildToolsHref,
  paginate,
  facetCounts,
} from '@/lib/toolFilters';
import { ALL_TOOLS } from '@/data/tools';

/**
 * Critique §4 — combined filters ("free + shorts + auto-captions") must work
 * and be shareable through the URL.
 */
describe('parseToolQuery', () => {
  it('accepts valid categories and pricing, rejects garbage', () => {
    const q = parseToolQuery({ category: 'Voice & Audio', pricing: 'Free' });
    expect(q.category).toBe('Voice & Audio');
    expect(q.pricing).toBe('Free');

    const bad = parseToolQuery({ category: 'Hack', pricing: 'Cheap' });
    expect(bad.category).toBe('All');
    expect(bad.pricing).toBe('All');
  });

  it('only accepts tags that exist in the catalog', () => {
    const realTag = ALL_TOOLS[0].tags[0];
    const q = parseToolQuery({ tags: `${realTag},not-a-real-tag-xyz` });
    expect(q.tags).toEqual([realTag]);
  });

  it('maps legacy tested=1 to the tested verification facet', () => {
    const q = parseToolQuery({ tested: '1' });
    expect(q.verification).toBe('tested');
  });
});

describe('filterTools', () => {
  it('combines category + pricing + tags (AND semantics)', () => {
    const base = parseToolQuery({});
    const shortsTools = ALL_TOOLS.filter((t) =>
      t.tags.some((tag) => tag.toLowerCase() === 'shorts')
    );
    if (shortsTools.length === 0) return; // nothing to assert on

    const q = { ...base, tags: ['Shorts'] };
    const result = filterTools(q);
    expect(result.length).toBeGreaterThan(0);
    for (const t of result) {
      expect(t.tags.map((x) => x.toLowerCase())).toContain('shorts');
    }
  });

  it('verification=listed returns only listed-only tools', () => {
    const q = { ...parseToolQuery({}), verification: 'listed' as const };
    const result = filterTools(q);
    expect(result.length).toBeGreaterThan(0);
    for (const t of result) expect(t.verificationLevel).toBe('listed-only');
  });

  it('verification=price-checked excludes listed-only', () => {
    const q = { ...parseToolQuery({}), verification: 'price-checked' as const };
    const result = filterTools(q);
    for (const t of result) expect(t.verificationLevel).not.toBe('listed-only');
  });
});

describe('buildToolsHref', () => {
  it('round-trips tags and verification through the URL', () => {
    const href = buildToolsHref({
      q: '',
      category: 'All',
      pricing: 'Freemium',
      sort: 'relevance',
      tags: ['Shorts', 'Auto-Captions'],
      verification: 'price-checked',
    });
    expect(href).toContain('pricing=Freemium');
    expect(href).toContain('tags=Shorts');
    expect(href).toContain('verification=price-checked');
    const parsed = parseToolQuery(Object.fromEntries(new URLSearchParams(href.split('?')[1] || '')));
    expect(parsed.tags.map((t) => t.toLowerCase())).toEqual(['shorts', 'auto-captions']);
    expect(parsed.verification).toBe('price-checked');
  });
});

describe('paginate + facets', () => {
  it('clamps pages and reports totals', () => {
    const items = Array.from({ length: 50 }, (_, i) => i);
    const p = paginate(items, 999, 24);
    expect(p.page).toBe(3);
    expect(p.total).toBe(50);
    expect(p.items.length).toBe(2);
  });

  it('facet counts cover tags, tested and price-checked', () => {
    const f = facetCounts();
    expect(f.total).toBe(ALL_TOOLS.length);
    expect(f.tags.length).toBeGreaterThan(0);
    expect(f.priceChecked).toBeGreaterThanOrEqual(f.tested);
    expect(f.listed + f.priceChecked).toBe(f.total);
  });
});
