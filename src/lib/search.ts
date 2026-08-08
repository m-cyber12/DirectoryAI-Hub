// Advanced client-side search engine: weighted fields, fuzzy matching,
// synonym expansion, and natural-language filter extraction ("free voice cloning").
import { ALL_TOOLS, Tool, ToolCategory } from '@/data/tools';

const SYNONYMS: Record<string, string[]> = {
  subtitle: ['caption', 'subtitles', 'captions', 'srt'],
  caption: ['subtitle', 'captions', 'subtitles'],
  tts: ['text to speech', 'voice', 'voiceover'],
  voiceover: ['tts', 'voice', 'narration'],
  clone: ['cloning', 'voice clone'],
  short: ['shorts', 'tiktok', 'reels', 'vertical'],
  shorts: ['short', 'tiktok', 'reels', 'clips', 'clipping'],
  thumbnail: ['thumbnails', 'ctr', 'cover'],
  music: ['song', 'soundtrack', 'audio'],
  dub: ['dubbing', 'translate', 'translation', 'localization'],
  transcribe: ['transcription', 'transcript', 'speech to text'],
  avatar: ['avatars', 'talking head', 'digital human'],
  upscale: ['upscaling', 'enhance', '4k', '8k'],
  edit: ['editor', 'editing'],
  b_roll: ['b-roll', 'broll', 'stock'],
};

function norm(s: string) {
  return s.toLowerCase().normalize('NFKD').replace(/[^\w\s+-]/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Levenshtein distance capped at 2 for typo tolerance. */
function fuzzyIncludes(hay: string, needle: string): boolean {
  if (hay.includes(needle)) return true;
  if (needle.length < 4) return false;
  for (const word of hay.split(' ')) {
    if (Math.abs(word.length - needle.length) > 2) continue;
    let prev = Array.from({ length: needle.length + 1 }, (_, i) => i);
    for (let i = 1; i <= word.length; i++) {
      const cur = [i];
      for (let j = 1; j <= needle.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (word[i - 1] === needle[j - 1] ? 0 : 1));
      }
      prev = cur;
    }
    if (prev[needle.length] <= (needle.length > 6 ? 2 : 1)) return true;
  }
  return false;
}

export interface SearchFilters {
  pricing?: string;
  category?: ToolCategory;
}

/** Pull structured filters out of a natural-language query. */
export function extractFilters(query: string): { cleaned: string; filters: SearchFilters } {
  let q = norm(query);
  const filters: SearchFilters = {};
  if (/\bfree\b/.test(q) && !/\bfree trial\b/.test(q)) {
    filters.pricing = 'Free';
    q = q.replace(/\bfor free\b|\bfree\b/g, ' ');
  }
  if (/\bfreemium\b/.test(q)) { filters.pricing = 'Freemium'; q = q.replace(/\bfreemium\b/g, ' '); }
  if (/\bpaid\b/.test(q)) { filters.pricing = 'Paid'; q = q.replace(/\bpaid\b/g, ' '); }
  return { cleaned: q.replace(/\s+/g, ' ').trim(), filters };
}

export function searchToolsAdvanced(query: string, tools: Tool[] = ALL_TOOLS, limit = 50): Tool[] {
  const { cleaned, filters } = extractFilters(query);
  let pool = tools;
  if (filters.pricing) pool = pool.filter((t) => filters.pricing === 'Free' ? (t.pricing === 'Free' || t.pricing === 'Freemium') : t.pricing === filters.pricing);
  if (!cleaned) return pool.slice(0, limit);

  const terms = cleaned.split(' ').filter((w) => w.length > 1);
  const expanded = new Set(terms);
  for (const t of terms) (SYNONYMS[t] || []).forEach((s) => expanded.add(s));

  const scored = pool
    .map((tool) => {
      const name = norm(tool.name);
      const tagline = norm(tool.tagline);
      const desc = norm(tool.description);
      const tags = norm(tool.tags.join(' '));
      const cat = norm(tool.category);
      let score = 0;
      // full-phrase boosts
      if (name === cleaned) score += 200;
      else if (name.includes(cleaned)) score += 100;
      if (tagline.includes(cleaned)) score += 45;
      for (const term of expanded) {
        const isSyn = !terms.includes(term);
        const w = isSyn ? 0.5 : 1;
        if (name.includes(term)) score += 40 * w;
        else if (fuzzyIncludes(name, term)) score += 18 * w;
        if (tags.includes(term)) score += 22 * w;
        if (cat.includes(term)) score += 18 * w;
        if (tagline.includes(term)) score += 14 * w;
        if (desc.includes(term)) score += 8 * w;
        else if (fuzzyIncludes(desc, term)) score += 3 * w;
      }
      // quality nudges — honest, verifiable signals only (audit fix 2.4).
      // Fabricated `rating` is no longer a ranking input; verification level
      // and an explicit editorial flag are.
      if (tool.verificationLevel === 'hands-on-tested') score += 4;
      else if (tool.verificationLevel === 'pricing-verified') score += 2;
      if (tool.isFeatured) score += 3;
      return { tool, score };
    })
    .filter((r) => r.score > 12)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((r) => r.tool);
}

export const SEARCH_SUGGESTIONS = [
  'caption generator for Shorts',
  'free voice cloning',
  'text to video',
  'AI thumbnail maker',
  'podcast editing',
  'video translation dubbing',
  'faceless YouTube',
  'AI music for videos',
  'motion capture',
  'YouTube SEO',
];
