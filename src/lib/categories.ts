import { ALL_TOOLS, CATEGORIES, type ToolCategory, type Tool } from '@/data/tools';

/**
 * Category slug helpers + hand-written editorial intros.
 *
 * Audit fix 3.1 — /category/[slug] pages did not exist at all, despite being
 * a high-intent template ("AI video generation tools"). The audit also warns
 * that a generated page with no unique prose is a doorway page, so every
 * category below carries real editorial copy rather than a template with the
 * name substituted in.
 */

export const categorySlug = (c: string) => c.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const REAL_CATEGORIES = CATEGORIES.filter((c) => c !== 'All') as readonly ToolCategory[];

export function categoryFromSlug(slug: string): ToolCategory | null {
  return REAL_CATEGORIES.find((c) => categorySlug(c) === slug) ?? null;
}

interface CategoryContent {
  /** Two or three sentences of genuine orientation for a newcomer. */
  intro: string;
  /** What actually separates good from bad in this category. */
  whatMatters: string[];
  /** Honest note about the state of the category in 2026. */
  reality: string;
}

export const CATEGORY_CONTENT: Record<string, CategoryContent> = {
  'Video Generation': {
    intro:
      'Text-to-video and image-to-video models generate footage that never existed. In 2026 they are genuinely useful for B-roll, establishing shots and stylised inserts, but still unreliable for anything requiring a consistent character across multiple shots or precise lip-sync to an existing track.',
    whatMatters: [
      'Shot length before the model loses coherence — most degrade noticeably past 8–10 seconds',
      'Whether audio is generated natively or has to be added separately',
      'Commercial licensing of the output, which varies enormously between vendors',
      'Cost per usable second, not cost per generation — expect to discard most attempts',
    ],
    reality:
      'Prompt adherence has improved far faster than temporal consistency. Budget for several generations per shot you actually ship.',
  },
  'Video Editing & VFX': {
    intro:
      'AI features layered onto conventional editors: object removal, rotoscoping, colour matching, upscaling and background replacement. These tools save the most time on the tedious middle of a project rather than the creative start or the final polish.',
    whatMatters: [
      'Whether it integrates with your existing NLE or forces a separate round-trip',
      'Export resolution and codec limits on the plan you can actually afford',
      'How gracefully the AI fails — a bad mask you must fix by hand costs more than doing it manually',
      'Render queue times at peak hours on shared cloud infrastructure',
    ],
    reality:
      'The web-based tools are catching up fast, but anything colour-critical or longer than about twenty minutes still belongs in a desktop editor.',
  },
  'Video Repurposing': {
    intro:
      'Clipping tools take one long recording — a podcast, interview or stream — and cut it into vertical short-form clips with captions and reframing. This is the most mature AI video category and the one with the clearest return on time invested.',
    whatMatters: [
      'Caption accuracy on your accent and vocabulary, which is where most tools quietly fail',
      'Speaker-aware reframing for multi-person recordings',
      'Whether clip selection is genuinely good or just picks evenly spaced segments',
      'Credit systems priced per input minute add up fast on long-form source material',
    ],
    reality:
      'Nearly every tool here promises a "virality score". Treat those as a rough sorting aid, not a prediction.',
  },
  'Faceless Video': {
    intro:
      'End-to-end pipelines for channels where nobody appears on camera: niche research, scripts, AI voices, stock or generated visuals, captions and upload — often with the whole loop automated. It is one of the fastest-growing sub-niches on YouTube, and one of the most saturated with low-effort output.',
    whatMatters: [
      'How much of the pipeline is genuinely automated versus "automated with 40 manual steps"',
      'Voice quality and commercial rights on the plan you actually pay for',
      'Whether the visuals are stock, AI-generated or scraped — the last of these gets channels demonetised',
      'Monthly output limits, which decide your real cost per published video',
    ],
    reality:
      'The tools work; the strategy is the hard part. Channels that win with these tools still need a niche, packaging and consistency — automation multiplies whatever strategy you feed it, good or bad.',
  },
  'Voice & Audio': {
    intro:
      'Text-to-speech, voice cloning, dubbing and audio repair. Synthetic English narration is now close to indistinguishable from a competent human read for most listeners; other languages and emotional range still lag noticeably.',
    whatMatters: [
      'Commercial rights on the free tier — often absent, which makes it useless for monetised channels',
      'Consent and verification requirements for cloning a voice',
      'Pronunciation control for names, jargon and acronyms',
      'Output sample rate, which matters if the audio will be mixed rather than used raw',
    ],
    reality:
      'Voice cloning quality has plateaued near the top; the real differences now are pricing model, language coverage and licensing terms.',
  },
  'Translation & Dubbing': {
    intro:
      'Tools that take an existing video into new languages: machine dubbing with cloned voices, lip-sync regeneration and subtitle localisation. For many channels this is the highest-ROI AI spend — the content already exists, you are only unlocking new audiences.',
    whatMatters: [
      'Whether the original voice is cloned across languages or replaced with a stock voice',
      'Lip-sync quality on close-ups — noticeable mismatches hurt trust more than an accent would',
      'Multi-speaker handling, which separates serious tools from demos',
      'Per-minute pricing at your real volume; dubbing costs scale with runtime, not seats',
    ],
    reality:
      'Machine dubbing is good enough for most creator content but not for dramatic performances. Top channels still have a native speaker spot-check idioms and jokes before publishing.',
  },
  'Music & SFX': {
    intro:
      'Generative music and sound effects for creators who need cleared audio without navigating licensing. Useful for background beds and simple stings; still weak at anything with a specific structural arc.',
    whatMatters: [
      'Whether the licence covers monetised video and survives a platform Content ID claim',
      'Stem separation, so you can duck or remix rather than accept the full mix',
      'Length control and whether loops actually loop cleanly',
      'Whether the licence persists if you cancel your subscription',
    ],
    reality:
      'Read the licence terms carefully. Several tools grant rights that terminate with your subscription, which is a problem for a back catalogue.',
  },
  'AI Avatars': {
    intro:
      'Synthetic presenters that read a script to camera, plus lip-sync translation of existing footage. Strong for corporate explainers and localisation; still recognisable as synthetic to most viewers in casual content.',
    whatMatters: [
      'Whether you can create a custom avatar of yourself and what verification that requires',
      'Language coverage and whether lip-sync is regenerated per language or just dubbed over',
      'Gesture range — static presenters read as artificial very quickly',
      'Per-minute pricing, which makes long videos disproportionately expensive',
    ],
    reality:
      'Audiences are getting better at spotting these. They work best where the viewer expects a formal presentation.',
  },
  'Thumbnails & Design': {
    intro:
      'Image generation and editing aimed at click-through rate: thumbnails, channel art and social graphics. The generative models are excellent at backgrounds and concepts, still poor at legible text.',
    whatMatters: [
      'Text rendering quality, still the weakest point of every image model',
      'Face consistency if you appear in your own thumbnails',
      'Whether it exports at the exact dimensions each platform requires',
      'A/B testing support, which matters more than raw image quality for actual CTR',
    ],
    reality:
      'Generate the background with AI, add the text in a real editor. Nearly every professional does exactly this.',
  },
  'Scripting & Writing': {
    intro:
      'Language models tuned for video: hooks, outlines, full scripts, titles and descriptions. Genuinely useful for structure and overcoming a blank page; the output still needs your voice layered on top.',
    whatMatters: [
      'Whether it works from your existing transcripts rather than generic prompts',
      'Hook variation quality — the first eight seconds decide retention',
      'Platform-aware formatting for description boxes, chapters and pinned comments',
      'How obviously the raw output reads as AI-written to your specific audience',
    ],
    reality:
      'Use these for the skeleton, never the final draft. Audiences detect unedited model output quickly, and it flattens the personality that made the channel work.',
  },
  'AI Agents & Assistants': {
    intro:
      'General-purpose assistants and research agents that sit underneath the whole creator workflow: brainstorming, outlining, fact-checking, summarising sources and automating multi-step tasks. They do not ship video — they make every other step faster.',
    whatMatters: [
      'Context window and file handling, which decide whether it can digest your transcripts and research folders',
      'Citations and web access for anything factual — uncited model output should never reach a script',
      'Whether the paid tier adds real capability (reasoning, agents, integrations) or just volume',
      'Data terms: whether your prompts and uploads are used for training',
    ],
    reality:
      'Capability gaps between the frontier assistants have narrowed; the bigger difference is how disciplined your prompting and fact-checking workflow is around whichever one you pick.',
  },
  'Prompts & Templates': {
    intro:
      'Marketplaces, libraries and extensions of reusable prompts and templates for the generative tools in the rest of this directory. A good prompt library is a shortcut; a bad one is a ceiling on your output.',
    whatMatters: [
      'Whether prompts ship with example outputs you can verify before buying',
      'Model versioning — a great Midjourney v5 prompt can be useless in v7',
      'Licensing of the prompt itself and of anything you produce with it',
      'Refund or quality policies on paid marketplaces',
    ],
    reality:
      'Bought prompts are training wheels, not a moat. Use them to learn the structure of a good prompt, then write your own tuned to your own style.',
  },
  'Transcription & Captions': {
    intro:
      'Speech-to-text, subtitle generation and translation. The most reliable AI category in this directory — accuracy on clear English audio routinely exceeds 95%, and open-source options are competitive with paid ones.',
    whatMatters: [
      'Word error rate on accented speech and technical vocabulary',
      'Speaker diarisation quality for multi-person recordings',
      'Export formats — SRT, VTT and burned-in styling are not interchangeable',
      'Whether translation is machine-only or reviewed, which matters for published subtitles',
    ],
    reality:
      'This is the category where a free, self-hosted option is genuinely competitive with paid services.',
  },
  'SEO & Analytics': {
    intro:
      'Keyword research, competitor analysis, title testing and performance dashboards for video platforms. These surface real data, but the AI recommendation layer on top varies from insightful to superstition.',
    whatMatters: [
      'Whether the data comes from official platform APIs or is estimated',
      'How estimates are calculated, and whether the vendor is transparent about it',
      'Whether A/B testing is real or just sequential comparison',
      'Historical depth, which decides whether trend analysis means anything',
    ],
    reality:
      'Treat search-volume estimates as directional. No third party has access to the actual ranking signals.',
  },
  Automation: {
    intro:
      'Workflow tools that connect the rest of your stack: publishing, cross-posting, file handling and multi-step pipelines. The highest-leverage category once your process is stable, and a waste of time before that.',
    whatMatters: [
      'Which platforms have genuine API access versus fragile browser automation',
      'Error handling when a step fails mid-pipeline',
      'Whether you can self-host, which matters for cost and for privacy',
      'Task or operation pricing, which scales badly with volume',
    ],
    reality:
      'Automate a workflow only after you have run it manually enough times to know it will not change next month.',
  },
  'Live & Streaming': {
    intro:
      'Real-time tools for live production: instant clipping, live captions, stream monitoring and automated highlight detection. Latency constraints mean quality here trails the offline equivalents.',
    whatMatters: [
      'End-to-end latency, which decides whether captions are usable live',
      'Whether highlights are detected in real time or only after the stream ends',
      'Local resource usage — anything running on your encoding machine costs you frames',
      'Platform coverage across Twitch, YouTube and Kick',
    ],
    reality:
      'Run anything AI-powered on a second machine if you can. Sharing a GPU with your encoder is how streams drop frames.',
  },
  '3D & Motion': {
    intro:
      'Motion capture, 3D asset generation, camera tracking and procedural animation. The least mature category here, but improving fastest, and the output is genuinely hard to produce by any other means.',
    whatMatters: [
      'Whether generated meshes are actually clean enough to use, or need full retopology',
      'Markerless motion capture accuracy on fast movement and occlusion',
      'Export compatibility with Blender, Unreal and your existing pipeline',
      'Whether rigging is included or left as an exercise for you',
    ],
    reality:
      'Expect to treat AI output as a starting point rather than a finished asset. The time saved is in blocking, not in polish.',
  },
};

export function getCategoryTools(category: ToolCategory): Tool[] {
  return ALL_TOOLS.filter((t) => t.category === category);
}
