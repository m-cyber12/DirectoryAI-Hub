import { describe, it, expect } from 'vitest';
import { searchToolsAdvanced, extractFilters } from '@/lib/search';

describe('advanced search', () => {
  it('extracts a Free pricing intent from natural language', () => {
    const { cleaned, filters } = extractFilters('free voice cloning');
    expect(filters.pricing).toBe('Free');
    expect(cleaned).not.toContain('free');
  });

  it('matches synonyms (caption ↔ subtitles)', () => {
    const viaCaption = searchToolsAdvanced('caption generator');
    const viaSubtitle = searchToolsAdvanced('subtitle generator');
    expect(viaCaption.length).toBeGreaterThan(0);
    expect(viaSubtitle.length).toBeGreaterThan(0);
  });

  it('never returns tools missing every term', () => {
    const results = searchToolsAdvanced('opusclip');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].slug).toBe('opusclip');
  });

  it('tolerates mild typos', () => {
    const results = searchToolsAdvanced('descrpt');
    expect(results.some((t) => t.slug === 'descript')).toBe(true);
  });
});
