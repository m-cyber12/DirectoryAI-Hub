/**
 * News relevance gate (critique §7 — "topical authority dilution").
 *
 * The previous ingester blindly aggregated general-tech feeds, so the /news
 * page of an *AI video tools* directory showed Tesla earnings, Pixel launches
 * and political stories. That confuses readers and dilutes topical authority
 * in Google's eyes.
 *
 * Every item — live RSS, Supabase snapshot or curated fallback — now has to
 * score above a threshold before it is allowed on the page. The scoring is
 * deliberately strict and explainable:
 *
 *   creator hits (video/audio/creation-specific AI terms)   ×3
 *   general AI hits (model/company terms)                   ×1
 *   hard blocklist hits (politics, sports, crime…)          → instant reject
 *
 * An item needs score ≥ 3, i.e. at least ONE creator-specific term, or a very
 * dense cluster of general AI terms. Pure function → unit-tested in
 * tests/newsRelevance.test.ts.
 */

export interface RelevanceInput {
  title: string;
  excerpt?: string;
  content?: string;
}

export interface RelevanceResult {
  relevant: boolean;
  score: number;
  matched: string[];
  blockedBy: string | null;
}

/** Terms that mean "this matters to a video/audio creator". */
const CREATOR_TERMS: string[] = [
  // video generation & editing
  'video generation', 'text-to-video', 'text to video', 'image-to-video', 'image to video',
  'video model', 'video ai', 'ai video', 'generative video', 'video generator',
  'video editing', 'video editor', 'video clip', 'clips', 'shorts', 'reels', 'tiktok',
  'youtube', 'filmmaking', 'film-making', 'cinematic', 'b-roll', 'vfx', 'deepfake',
  // audio & voice
  'voice cloning', 'voice clone', 'text-to-speech', 'text to speech', 'voiceover',
  'voice over', 'dubbing', 'dub', 'audio generation', 'music generation', 'song generation',
  'podcast', 'speech recognition', 'transcription', 'transcribe', 'subtitle', 'caption',
  'captions', 'speech-to-text', 'speech to text', 'whisper',
  // avatars & images used by creators
  'avatar', 'talking head', 'digital human', 'lip sync', 'lip-sync',
  'thumbnail', 'image generation', 'image generator', 'text-to-image', 'text to image',
  // named tools creators use
  'sora', 'runway', 'veo', 'kling', 'pika', 'luma', 'elevenlabs', 'synthesia', 'heygen',
  'descript', 'capcut', 'opusclip', 'midjourney', 'stable diffusion', 'suno', 'udio',
  'openai sora', 'adobe firefly',
  // creator economy
  'content creator', 'content creation', 'creator economy', 'creators',
  'livestream', 'live stream', 'twitch', 'monetization', 'monetisation',
  // named creator-economy tools — news about these is on-topic by definition
  'vidiq', 'tubebuddy', 'n8n', 'faceless', 'whisper', 'submagic', 'munch',
  'klap', 'vizard', 'pictory', 'invideo', 'fliki', 'soundraw', 'aiva',
  'topaz', 'hailuo', 'pixverse', 'kaiber', 'zapier',
];

/** General AI terms — contribute but are not sufficient on their own. */
const AI_TERMS: string[] = [
  'ai', 'a.i.', 'artificial intelligence', 'llm', 'large language model', 'generative',
  'chatbot', 'openai', 'anthropic', 'google deepmind', 'deepmind', 'meta ai', 'mistral',
  'machine learning', 'neural', 'diffusion model', 'foundation model', 'multimodal',
  'gemini', 'gpt', 'claude', 'copilot', 'agi',
];

/** Hard reject — these topics have no place on an AI video tools directory. */
const BLOCK_TERMS: string[] = [
  'election', 'president', 'congress', 'senate', 'senator', 'senators', 'parliament',
  'lawsuit over votes', 'republican', 'democrat', 'trump', 'biden', 'harris', 'minister', 'geopolit',
  'war in', 'ceasefire', 'hostage', 'missile', 'drone strike',
  'stock market', 'earnings', 'share price', 'ipo', 'antitrust ruling',
  'outbreak', 'diarrhea', 'virus death', 'pandemic', 'recall of', 'food safety',
  'nba', 'nfl', 'premier league', 'olympics', 'world cup', 'transfer window',
  'celebrity', 'divorce', 'red carpet',
  'car review', 'electric truck', 'cybertruck',
];

const norm = (s: string) => ` ${s.toLowerCase().replace(/[\u2018\u2019']/g, "'")} `;

function countHits(text: string, terms: string[]): string[] {
  const haystack = norm(text);
  const hits: string[] = [];
  for (const term of terms) {
    // Word-boundary-ish match; multi-word terms match as phrases.
    const re = new RegExp(
      term.length > 3 ? `(^|[^a-z0-9])${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '[\\s-]')}([^a-z0-9]|$)` : `(^|[^a-z0-9])${term}([^a-z0-9]|$)`,
    );
    if (re.test(haystack)) hits.push(term);
  }
  return hits;
}

export function scoreRelevance(item: RelevanceInput): RelevanceResult {
  // Title counts double — headlines decide topical relevance more than body text.
  const titleText = item.title;
  const bodyText = `${item.excerpt ?? ''} ${item.content ?? ''}`.slice(0, 1200);

  const blockedBy =
    countHits(titleText, BLOCK_TERMS)[0] ?? null;
  if (blockedBy) {
    return { relevant: false, score: 0, matched: [], blockedBy };
  }

  const creatorTitle = countHits(titleText, CREATOR_TERMS);
  const creatorBody = countHits(bodyText, CREATOR_TERMS);
  const aiTitle = countHits(titleText, AI_TERMS);
  const aiBody = countHits(bodyText, AI_TERMS);

  const creatorHits = new Set([...creatorTitle, ...creatorBody]);
  const aiHits = new Set([...aiTitle, ...aiBody]);

  // Title hits are worth double. v2.8.3: general-AI headlines from our
  // AI-only sources are on-topic for an AI-creator site (the gate's job is to
  // kill Tesla/politics/sports, not model releases), so AI title terms score 3.
  let score =
    creatorTitle.length * 6 +
    (creatorHits.size - creatorTitle.length) * 3 +
    aiTitle.length * 3 +
    Math.min(aiHits.size - aiTitle.length, 4);

  const matched = [...creatorHits, ...aiHits];
  return { relevant: score >= 6, score, matched, blockedBy: null };
}

/** Convenience: filter a batch, keeping the most relevant first. */
export function filterRelevant<T extends RelevanceInput>(items: T[]): T[] {
  return items
    .map((item) => ({ item, r: scoreRelevance(item) }))
    .filter((x) => x.r.relevant)
    .sort((a, b) => b.r.score - a.r.score)
    .map((x) => x.item);
}
