/**
 * Tool deep dives — critique §5 ("tool descriptions are 1–2 sentences; Google
 * wants 500+ words of useful content") and §11-11 ("Deepen Tool Pages").
 *
 * Ground rules for anything written here:
 *   1. Only stable, checkable facts (what the tool does, who it suits,
 *      pricing model mechanics). No invented benchmarks, no test claims —
 *      those live exclusively in verified-tools.ts.
 *   2. `avoidIf` is mandatory. A page without drawbacks is an ad, not a
 *      directory entry.
 *   3. Written for the flagship tools first — the pages people actually land
 *      on from search. The rest of the catalog keeps its honest short entry
 *      plus the generated FAQ, which already beats a bare spec sheet.
 */

export interface ToolDeepDive {
  /** 2–3 paragraphs of genuinely useful orientation. */
  overview: string[];
  /** Concrete jobs this tool is used for. */
  useCases: string[];
  /** Who gets real value. */
  bestFor: string[];
  /** Who should look elsewhere — mandatory, no exceptions. */
  avoidIf: string[];
  /** How the pricing model behaves in practice (credits, seats, limits). */
  pricingNotes?: string;
  /** Extra FAQ entries merged with the auto-generated ones. */
  faqs?: { q: string; a: string }[];
}

export const TOOL_DEEP_DIVES: Record<string, ToolDeepDive> = {
  opusclip: {
    overview: [
      'OpusClip is a repurposing tool built around one job: feeding it a long video — a podcast, stream VOD, webinar or interview — and getting back short vertical clips with captions, reframing and a "virality" score attached to each. The scoring ranks moments by how similar they are to patterns from high-performing shorts, which makes it a useful sorting aid when one recording yields dozens of candidates.',
      'The workflow is deliberately shallow: paste a link or upload a file, choose clip length and caption style, and review the results. Speaker detection keeps the active talker centred when reframing horizontal footage to 9:16, and captions can be templated to match a channel brand. It runs in the browser, so there is nothing to install, but heavy users should watch the credit model — input minutes, not output clips, drive the cost.',
    ],
    useCases: [
      'Turning weekly podcasts into a steady stream of Shorts, Reels and TikToks',
      'Mining old long-form uploads for clips to repost as new content',
      'Batch-producing captioned vertical clips from livestream VODs',
      'Letting an editor triage the best moments before polishing in a full NLE',
    ],
    bestFor: [
      'Podcasters and interview shows publishing clips weekly',
      'Creators who record long and publish short',
      'Small teams that need volume without a dedicated clip editor',
    ],
    avoidIf: [
      'Your content is heavily edited already and just needs resizing — a plain editor is cheaper',
      'You need frame-accurate manual control over every cut',
      'Accent-heavy or jargon-heavy audio where you cannot tolerate caption cleanup time',
    ],
    pricingNotes:
      'Plans are metered primarily on uploaded (input) minutes. A two-hour podcast consumes the same credits whether you export two clips or twenty, so cost planning should start from how much footage you upload per month, not how many shorts you post.',
    faqs: [
      {
        q: 'Does OpusClip add captions automatically?',
        a: 'Yes. Auto-generated animated captions are part of the core clipping pipeline, with templates for styling. Accuracy depends on the source audio, so plan a quick review pass before publishing.',
      },
      {
        q: 'What does the OpusClip virality score mean?',
        a: 'It is a ranking signal that compares a clip against patterns from high-performing short-form videos. Treat it as a sorting hint for review order, not a prediction — no score can guarantee performance.',
      },
    ],
  },

  runway: {
    overview: [
      'Runway is both a generative video model family (the Gen series) and a browser-based suite of AI editing tools. On the generation side it turns text prompts, images or reference footage into short clips that hold together better than most competitors for cinematic B-roll and stylised inserts. On the editing side it offers inpainting (remove objects from video), green-screen-style background removal, motion tracking and frame interpolation — tools that used to require desktop VFX software.',
      'For creators, its sweet spot is augmentation rather than replacement: generating an establishing shot you could not film, cleaning up a frame, or prototyping a look before a shoot. Generation runs on a credit system and output length per generation is short, so anything longer than a few seconds means stitching multiple generations — budget accordingly.',
    ],
    useCases: [
      'B-roll and establishing shots for videos where footage does not exist',
      'Object removal and cleanup in existing footage',
      'Style exploration and previsualisation before filming',
      'Motion graphics accents and transitions between segments',
    ],
    bestFor: [
      'Creators who want generative footage with professional editing tools in one place',
      'Editors replacing specific VFX tasks (rotoscoping, inpainting) without After Effects',
      'Teams prototyping visual concepts quickly',
    ],
    avoidIf: [
      'You need consistent characters across many shots — coherence still degrades',
      'Your workload is long-form; credits make high-volume generation expensive',
      'You need native audio generated with the video',
    ],
    pricingNotes:
      'Paid tiers are credit-based: generations consume credits and higher-resolution or longer outputs cost more. Occasional users can survive on entry plans; daily generation needs a mid tier or a careful credit budget.',
  },

  descript: {
    overview: [
      'Descript rebuilt video and podcast editing around a transcript: you edit the text and the media follows. Delete a sentence in the transcript and the clip is cut; the same applies to filler words, which it can detect and strip in bulk. Around that core it layers studio-grade audio enhancement, overdub voice cloning for fixing flubbed lines, screen recording and multitrack publishing.',
      'It is strongest for talk-first content — podcasts, interviews, courses, commentary videos — where the edit is mostly "keep the good sentences". It is not a replacement for a timeline NLE when you need precise B-roll choreography, heavy effects or colour work, though recent versions keep adding conventional timeline features.',
    ],
    useCases: [
      'Editing podcasts and talking-head videos by editing text',
      'Removing filler words and dead air in one pass',
      'Fixing a misspoken sentence with Overdub instead of re-recording',
      'Recording screen + camera and producing clips for socials',
    ],
    bestFor: [
      'Podcasters and course creators whose edit is dialogue-driven',
      'Creators who are faster with words than timelines',
      'Teams that want transcripts and clips from one tool',
    ],
    avoidIf: [
      'Your work is effects-heavy or colour-critical — use a proper NLE',
      'You edit mostly music or visual-led content',
      'You need the deepest control over audio mixing',
    ],
    faqs: [
      {
        q: 'Is Descript free to use?',
        a: 'There is a free tier with limited transcription hours and watermarked exports on some features. Regular publishing realistically needs a paid plan.',
      },
      {
        q: 'What is Descript Overdub?',
        a: 'A voice-cloning feature that creates a text-to-speech model of your voice so you can fix small mistakes by typing instead of re-recording. You must verify ownership of the voice being cloned.',
      },
    ],
  },

  elevenlabs: {
    overview: [
      'ElevenLabs is the reference point for synthetic voice: text-to-speech with natural pacing and intonation, instant and professional voice cloning, plus dubbing that carries a speaker\'s voice into other languages. It also ships sound-effect generation and conversational agent tooling, but for creators the core value is narration that does not sound robotic — critical for faceless channels, documentaries and course content.',
      'The pricing model is credit-based on characters generated, and licensing matters: free-tier output historically comes without commercial rights, which makes it unusable on monetised channels. Anyone publishing for income should check the rights on their exact plan before shipping a video.',
    ],
    useCases: [
      'Narration for faceless YouTube channels and explainers',
      'Cloning your own voice to fix takes or produce alternate reads',
      'Dubbing existing videos into additional languages with your voice',
      'Character voices for story-driven content',
    ],
    bestFor: [
      'Faceless channels where voice quality is the production value',
      'Creators expanding into multilingual audiences',
      'Anyone who needs believable narration at volume',
    ],
    avoidIf: [
      'You only need occasional short reads — simpler free TTS may be enough',
      'You cannot budget for the tier that grants commercial rights',
      'Your content needs real-time conversational latency rather than produced narration',
    ],
    pricingNotes:
      'Tiers are metered in characters per month, and the right to use output commercially depends on the plan. Two creators generating the same volume can pay very different amounts depending on whether they need cloning, dubbing or API access — match the tier to the feature, not just the character count.',
  },

  capcut: {
    overview: [
      'CapCut is ByteDance\'s free-to-start editor, available on mobile, desktop and the web, and it has become the default editor for a generation of short-form creators. The AI layer is unusually practical: auto-captions that handle fast speech well, background removal, retouch, text-to-speech and a huge library of trend templates tied directly to what is currently performing on TikTok.',
      'Because it ships from the same company as TikTok, its template and sound ecosystem is a genuine advantage for trend-driven content. The trade-offs: projects live in CapCut\'s ecosystem, export options are more limited than a pro NLE, and features progressively move behind the Pro subscription.',
    ],
    useCases: [
      'Fast mobile-first edits for TikTok, Reels and Shorts',
      'Auto-captioning talking videos with animated styles',
      'Applying trending templates and effects in minutes',
      'Light desktop editing when a full NLE is overkill',
    ],
    bestFor: [
      'Short-form creators optimising for TikTok trends',
      'Creators editing primarily on a phone',
      'Anyone who wants a capable editor at zero cost',
    ],
    avoidIf: [
      'You need pro colour grading, multicam or deep audio mixing',
      'Long-form projects with complex timelines',
      'Workflows that demand full project-file portability',
    ],
  },

  heygen: {
    overview: [
      'HeyGen is an avatar platform: type a script and a photorealistic digital presenter delivers it on camera. Its two headline capabilities are instant avatar creation from a short recording of yourself and video translation that re-voices an existing video into another language while regenerating lip movement. That combination makes it the most creator-facing of the avatar tools — used for faceless presenting, scaled outreach and localisation rather than corporate training alone.',
      'The output is convincing enough for explainers, updates and social talking segments, though viewers can still tell it is synthetic in casual, high-emotion content. Pricing is per-minute of generated video, which gets expensive for long-form output.',
    ],
    useCases: [
      'Presenting scripts on camera without filming yourself',
      'Translating existing videos into other languages with lip-sync',
      'Personalised sales or outreach videos at scale',
      'Consistent "host" segments for faceless channels',
    ],
    bestFor: [
      'Creators localising content into multiple languages',
      'Faceless channels that still want a human-looking presenter',
      'Small teams producing recurring presenter-led segments',
    ],
    avoidIf: [
      'Authenticity and on-camera personality are your brand',
      'You need hour-long generated videos — per-minute costs add up',
      'Your audience is highly sensitive to synthetic presenters',
    ],
  },

  synthesia: {
    overview: [
      'Synthesia is the most established AI-avatar platform, aimed primarily at organisations: training, onboarding, product explainers and internal comms delivered by studio-quality avatars reading a script in 130+ languages. Its editor feels closer to slide software than a video editor, which is exactly the point — non-video people can produce acceptable presenter videos without cameras or studios.',
      'For individual creators it is usually overkill in price and corporate in tone; the avatar style reads as "presentation", which works for educational and B2B content far better than for entertainment. Where it shines is volume localisation: one script becomes dozens of language versions with no re-recording.',
    ],
    useCases: [
      'Corporate training and onboarding videos at scale',
      'Multilingual product explainers from a single script',
      'Internal comms updates without booking a studio',
      'Educational course content with a consistent presenter',
    ],
    bestFor: [
      'Teams and companies producing structured instructional video',
      'Anyone localising presenter content into many languages',
      'Non-editors who need presentable output with zero video skills',
    ],
    avoidIf: [
      'Solo creators on a tight budget — creator-first tools are cheaper',
      'Content where warmth and spontaneity matter more than polish',
      'Entertainment formats where synthetic presenters feel off',
    ],
  },

  submagic: {
    overview: [
      'Submagic specialises in the short-form finishing layer: animated captions in the style popularised by top talking-head creators, plus auto-inserted B-roll, zooms, sound effects and emoji emphasis. You upload a rough talking clip and it comes back styled like a polished short — the tool is essentially an opinionated template engine tuned for retention editing.',
      'It is not an editor in the general sense: there is no timeline to speak of, and control is deliberately limited in exchange for speed. Creators who want the exact look it produces get enormous time savings; creators with a bespoke visual style will feel constrained quickly.',
    ],
    useCases: [
      'Styling talking-head Shorts/Reels with animated captions',
      'Adding auto B-roll, zooms and SFX without manual keyframing',
      'Batch-processing clips after a repurposing tool has cut them',
      'Keeping caption styling consistent across a channel',
    ],
    bestFor: [
      'Talking-head creators chasing the modern captioned-short look',
      'Repurposing pipelines that need a fast finishing pass',
      'Creators who prefer speed over granular control',
    ],
    avoidIf: [
      'You need frame-level control of every animation',
      'Your content is not talking-head centric',
      'You already have a caption workflow you are happy with',
    ],
  },

  veed: {
    overview: [
      'VEED is a browser-based generalist editor: cuts, subtitles, screen recording, eye-contact correction, background removal, translation and one-click resizing for every platform. Its pitch is that the whole social publishing pipeline lives in a tab — no installs, no renders waiting on a desktop, and collaboration by link.',
      'The convenience is real, and so are the limits: heavy projects can feel sluggish in the browser, exports are tied to plan tiers (watermark and resolution limits on lower ones), and credit-based AI features add up. For quick, clean, everyday creator edits it is one of the fastest paths from raw file to posted video.',
    ],
    useCases: [
      'Editing and subtitling videos entirely in the browser',
      'Translating subtitles across languages for wider reach',
      'Resizing one edit for multiple platforms',
      'Recording and cleaning up screen + camera presentations',
    ],
    bestFor: [
      'Creators who edit on shared or low-power machines',
      'Teams that want link-based collaboration without software installs',
      'Anyone prioritising speed of subtitles and resizing over deep control',
    ],
    avoidIf: [
      'Long, effects-heavy projects that need a desktop NLE',
      'Budgets too tight for the tier that removes limits you care about',
      'Editors who demand plugin ecosystems and deep timelines',
    ],
  },

  invideo: {
    overview: [
      'InVideo AI targets the "type a prompt, get a video" workflow: describe the video you want and it drafts the script, picks stock footage, adds a voiceover and subtitles, and hands you an editable result. It is aimed squarely at faceless and marketing content — listicles, explainers, product promos and social clips assembled from stock media.',
      'The strength is velocity and low skill floor; the ceiling is sameness. Stock-driven assembly looks like stock-driven assembly, so channels built purely on it tend to blend together. It works best as a first draft that a human then reshapes, or for formats where template polish is acceptable.',
    ],
    useCases: [
      'Faceless explainer and listicle videos from a text prompt',
      'Marketing promos assembled from stock footage',
      'High-volume social content with minimal editing time',
      'Turning blog posts or scripts into video drafts',
    ],
    bestFor: [
      'Faceless channels producing stock-footage formats',
      'Marketers needing quick promo videos without an editor',
      'Beginners who want a full pipeline from one prompt',
    ],
    avoidIf: [
      'Original footage and a unique look are your differentiator',
      'You dislike stock-footage aesthetics',
      'You need precise editorial control over every shot',
    ],
  },

  sora: {
    overview: [
      'Sora is OpenAI\'s text-to-video model, notable for cinematic framing, coherent physics and clips that hold together longer than most early competitors. Access is bundled with consumer ChatGPT subscriptions rather than sold as a standalone tool, which makes it unusually cheap to try for what it is — and also means capacity limits and queues apply to non-top-tier plans.',
      'Like every current video model, it is strongest on B-roll, mood shots and stylised inserts, and weakest on consistent characters and precise direction. Expect to generate multiple takes per usable clip; the practical cost is time and retries as much as subscription price.',
    ],
    useCases: [
      'Cinematic B-roll and establishing shots from text prompts',
      'Storyboard-style concept exploration for video projects',
      'Stylised inserts where live footage is impossible',
      'Remixing and extending existing clips with generation',
    ],
    bestFor: [
      'Creators already paying for a qualifying ChatGPT plan',
      'Projects needing moody, cinematic generated shots',
      'Experimenters who want frontier video generation cheaply',
    ],
    avoidIf: [
      'You need guaranteed character consistency across shots',
      'Commercial projects where licensing terms must be airtight — read the current policy first',
      'Deadline-critical work that cannot absorb generation retries',
    ],
  },

  midjourney: {
    overview: [
      'Midjourney remains one of the strongest image generators for creator work: thumbnails, key art, backgrounds and concept frames with a distinctive, rich look. It runs through a web interface (originally Discord), supports style references and character consistency tools, and its output quality makes it a staple of thumbnail pipelines.',
      'Text rendering in images has improved but is still unreliable — the common workflow is generating the visual here and adding typography in a design tool. Subscription tiers gate generation speed and concurrent jobs; commercial use is allowed on paid plans within its terms.',
    ],
    useCases: [
      'YouTube thumbnail backgrounds and key art',
      'Concept frames and mood boards before a shoot',
      'Channel art and social graphics with a consistent style',
      'Illustrative B-roll stills for documentaries and essays',
    ],
    bestFor: [
      'Creators who need striking still imagery on demand',
      'Thumbnail workflows pairing generated art with overlaid text',
      'Anyone building a recognisable visual style across uploads',
    ],
    avoidIf: [
      'You need reliable in-image text — composite it in an editor instead',
      'Exact product or brand-element fidelity is required',
      'You refuse subscription-based generation',
    ],
  },
};
