import { describe, it, expect } from 'vitest';
import {
  searchNews,
  monthBuckets,
  monthLabel,
  parseNewsQuery,
  applyNewsFilters,
} from '@/lib/newsQuery';
import type { NewsItem } from '@/data/news';

const mk = (over: Partial<NewsItem>): NewsItem => ({
  slug: over.slug ?? 'x',
  title: over.title ?? 'Untitled',
  excerpt: over.excerpt ?? '',
  content: '',
  source: 'Test Wire',
  sourceUrl: 'https://example.com',
  publishedAt: `${over.isoDate ?? '2026-08-01'}T09:00:00Z`,
  isoDate: over.isoDate ?? '2026-08-01',
  category: over.category ?? 'Industry',
  aiSummarized: false,
});

const ARCHIVE = [
  mk({ slug: 'a', title: 'ElevenLabs expands dubbing studio to 30 languages', category: 'Voice & Audio', isoDate: '2026-08-02' }),
  mk({ slug: 'b', title: 'Kling 2.0 master model opens to all tiers', category: 'Video Generation', isoDate: '2026-01-14' }),
  mk({ slug: 'c', title: 'YouTube rolls auto-dubbed audio tracks to all channels', category: 'Industry', isoDate: '2026-05-21' }),
  mk({ slug: 'd', title: 'Suno adds stem export and clearer licensing', category: 'Music & Audio', isoDate: '2026-02-09' }),
];

describe('news smart search', () => {
  it('finds by keyword across title/category', () => {
    const r = searchNews('dubbing', ARCHIVE);
    const slugs = r.map((i) => i.slug);
    expect(slugs).toContain('a');
    expect(slugs).toContain('c'); // synonym cluster (auto-dubbed)
  });

  it('is typo tolerant', () => {
    expect(searchNews('dubing', ARCHIVE).some((i) => i.slug === 'a')).toBe(true);
  });

  it('empty query returns everything', () => {
    expect(searchNews('', ARCHIVE)).toHaveLength(4);
  });
});

describe('month buckets + date menu', () => {
  it('builds descending buckets with counts', () => {
    const b = monthBuckets(ARCHIVE);
    expect(b[0].key).toBe('2026-08');
    expect(b.map((x) => x.key)).toEqual(['2026-08', '2026-05', '2026-02', '2026-01']);
    expect(b[0].count).toBe(1);
  });

  it('labels months in English', () => {
    expect(monthLabel('2026-01')).toBe('January 2026');
  });

  it('parse defaults to the latest bucket and validates garbage', () => {
    const buckets = monthBuckets(ARCHIVE);
    const q = parseNewsQuery({ m: '1999-01' }, buckets);
    expect(q.month).toBe('2026-08');
    const all = parseNewsQuery({ m: 'all' }, buckets);
    expect(all.month).toBe('all');
  });

  it('applyNewsFilters combines month + category + search', () => {
    const q = { q: '', month: 'all', category: 'Voice & Audio' };
    expect(applyNewsFilters(ARCHIVE, q)).toHaveLength(1);
    const q2 = { q: 'dubbing', month: 'all', category: '' };
    expect(applyNewsFilters(ARCHIVE, q2).length).toBeGreaterThanOrEqual(2);
  });
});
