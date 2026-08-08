import { describe, it, expect } from 'vitest';
import { scoreRelevance, filterRelevant } from '@/lib/newsRelevance';

/**
 * Critique §7 — the news page must never show off-topic stories again.
 * These cases are the exact failure modes the critique listed, plus the
 * positive cases that must keep passing.
 */
describe('news relevance gate', () => {
  it('rejects the Tesla story the critique called out', () => {
    const r = scoreRelevance({
      title: "China is Tesla's cash cow",
      excerpt: 'Tesla earnings depend heavily on Shanghai production.',
    });
    expect(r.relevant).toBe(false);
  });

  it('rejects the Pixel hardware story', () => {
    const r = scoreRelevance({
      title: "The Pixel 11's glow feature lights up the night",
      excerpt: 'Google hardware team reveals a new notification glow.',
    });
    expect(r.relevant).toBe(false);
  });

  it('hard-blocks political and health-scare stories', () => {
    const politics = scoreRelevance({
      title: 'Tom DeLay helped create TV ownership cap, senators argue',
      excerpt: 'Congress debates broadcast regulation again.',
    });
    expect(politics.relevant).toBe(false);
    expect(politics.blockedBy).toBeTruthy();

    const health = scoreRelevance({
      title: 'Trump admin aware of deaths in explosive diarrhea outbreak',
      excerpt: 'Officials respond to spreading illness.',
    });
    expect(health.relevant).toBe(false);
    expect(health.blockedBy).toBeTruthy();
  });

  it('accepts a genuine AI video story', () => {
    const r = scoreRelevance({
      title: 'Runway releases new video generation model with better motion',
      excerpt: 'The AI video tool adds keyframe controls for creators.',
    });
    expect(r.relevant).toBe(true);
  });

  it('accepts general model news from AI-focused sources (v2.8.3)', () => {
    const r = scoreRelevance({
      title: 'Anthropic releases Claude with a 1M-token context window',
      excerpt: 'The new model targets long-document work and scripting workflows.',
    });
    expect(r.relevant).toBe(true);
  });

  it('still rejects off-topic AI-adjacent business news', () => {
    const r = scoreRelevance({
      title: "China is Tesla's cash cow",
      excerpt: 'Tesla earnings depend heavily on Shanghai production.',
    });
    expect(r.relevant).toBe(false);
  });

  it('accepts creator-economy AI stories', () => {
    const r = scoreRelevance({
      title: 'YouTube expands AI dubbing to more creators',
      excerpt: 'Automatic multi-language audio tracks roll out to channels.',
    });
    expect(r.relevant).toBe(true);
  });

  it('accepts a voice-cloning launch story', () => {
    const r = scoreRelevance({
      title: 'ElevenLabs launches conversational voice agents',
      excerpt: 'The voice AI company adds real-time speech models.',
    });
    expect(r.relevant).toBe(true);
  });

  it('filterRelevant keeps only passing items', () => {
    const items = [
      { title: 'Sora adds storyboard tools for video generation' },
      { title: 'Cybertruck recall expands again' },
      { title: 'New AI captions tool transcribes podcasts in 40 languages' },
    ];
    const kept = filterRelevant(items);
    const titles = kept.map((i) => i.title);
    expect(titles).toContain('Sora adds storyboard tools for video generation');
    expect(titles).toContain('New AI captions tool transcribes podcasts in 40 languages');
    expect(titles.some((t) => t.includes('Cybertruck'))).toBe(false);
  });
});

describe('curated archive integrity (v3)', () => {
  it('CURATED_NEWS is empty — fabricated sample stories were removed', async () => {
    // v3 (2026-08-08): the hand-written "sample" news stories were removed
    // entirely. /news shows ONLY real, sourced RSS items (with optional free
    // AI summaries). An empty array here is the honest, intended state.
    const { CURATED_NEWS } = await import('@/data/news');
    expect(CURATED_NEWS).toEqual([]);
  });
});
