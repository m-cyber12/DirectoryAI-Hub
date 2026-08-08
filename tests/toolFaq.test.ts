import { describe, it, expect } from 'vitest';
import { buildToolFaq } from '@/lib/toolFaq';
import type { Tool } from '@/data/tools';

const base: Tool = {
  id: 't1',
  name: 'ExampleTool',
  slug: 'exampletool',
  tagline: 'Example tagline',
  description: 'Example description.',
  url: 'https://example.com',
  logo: '',
  coverImage: '',
  category: 'Video Repurposing',
  pricing: 'Freemium',
  startingPrice: '$15/mo',
  rating: 4,
  reviewsCount: 0,
  isFeatured: false,
  isEditorsChoice: false,
  isTrending: false,
  isNew: false,
  hasFounderBadge: false,
  tags: ['Shorts'],
  verificationLevel: 'listed-only',
};

describe('tool FAQ honesty', () => {
  it('never claims a test for a listed-only tool', () => {
    const faqs = buildToolFaq(base, ['Other']);
    const status = faqs.find((f) => f.q.includes('tested'));
    expect(status).toBeDefined();
    expect(status!.a).toContain('Not yet');
    expect(status!.a).not.toContain('We ran');
  });

  it('mentions the source check for pricing-verified tools', () => {
    const tool: Tool = {
      ...base,
      verificationLevel: 'pricing-verified',
      pricingSourceUrl: 'https://example.com/pricing',
      pricingCheckedAt: '2026-08-04',
    };
    const faqs = buildToolFaq(tool, []);
    const status = faqs.find((f) => f.q.includes('tested'));
    expect(status!.a).toContain('2026-08-04');
    expect(status!.a).toContain('pricing');
  });

  it('answers the cost question with the listed price', () => {
    const faqs = buildToolFaq(base, []);
    const cost = faqs.find((f) => f.q.includes('cost'));
    expect(cost!.a).toContain('$15/mo');
  });

  it('lists alternatives only when provided', () => {
    expect(buildToolFaq(base, []).some((f) => f.q.includes('alternatives'))).toBe(false);
    expect(buildToolFaq(base, ['Alpha', 'Beta', 'Gamma']).some((f) => f.q.includes('alternatives'))).toBe(true);
  });

  it('prepends custom FAQs and caps the total', () => {
    const custom = [
      { q: 'Custom A?', a: 'Answer A.' },
      { q: 'Custom B?', a: 'Answer B.' },
    ];
    const faqs = buildToolFaq(base, ['X', 'Y'], custom);
    expect(faqs[0].q).toBe('Custom A?');
    expect(faqs.length).toBeLessThanOrEqual(7);
  });
});
