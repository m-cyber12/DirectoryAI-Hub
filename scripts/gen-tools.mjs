// Generates src/data/tools-extended.ts from a compact curated seed list.
// Run: node scripts/gen-tools.mjs
import { writeFileSync } from 'fs';

const CAT = {
  VG: 'Video Generation', VE: 'Video Editing & VFX', VR: 'Video Repurposing',
  FC: 'Faceless Video', VA: 'Voice & Audio', DB: 'Translation & Dubbing',
  MU: 'Music & SFX', AV: 'AI Avatars',
  TD: 'Thumbnails & Design', SW: 'Scripting & Writing', AG: 'AI Agents & Assistants',
  PT: 'Prompts & Templates', TC: 'Transcription & Captions',
  SA: 'SEO & Analytics', AU: 'Automation', LS: 'Live & Streaming', TM: '3D & Motion',
};
const PRICE = { F: 'Free', FM: 'Freemium', P: 'Paid', FT: 'Free Trial' };


// [name, domain, cat, pricing, price, tagline, description, tags, rating, metric, flags, launch]
// flags: F=featured T=trending N=new E=editorsChoice
const ROWS = [
// ===== Video Generation =====
['Sora','sora.com','VG','P','$20/mo','OpenAI text-to-video model','Generate cinematic, physics-aware video clips up to 20 seconds from plain text prompts, with storyboard and remix tools built in.',['Text to Video','Cinematic','Storyboard','OpenAI'],4.8,'1080p Generations','FTE','2024-12-09'],
['Google Veo','deepmind.google','VG','P','$19.99/mo','Google DeepMind video generation','State-of-the-art text-to-video with native audio generation, strong prompt adherence, and 4K-quality cinematic output inside Gemini and Flow.',['Text to Video','Native Audio','4K','Google'],4.8,'Native Audio Gen','FT','2024-05-14'],
['Pika','pika.art','VG','FM','$10/mo','Idea-to-video creative studio','Playful AI video generator with scene ingredients, Pikaffects and video-to-video editing loved by short-form creators.',['Text to Video','Effects','Video to Video','Shorts'],4.6,'Viral Pikaffects','T','2023-11-28'],
['Luma Dream Machine','lumalabs.ai','VG','FM','$9.99/mo','High-quality AI video from text & images','Fast, high-fidelity video generation with smooth motion, keyframes, and camera control from Luma Labs.',['Image to Video','Camera Control','Keyframes','Realism'],4.7,'Ray Model Engine','F','2024-06-12'],
['Kling AI','klingai.com','VG','FM','$6.99/mo','Realistic physics video generation','Kuaishou video model known for realistic human motion, lip-sync, and 1080p clips up to 2 minutes.',['Realistic Motion','Lip Sync','1080p','Long Clips'],4.7,'2-Min Generations','T','2024-06-06'],
['Hailuo AI','hailuoai.video','VG','FM','$9.99/mo','MiniMax cinematic video model','Strong prompt-following text and image-to-video generation with expressive character animation and camera direction.',['Text to Video','Character Motion','Camera Direction','MiniMax'],4.5,'Director Controls','','2024-09-01'],
['Haiper','haiper.ai','VG','FM','$10/mo','Creative AI video toolkit','Text-to-video and keyframe conditioning tools with a focus on stylized, artistic motion for social content.',['Stylized Video','Keyframes','Social Content','Art'],4.3,'Perceptual Engine','','2024-03-05'],
['Vidu','vidu.com','VG','FM','$8/mo','Multi-subject consistent AI video','Chinese video model with reference-to-video for consistent characters across shots — great for story-driven shorts.',['Character Consistency','Reference to Video','Anime','Story'],4.4,'Multi-Ref Consistency','','2024-07-30'],
['PixVerse','pixverse.ai','VG','FM','$10/mo','Anime & stylized video generation','Popular for anime-style effects and templates that go viral on TikTok, with fast generation speed.',['Anime','Templates','TikTok Effects','Fast'],4.3,'Viral Templates','','2024-01-15'],
['LTX Studio','ltx.studio','VG','FM','$15/mo','AI filmmaking & storyboarding platform','Holistic story-to-screen platform: script, storyboard, consistent characters, shot editing, and final render in one place.',['Filmmaking','Storyboard','Consistent Characters','Pitch Decks'],4.5,'Script to Screen','F','2024-02-27'],
['Kaiber','kaiber.ai','VG','P','$5/mo','Artistic video generation studio','Superstudio canvas for music videos, audio-reactive visuals, and stylized animation used by musicians and artists.',['Music Videos','Audio Reactive','Animation','Art'],4.3,'Audio Reactive','','2022-11-01'],
['Krea AI','krea.ai','VG','FM','$10/mo','Real-time AI creative suite','Real-time image generation, upscaling, and video tools with an intuitive canvas — a favorite for rapid visual ideation.',['Real-time','Upscaling','Canvas','Ideation'],4.6,'Realtime Canvas','T','2023-10-10'],
['Genmo','genmo.ai','VG','FM','$10/mo','Open-source Mochi video model','Creators of Mochi 1, an open state-of-the-art video generation model with strong motion quality and prompt adherence.',['Open Source','Mochi','Motion Quality','Research'],4.2,'Open Weights','','2024-10-22'],
['Higgsfield','higgsfield.ai','VG','FM','$9/mo','Cinematic camera-control AI video','Social-first video model famous for dramatic camera moves — crash zooms, bullet time, and body cam presets.',['Camera Moves','Bullet Time','Presets','Social'],4.5,'50+ Camera Presets','TN','2024-04-01'],
['Moonvalley','moonvalley.ai','VG','P','$14.99/mo','Licensed-data cinematic video model','Marey model trained exclusively on licensed footage — commercially safe HD video generation for professional filmmakers.',['Commercially Safe','Licensed Data','Filmmakers','HD'],4.4,'Clean Training Data','N','2025-07-08'],
['Neural Frames','neuralframes.com','VG','P','$19/mo','AI music video animator','Frame-by-frame AI animation synced to audio stems — the go-to tool for trippy, audio-reactive music videos.',['Music Videos','Audio Sync','Animation','Stems'],4.3,'Stem-Synced Motion','','2023-03-01'],
['Fliki','fliki.ai','FC','FM','$28/mo','Text to video with lifelike voiceovers','Turn scripts, blogs, or tweets into videos with 2,500+ AI voices in 80 languages, stock media, and subtitles.',['Text to Video','2500+ Voices','Blog to Video','Subtitles'],4.5,'80+ Languages','','2021-12-01'],
['Lumen5','lumen5.com','VG','FM','$19/mo','Blog-to-video for brands','Repurpose blog posts and Zoom recordings into branded social videos with an easy drag-and-drop workflow.',['Blog to Video','Branded Content','Drag & Drop','Marketing'],4.4,'Brand Templates','','2017-01-01'],
['Steve.ai','steve.ai','VG','FM','$15/mo','Animated & live-action AI videos','Generate animation and live-action style videos from scripts with characters, voiceovers, and templates.',['Animation','Explainers','Characters','Templates'],4.2,'Animation Engine','','2021-06-01'],
['Viggle','viggle.ai','VG','FM','$9.99/mo','Controllable character motion','Mix any character image with motion videos — the meme-famous JST-1 model that animates characters with real physics.',['Character Animation','Memes','Motion Mix','Physics'],4.3,'Motion Transfer','T','2024-03-01'],
['Domo AI','domoai.app','VG','P','$9.99/mo','Video style transfer & animation','Restyle real footage into anime, 3D cartoon, or pixel art with Discord-based video-to-video generation.',['Style Transfer','Anime','Video to Video','Discord'],4.2,'20+ Styles','','2023-08-01'],
['Pollo AI','pollo.ai','VG','FM','$10/mo','All-in-one AI video hub','Access Kling, Runway, Veo, Hailuo, and more models from one interface with templates and effects.',['Multi-Model','Templates','Effects','Aggregator'],4.3,'All Models In One','N','2024-10-01'],
['GoEnhance','goenhance.ai','VG','FM','$11.9/mo','Video-to-video style & enhance','Transform videos into anime and cartoon styles, upscale to 4K, and interpolate frames for smooth motion.',['Video to Anime','Upscale','Frame Interpolation','4K'],4.2,'4K Enhancement','','2024-01-01'],
['Stable Video Diffusion','stability.ai','VG','F','','Open-source image-to-video','Stability AI\'s open video model for image-to-video generation — free to run locally and fine-tune for research.',['Open Source','Image to Video','Local','Research'],4.1,'Open Weights','','2023-11-21'],
['Hunyuan Video','hunyuan.tencent.com','VG','F','','Tencent open-source video model','13B-parameter open video foundation model with cinematic quality rivaling closed models — free for developers.',['Open Source','13B Params','Cinematic','Developers'],4.3,'Open Foundation','','2024-12-03'],
['Wan','wan.video','VG','F','','Alibaba open video generation','Alibaba\'s Wan 2.x open-source model family — strong text rendering and motion, runnable on consumer GPUs.',['Open Source','Consumer GPU','Text Rendering','Alibaba'],4.3,'Runs on 8GB VRAM','N','2025-02-26'],
['Seedance','seed.bytedance.com','VG','P','$9/mo','ByteDance pro video model','Top-benchmarked text and image-to-video model with multi-shot storytelling and precise camera control.',['Multi-Shot','Camera Control','Benchmarks','ByteDance'],4.5,'#1 Arena Ranked','N','2025-06-11'],
['Hedra','hedra.com','VG','FM','$10/mo','Expressive character video','Character-3 model generates talking, singing, emoting characters from a single image and audio track.',['Talking Characters','Singing','Image + Audio','Expressive'],4.4,'Character-3 Model','N','2024-06-01'],
['Immersity AI','immersity.ai','VG','FM','$7.99/mo','2D to 3D depth animation','Convert photos and videos into immersive 3D motion with depth-aware parallax animation.',['2D to 3D','Parallax','Depth Maps','Immersive'],4.1,'Depth Animation','','2023-05-01'],
// ===== Video Editing & VFX =====
['Topaz Video AI','topazlabs.com','VE','P','$299 one-time','Professional AI video upscaling','Industry-standard AI upscaling to 8K, denoising, deinterlacing, and frame interpolation up to 120fps for archival and pro footage.',['Upscaling','8K','Frame Interpolation','Denoise'],4.7,'8K Upscale','F','2020-01-01'],
['Captions','captions.ai','VE','FM','$9.99/mo','AI-powered talking video studio','Record, caption, dub, and edit talking videos with AI eye contact correction, avatars, and one-tap edits.',['Captions','Eye Contact','Dubbing','Mobile'],4.6,'AI Eye Contact','T','2021-09-01'],
['Kapwing','kapwing.com','VE','FM','$16/mo','Collaborative online video editor','Browser-based editor with AI smart cut, auto subtitles, background removal, and team workspaces.',['Browser Editor','Smart Cut','Subtitles','Teams'],4.5,'Team Workspaces','','2017-09-01'],
['FlexClip','flexclip.com','VE','FM','$9.99/mo','Easy online video maker','Template-driven video creation with AI text-to-video, auto subtitles, and a huge stock library for quick marketing videos.',['Templates','Stock Library','Text to Video','Marketing'],4.3,'4M+ Stock Assets','','2019-01-01'],
['Gling','gling.ai','VE','P','$15/mo','AI rough-cut editor for YouTubers','Automatically cuts silences, bad takes, and filler words from talking-head videos, then exports to Premiere, Resolve, or FCP.',['Rough Cut','Silence Removal','Bad Takes','Export XML'],4.6,'Auto Rough Cut','FN','2022-06-01'],
['TimeBolt','timebolt.io','VE','P','$17/mo','Instant silence & pause removal','Removes pauses and dead air from video and podcasts in seconds, with punch-in zooms and export to editors.',['Silence Removal','Jump Cuts','Podcasts','Speed'],4.4,'10x Faster Cuts','','2020-04-01'],
['AutoPod','autopod.fm','VE','P','$29/mo','Multi-cam podcast editing in Premiere','Premiere Pro extension that auto-edits multi-camera podcast and video shows — cuts cameras based on who is speaking.',['Multi-Cam','Premiere Pro','Podcasts','Auto Edit'],4.6,'Multi-Cam Auto Cut','','2022-03-01'],
['Wisecut','wisecut.video','VE','FM','$15/mo','Auto video editing with music','AI editor that removes silences, adds background music with auto-ducking, subtitles, and smart punch-ins.',['Auto Editing','Music Ducking','Subtitles','Punch-In'],4.2,'Music Auto-Duck','','2020-09-01'],
['PowerDirector','cyberlink.com','VE','FM','$69.99/yr','AI-enhanced desktop video editor','Full-featured editor with AI sky replacement, object detection, body effects, and speech enhancement for prosumers.',['Desktop Editor','Sky Replacement','Object Detection','Effects'],4.4,'AI Object Tools','','2001-01-01'],
['Unscreen','unscreen.com','VE','FM','$9/video','Video background removal','Remove video backgrounds automatically without green screen — perfect for reaction overlays and product demos.',['Background Removal','No Green Screen','Overlays','GIFs'],4.3,'Zero Green Screen','','2020-03-01'],
['Cutout.Pro','cutout.pro','VE','FM','$5/mo','AI visual enhancement toolkit','One-stop toolkit for video background removal, photo enhancement, colorization, and passport photos via API.',['Background Removal','Enhancement','Colorize','API'],4.2,'Full API Suite','','2018-01-01'],
// ===== Video Repurposing =====
['Vizard','vizard.ai','VR','FM','$16/mo','AI clipping with virality scores','Turn long videos into shorts with per-clip virality scores, auto captions, and social scheduling built in.',['AI Clipping','Virality Score','Scheduling','Captions'],4.6,'1-Click 10 Clips','T','2021-11-01'],
['2short.ai','2short.ai','VR','FM','$9.90/mo','YouTube to Shorts converter','Extracts the most engaging moments from YouTube videos and converts them into vertical shorts with captions.',['YouTube','Shorts','Auto Captions','Vertical Crop'],4.3,'YouTube Native','','2022-12-01'],
['Spikes Studio','spikes.studio','VR','FM','$12/mo','Gaming & stream clipping AI','Built for streamers: finds viral-worthy moments in Twitch VODs and gameplay, adds captions and emojis automatically.',['Twitch','Gaming','Stream Clips','Emojis'],4.3,'Twitch Integrated','','2022-08-01'],
['Chopcast','chopcast.io','VR','P','$29/mo','Repurpose webinars into clips','B2B-focused repurposing that turns webinars and long-form content into branded micro-videos for LinkedIn.',['Webinars','B2B','LinkedIn','Micro Video'],4.1,'B2B Focused','','2020-06-01'],
['Eklipse','eklipse.gg','VR','FM','$14.99/mo','AI gaming highlights','Automatically captures kill streaks and hype moments from Twitch, Kick, and YouTube streams into TikTok-ready clips.',['Gaming','Highlights','Twitch','Kick'],4.4,'Auto Highlight Detect','','2021-03-01'],
['Powder','powder.gg','VR','P','$15.99/mo','Gaming montage AI for creators','Desktop AI that detects your best gameplay moments locally and builds montages with your facecam reactions.',['Gaming','Montages','Local AI','Facecam'],4.3,'Local Processing','','2022-01-01'],
['Revid.ai','revid.ai','FC','P','$39/mo','Faceless viral video generator','Create faceless TikToks from a prompt — script, AI voice, captions, and stock or AI visuals in one click.',['Faceless','TikTok','One Click','AI Voice'],4.2,'Prompt to TikTok','N','2023-11-01'],
['Crayo','crayo.ai','FC','P','$19/mo','Clip farming at scale','Generate story-style shorts with gameplay backgrounds, AI voices, and captions — built for clip channels.',['Clip Farming','Gameplay BG','Story Shorts','Scale'],4.1,'Bulk Generation','','2023-10-01'],
['Zebracat','zebracat.ai','FC','FM','$19.5/mo','Text to viral marketing videos','Turn text prompts and blog posts into short marketing videos with AI scenes, voices, and music.',['Marketing','Text to Video','AI Scenes','Ads'],4.2,'Ad-Ready Output','N','2023-06-01'],
['Syllaby','syllaby.io','FC','P','$49/mo','Faceless content strategy engine','Plan, script, generate, and schedule faceless video content across platforms with AI topic research.',['Content Strategy','Faceless','Scheduling','Topic Research'],4.2,'Full Pipeline','','2023-02-01'],
['Headliner','headliner.app','VR','FM','$12.95/mo','Podcast to video audiograms','Turn podcast episodes into shareable audiogram videos with waveforms, captions, and full transcripts.',['Audiograms','Podcasts','Waveforms','Captions'],4.4,'Podcast Native','','2017-10-01'],
['Recast Studio','recast.studio','VR','P','$29/mo','Podcast marketing on autopilot','Turns podcast episodes into clips, show notes, blog posts, and social captions automatically.',['Podcasts','Show Notes','Clips','Social Copy'],4.2,'Episode to Assets','','2020-01-01'],
// ===== Voice & Audio =====
['Rask AI','rask.ai','DB','P','$60/mo','Video translation & dubbing','Localize videos into 130+ languages with voice cloning, lip-sync, and multi-speaker detection — used by top educational channels.',['Dubbing','130+ Languages','Lip Sync','Localization'],4.7,'130+ Languages','F','2022-10-01'],
['Papercup','papercup.com','DB','P','Custom','Human-in-the-loop AI dubbing','Enterprise AI dubbing with professional translator review — powers localization for Bloomberg and Fremantle.',['Enterprise','Dubbing','QA Review','Broadcast'],4.4,'Broadcast Grade','','2017-01-01'],
['Dubverse','dubverse.ai','DB','FM','$15/mo','Instant online video dubbing','Dub videos into 60+ languages with lifelike voices, subtitle generation, and a collaborative editor.',['Dubbing','60+ Languages','Subtitles','Collaboration'],4.3,'Instant Dubs','','2021-08-01'],
['Speechify','speechify.com','VA','FM','$139/yr','Text to speech everywhere','Listen to any text — docs, PDFs, web pages — with celebrity AI voices across mobile, desktop, and browser.',['Text to Speech','Celebrity Voices','Accessibility','Cross-Platform'],4.4,'900+ Voices','','2017-01-01'],
['WellSaid Labs','wellsaidlabs.com','VA','P','$49/mo','Enterprise AI voiceover','Studio-quality synthetic voices with commercial licensing, pronunciation controls, and team libraries for L&D and ads.',['Enterprise','Commercial License','Pronunciation','Teams'],4.5,'Studio Quality','','2018-01-01'],
['Podcastle','podcastle.ai','VA','FM','$11.99/mo','AI podcast recording studio','Record studio-quality remote interviews, enhance audio with Magic Dust, clone your voice, and edit text-based.',['Podcasts','Remote Recording','Voice Clone','Text Editing'],4.5,'Magic Dust Enhance','','2020-09-01'],
['Riverside','riverside.fm','VA','FM','$15/mo','Studio-quality remote recording','4K remote recording with local tracks, AI transcription in 100+ languages, Magic Clips, and text-based editing.',['Remote Recording','4K','Magic Clips','Transcription'],4.7,'Local 4K Tracks','F','2019-01-01'],
['LALAL.AI','lalal.ai','VA','P','$20/pack','AI stem splitter','Extract vocals, drums, bass, and instruments from any track with the Phoenix neural network — used by DJs and editors.',['Stem Splitting','Vocal Removal','Instrumental','DJs'],4.6,'10-Stem Split','','2020-06-01'],
['Voicemod','voicemod.net','VA','FM','$45/yr','Real-time AI voice changer','Live voice changing and soundboard for streamers and gamers with AI voices and custom voice creation.',['Voice Changer','Real-time','Streaming','Soundboard'],4.3,'Real-Time FX','','2014-01-01'],
['Fish Audio','fish.audio','VA','FM','$9.99/mo','Open voice cloning platform','Top-ranked open-source TTS with instant voice cloning in seconds and a huge community voice library.',['Voice Cloning','Open Source','TTS Arena','Community'],4.4,'#1 Open TTS','N','2024-05-01'],
['Cartesia','cartesia.ai','VA','FM','$5/mo','Ultra-low-latency realistic TTS','Sonic model delivers 40ms-latency lifelike speech for real-time agents, gaming, and interactive video.',['Low Latency','Real-time','Agents','API'],4.5,'40ms Latency','N','2024-05-29'],
['Kits AI','kits.ai','VA','FM','$9.99/mo','AI voices for musicians','Train and share AI voice models for music, convert vocals artist-to-artist, and generate royalty-free vocals.',['Music Vocals','Voice Models','Royalty-Free','Artists'],4.3,'Artist Voice Bank','','2023-01-01'],
['Moises','moises.ai','VA','FM','$5.99/mo','AI music practice & stems','Separate any song into stems, change pitch and speed, detect chords — essential for musician-creators.',['Stems','Pitch Shift','Chord Detection','Practice'],4.6,'Real-time Stems','','2019-11-01'],
['Camb.ai','camb.ai','DB','P','$25/mo','Speech translation in 140+ languages','MARS and BOLI models dub live sports and film into 140+ languages with emotion preservation.',['Dubbing','140+ Languages','Live Sports','Emotion'],4.3,'Live Dubbing','N','2023-01-01'],
['Deepdub','deepdub.ai','DB','P','','Studio-grade AI dubbing','Enterprise dubbing platform that localizes films and series with AI voices plus studio-style quality review, built for streamers and distributors.',['Dubbing','Enterprise','Streaming','QA'],4.3,'Streamer Grade','','2019-01-01'],
['Vozo AI','vozo.ai','DB','P','$16/mo','AI video translator & lip sync','Translate, redub, and lip-sync videos with multi-speaker detection and script editing.',['Translation','Lip Sync','Multi-Speaker','Redub'],4.2,'Pro Lip Sync','','2023-05-01'],
// ===== Music & SFX =====
['Suno','suno.com','MU','FM','$10/mo','Generate full songs from text','Create complete songs with vocals, lyrics, and instrumentals from a text prompt — the most popular AI music tool.',['Song Generation','Vocals','Lyrics','Text to Music'],4.7,'Full Songs in 60s','FT','2023-07-01'],
['Udio','udio.com','MU','FM','$10/mo','Studio-grade AI music creation','High-fidelity AI music generation with fine-grained control, remixing, and inpainting for serious producers.',['Music Generation','Remixing','Inpainting','Hi-Fi'],4.6,'Studio Fidelity','T','2024-04-10'],
['Soundraw','soundraw.io','MU','P','$16.99/mo','Royalty-free AI music for videos','Generate unlimited royalty-free tracks by mood, genre, and length — customize energy per section for perfect edits.',['Royalty-Free','Mood Based','Customizable','Sync'],4.4,'Unlimited License','','2020-02-01'],
['AIVA','aiva.ai','MU','FM','€15/mo','AI composer for soundtracks','Compose emotional soundtrack music in 250+ styles — from cinematic orchestral to lo-fi — with MIDI export.',['Soundtracks','Orchestral','MIDI Export','250+ Styles'],4.4,'MIDI Export','','2016-02-01'],
['Mubert','mubert.com','MU','FM','$14/mo','Generative music streaming & API','Real-time generative royalty-free music for content, apps, and streams via simple prompts or API.',['Generative','API','Streams','Royalty-Free'],4.2,'Realtime Generation','','2017-01-01'],
['Beatoven.ai','beatoven.ai','MU','P','$6/mo','Mood-based background music','Create customizable, royalty-free background scores that match the emotional arc of your video timeline.',['Background Music','Mood Arc','Royalty-Free','Scoring'],4.2,'Emotion Timeline','','2021-04-01'],
['Soundful','soundful.com','MU','FM','$9.99/mo','AI music for creators & brands','Generate studio-quality royalty-free tracks by genre template, with stems download for customization.',['Templates','Stems','Royalty-Free','Brands'],4.1,'Stems Included','','2021-11-01'],
['Loudly','loudly.com','MU','FM','$5.99/mo','AI music & soundtracks for video','Generate and customize royalty-free music with recommendation engine matched to your video content.',['Royalty-Free','Recommendations','Customization','Video Match'],4.2,'Video-Matched','','2019-01-01'],
['Stable Audio','stableaudio.com','MU','FM','$11.99/mo','Text-to-audio & SFX generation','Generate music tracks and sound effects up to 3 minutes from text with timing control — includes open models.',['Sound Effects','Text to Audio','Open Model','3-Min Tracks'],4.2,'SFX + Music','','2023-09-13'],
['ElevenLabs SFX','elevenlabs.io','MU','FM','$5/mo','AI sound effects generation','Generate cinematic sound effects, foley, and ambient audio from text descriptions — perfect for shorts and film.',['Sound Effects','Foley','Ambience','Text to SFX'],4.5,'Text to Foley','N','2024-06-01'],
// ===== AI Avatars =====
['DeepBrain AI','deepbrain.io','AV','P','$24/mo','Realistic AI avatar studio','Hyper-realistic AI avatars for news, training, and marketing videos with 100+ stock avatars and custom clones.',['Realistic Avatars','Training Videos','Custom Clone','Stock Avatars'],4.4,'100+ Avatars','','2016-01-01'],
['Vidnoz','vidnoz.com','AV','FM','$22.5/mo','Free AI avatar video generator','Generate avatar videos with 1500+ templates, talking photos, and voice cloning — generous free tier.',['Free Tier','Templates','Talking Photos','Voice Clone'],4.2,'1500+ Templates','','2022-01-01'],
['Yepic AI','yepic.ai','AV','FM','$29/mo','Real-time talking avatars','Live avatar agents with lip-sync in 28 languages for video campaigns, training, and customer support.',['Live Avatars','Agents','28 Languages','Support'],4.1,'Realtime Agents','','2020-01-01'],
['Argil','argil.ai','AV','P','$39/mo','AI clones for content creators','Create your AI clone that films videos for you — body language control, b-rolls, and social-ready editing.',['AI Clone','Body Language','Auto B-Roll','Social'],4.3,'Creator Clones','N','2023-04-01'],
['Tavus','tavus.io','AV','P','$59/mo','Personalized video at scale','Record once, generate thousands of personalized videos with your face and voice — powers real-time conversational video agents.',['Personalization','Sales Videos','Conversational AI','API'],4.4,'1-to-1000 Videos','','2021-01-01'],
['BHuman','bhuman.ai','AV','FM','$39/mo','Personalized video messaging','Clone your face and voice to send personalized videos to thousands of leads and customers.',['Personalization','Outreach','Face Clone','Sales'],4.1,'Bulk Personalization','','2021-06-01'],
['Akool','akool.com','AV','P','$30/mo','Face swap & avatar platform','High-fidelity face swap, talking avatars, and live camera avatars for marketing and entertainment.',['Face Swap','Live Camera','Talking Avatar','Marketing'],4.2,'4K Face Swap','','2022-01-01'],
// ===== Thumbnails & Design =====
['Midjourney','midjourney.com','TD','P','$10/mo','Best-in-class AI image generation','The gold standard for artistic AI imagery — V7 delivers photorealistic characters and consistent styles for thumbnails.',['Image Generation','Photorealism','Style Consistency','V7'],4.8,'Omni Reference','FTE','2022-07-12'],
['Ideogram','ideogram.ai','TD','FM','$8/mo','AI images with perfect text','The best AI image generator for readable text rendering — ideal for thumbnails, posters, and logos.',['Text Rendering','Thumbnails','Posters','Logos'],4.6,'Perfect Text','T','2023-08-22'],
['Leonardo AI','leonardo.ai','TD','FM','$12/mo','AI art & production suite','Fine-tuned models, real-time canvas, and consistent characters — a full creative pipeline used by game artists and YouTubers.',['Fine-Tuned Models','Canvas','Characters','Game Art'],4.6,'Custom Models','F','2022-12-01'],
['Adobe Firefly','adobe.com','TD','FM','$4.99/mo','Commercially-safe AI generation','Adobe\'s AI image, vector, and video generation trained on licensed content — integrated across Creative Cloud.',['Commercially Safe','Vectors','Creative Cloud','Generative Fill'],4.5,'CC Integrated','','2023-03-21'],
['Flux','bfl.ai','TD','FM','$0.025/img','State-of-the-art open image model','Black Forest Labs\' FLUX models lead open-source image generation with exceptional prompt adherence and realism.',['Open Source','Realism','Prompt Adherence','API'],4.7,'SOTA Open Model','T','2024-08-01'],
['Recraft','recraft.ai','TD','FM','$12/mo','AI design with brand control','Design-grade image generation with exact brand colors, styles, vector art, and mockups — built for designers.',['Brand Styles','Vector Art','Mockups','Design'],4.5,'Vector Native','N','2023-05-01'],
['Photoroom','photoroom.com','TD','FM','$12.99/mo','AI photo editing for products','Instant background removal and AI backgrounds for product photos — the e-commerce standard on mobile.',['Background Removal','Product Photos','E-commerce','Mobile'],4.6,'1-Tap Cutout','','2019-01-01'],
['Remove.bg','remove.bg','TD','FM','$9/mo','Instant background removal','The original one-click background remover for images with API and Photoshop integration.',['Background Removal','API','Photoshop','Batch'],4.5,'5s Processing','','2018-12-01'],
['Fotor','fotor.com','TD','FM','$8.99/mo','AI photo editor & generator','All-in-one photo editing with AI image generation, enhancement, headshots, and design templates.',['Photo Editing','Headshots','Enhancement','Templates'],4.2,'All-in-One','','2012-01-01'],
['Pixlr','pixlr.com','TD','FM','$7.99/mo','AI-powered browser photo editor','Free Photoshop alternative in the browser with generative fill, expand, and AI design tools.',['Browser Editor','Generative Fill','Free Tier','Design'],4.3,'Browser Native','','2008-01-01'],
['ThumbnailTest','thumbnailtest.com','TD','P','$15/mo','A/B test YouTube thumbnails','Automatically rotate and test thumbnails on live videos to find the highest-CTR winner with statistical confidence.',['A/B Testing','CTR','YouTube','Analytics'],4.5,'Auto Rotation','','2021-01-01'],
['Magnific','magnific.ai','TD','P','$39/mo','AI image upscaler & enhancer','The famous "hallucinating" upscaler that adds realistic detail while upscaling — beloved by thumbnail artists.',['Upscaling','Detail Enhancement','Reimagine','Pro'],4.6,'16x Upscale','','2023-11-01'],
['Upscayl','upscayl.org','TD','F','','Free open-source image upscaler','Free, private, offline AI image upscaling for Linux, macOS, and Windows — no cloud needed.',['Free','Open Source','Offline','Privacy'],4.4,'100% Offline','','2022-08-01'],
// ===== Scripting & Writing =====
['Gemini','gemini.google.com','AG','FM','$19.99/mo','Google\'s multimodal AI assistant','Research, script, and brainstorm with Google\'s frontier model — Deep Research and 1M-token context for long video projects.',['Multimodal','Deep Research','Long Context','Google'],4.7,'1M Token Context','FT','2023-12-06'],
['Perplexity','perplexity.ai','AG','FM','$20/mo','AI research with citations','Answer engine that researches topics with live web citations — perfect for fact-checking video scripts.',['Research','Citations','Fact-Check','Live Web'],4.7,'Cited Answers','F','2022-08-01'],
['Notion AI','notion.so','SW','FM','$10/mo','AI inside your workspace','Write, summarize, and organize scripts and content calendars with AI built into your Notion workspace.',['Workspace','Summarize','Content Calendar','Organize'],4.4,'Workspace Native','','2023-02-22'],
['Grammarly','grammarly.com','SW','FM','$12/mo','AI writing assistant everywhere','Real-time grammar, tone, and clarity suggestions across every app — plus generative AI drafting.',['Grammar','Tone','Clarity','Everywhere'],4.5,'500K+ Apps','','2009-01-01'],
['QuillBot','quillbot.com','SW','FM','$9.95/mo','Paraphrasing & summarizing AI','Rewrite, summarize, and humanize text with the most popular paraphrasing tool for content writers.',['Paraphrasing','Summarizer','Humanize','Rewrite'],4.3,'9 Rewrite Modes','','2017-01-01'],
['Rytr','rytr.me','SW','FM','$9/mo','Budget-friendly AI writer','Generate outlines, hooks, and descriptions in 30+ languages with 40+ use-case templates at an unbeatable price.',['Budget','40+ Templates','30+ Languages','Hooks'],4.2,'Best Value','','2021-04-01'],
['Sudowrite','sudowrite.com','SW','P','$19/mo','AI for fiction & storytelling','Story engine built for narrative writers — describe, expand, and brainstorm plot twists for story-driven channels.',['Fiction','Storytelling','Plot','Narrative'],4.4,'Story Engine','','2020-11-01'],
['Subscribr','subscribr.ai','SW','P','$39/mo','YouTube script writing AI','Purpose-built for YouTube: research viral videos in your niche and write retention-optimized scripts with hooks.',['YouTube Scripts','Retention','Hooks','Niche Research'],4.5,'Retention Optimized','N','2023-09-01'],
['Wordtune','wordtune.com','SW','FM','$6.99/mo','AI rewriting & tone control','Rewrite sentences with tone and length control, plus AI answers grounded in your sources.',['Rewriting','Tone Control','Shorten','Sources'],4.3,'Tone Slider','','2020-10-01'],
['Hypotenuse AI','hypotenuse.ai','SW','P','$29/mo','E-commerce & SEO content AI','Bulk-generate product descriptions, SEO articles, and social captions with brand voice training.',['E-commerce','SEO Content','Bulk','Brand Voice'],4.2,'Bulk Generation','','2020-08-01'],
['Grok','x.ai','AG','FM','$30/mo','xAI\'s real-time assistant','Frontier reasoning model with live X data, image generation, and unfiltered research for trend-aware creators.',['Real-time Trends','Reasoning','X Data','Image Gen'],4.5,'Live Trend Data','T','2023-11-04'],
['DeepSeek','deepseek.com','AG','F','','Open-source frontier reasoning','Free frontier-level reasoning and writing model — R1 rivals paid models for script logic and research.',['Free','Open Source','Reasoning','Research'],4.5,'Free Frontier AI','T','2023-11-29'],
['Surfer','surferseo.com','SW','P','$89/mo','SEO content optimization','Data-driven content editor that scores your articles against SERP competitors — standard for blog-to-video pipelines.',['SEO','Content Score','SERP','Optimization'],4.5,'SERP Analyzer','','2017-01-01'],
['Frase','frase.io','SW','P','$45/mo','SEO research & AI writing','Research, outline, write, and optimize SEO content in one workflow with question research from SERPs.',['SEO Research','Outlines','Questions','Optimization'],4.3,'SERP Questions','','2016-01-01'],
// ===== Prompts & Templates =====
['PromptBase','promptbase.com','PT','FM','','Prompt marketplace','Buy and sell tested prompts for Midjourney, DALL·E, Stable Diffusion and GPT — a shortcut to proven thumbnail and visual styles.',['Prompt Marketplace','Midjourney','GPT','Stable Diffusion'],4.2,'Tested Prompts','','2022-06-01'],
['PromptHero','prompthero.com','PT','F','','Prompt library & education','Search a large open library of AI image prompts with example outputs, plus free courses on prompting for Midjourney, SDXL and Flux.',['Prompt Library','Examples','Courses','Free'],4.2,'Open Prompt Library','','2022-11-01'],
['AIPRM','aiprm.com','PT','FM','','Prompt templates for ChatGPT','Browser extension that adds curated prompt templates to ChatGPT — SEO briefs, video scripts and personas in one click.',['ChatGPT Extension','Templates','SEO Briefs','Personas'],4.1,'Template Packs','','2022-11-01'],
// ===== Transcription & Captions =====
['Whisper','openai.com','TC','F','','Open-source speech recognition','OpenAI\'s free, open-source ASR model supporting 90+ languages — the backbone of most captioning tools.',['Open Source','90+ Languages','ASR','Free'],4.7,'Open Source King','F','2022-09-21'],
['Otter.ai','otter.ai','TC','FM','$16.99/mo','AI meeting & interview notes','Real-time transcription with speaker ID, summaries, and action items — great for interview-based content.',['Meetings','Speaker ID','Summaries','Real-time'],4.4,'Live Transcribe','','2016-01-01'],
['Rev','rev.com','TC','P','$0.25/min','Human + AI transcription','Industry-standard transcription with both AI (fast) and human (99% accurate) options plus captions and subtitles.',['Human Option','99% Accuracy','Captions','Legal'],4.5,'99% Human Accuracy','','2010-01-01'],
['Trint','trint.com','TC','P','$52/mo','Transcription for storytellers','Newsroom-grade transcription and collaborative story building in 40+ languages — used by AP and Vice.',['Newsrooms','Collaboration','40+ Languages','Verified'],4.3,'Newsroom Grade','','2014-01-01'],
['Sonix','sonix.ai','TC','P','$10/hr','Automated multilingual transcripts','Fast automated transcription in 50+ languages with in-browser editor, subtitles, and AI summaries.',['50+ Languages','Browser Editor','Subtitles','Summaries'],4.4,'40+ Language Sub','','2017-01-01'],
['Deepgram','deepgram.com','TC','FM','$0.0043/min','Speech-to-text API for developers','Nova-3 delivers the fastest, most accurate STT API for building voice features into creator tools.',['API','Nova-3','Real-time','Developers'],4.6,'Nova-3 Model','','2015-01-01'],
['AssemblyAI','assemblyai.com','TC','FM','$0.12/hr','Speech AI models via API','Universal-2 speech-to-text with sentiment, chapters, and PII redaction for building media features.',['API','Chapters','Sentiment','Universal-2'],4.6,'Auto Chapters','','2017-01-01'],
['Happy Scribe','happyscribe.com','TC','P','$17/mo','Transcription & subtitle platform','Machine and human-made transcripts and subtitles in 120+ languages with a professional subtitle editor.',['120+ Languages','Subtitle Editor','Human Option','SRT'],4.4,'120+ Languages','','2017-01-01'],
['MacWhisper','goodsnooze.gumroad.com','TC','FM','€59 one-time','Local Whisper transcription for Mac','Drag-and-drop local transcription on macOS — private, fast, one-time purchase, no subscription.',['Mac','Local','Privacy','One-Time'],4.6,'100% On-Device','','2023-02-01'],
['Zeemo','zeemo.ai','TC','FM','$12.9/mo','Auto captions in 95+ languages','Caption videos automatically with 98% accuracy, translate subtitles, and style them for social — mobile-first.',['Auto Captions','95+ Languages','Mobile','Styles'],4.3,'98% Accuracy','','2021-01-01'],
['Zubtitle','zubtitle.com','TC','P','$19/mo','Captions & social video optimizer','Add captions, headlines, and progress bars to social videos with automatic resizing per platform.',['Captions','Headlines','Resize','Social'],4.2,'Social Optimizer','','2018-01-01'],
['Checksub','checksub.com','TC','P','$12.5/mo','AI subtitles & dubbing','Generate, translate, and style subtitles in 200+ languages with an AI dubbing option.',['Subtitles','200+ Languages','Dubbing','Translation'],4.2,'200+ Languages','','2018-01-01'],
['Amberscript','amberscript.com','TC','P','$10/hr','Transcription & captioning services','GDPR-compliant machine and human transcription with strong accuracy in European languages.',['GDPR','European Languages','Human Option','Compliance'],4.2,'EU Compliant','','2017-01-01'],
// ===== SEO & Analytics =====
['vidIQ','vidiq.com','SA','FM','$16.58/mo','YouTube growth & keyword AI','Keyword research, competitor tracking, daily video ideas, and AI coaching — the most popular YouTube SEO extension.',['Keywords','Competitors','Daily Ideas','Extension'],4.6,'AI Daily Ideas','FT','2011-01-01'],
['1of10','1of10.com','SA','P','$41/mo','Outlier thumbnail research','Find breakout "outlier" videos in any niche to reverse-engineer winning titles, topics, and thumbnails.',['Outliers','Research','Thumbnails','Titles'],4.5,'Outlier Detection','N','2023-08-01'],
['Spotter Studio','spotterstudio.com','SA','P','$99/yr','Ideation engine for YouTubers','From the company that funds MrBeast: brainstorm, package, and project-manage videos with AI trained on 10M+ outliers.',['Ideation','Packaging','MrBeast','Outliers'],4.4,'10M+ Video Data','N','2024-09-01'],
['Taja AI','taja.ai','SA','P','$19/mo','AI YouTube publishing copilot','Optimize titles, descriptions, tags, chapters, and thumbnails from one dashboard as you publish.',['Titles','Tags','Chapters','Publishing'],4.3,'1-Click Optimize','','2023-01-01'],
['ViewStats','viewstats.com','SA','FM','$9.99/mo','Channel analytics by MrBeast\'s team','Public channel stats, thumbnail search, and outlier discovery from the ViewStats team.',['Public Stats','Thumbnail Search','Outliers','Benchmarks'],4.2,'Thumbnail Search','N','2024-01-01'],
['TubeRanker','tuberanker.com','SA','FM','$19/mo','YouTube SEO toolkit','Keyword explorer, tag generator, and rank tracker for optimizing video metadata.',['Keywords','Tags','Rank Tracker','Metadata'],4.1,'Rank Tracking','','2020-01-01'],
['NexLev','nexlev.io','SA','FM','','Faceless niche & trend research','Find winning YouTube niches, trending topics and competitor gaps with AI research built for faceless channel operators.',['Niche Research','Trend Discovery','Faceless','YouTube'],4.2,'Niche Finder','N','2023-01-01'],
// ===== Automation =====
['Metricool','metricool.com','AU','FM','$22/mo','Social scheduling & analytics','Plan, schedule, and analyze content across all platforms including YouTube and TikTok with AI post generation.',['Scheduling','Analytics','All Platforms','AI Posts'],4.5,'All-Platform','','2015-01-01'],
['Ocoya','ocoya.com','AU','P','$15/mo','AI social media automation','Create, caption, and schedule social content with AI copywriting in 26 languages and e-commerce integrations.',['AI Captions','Scheduling','26 Languages','E-commerce'],4.2,'AI Copy + Schedule','','2021-01-01'],
['Publer','publer.com','AU','FM','$12/mo','Social media superhero','Schedule everywhere with AI assist, bulk tools, recycling, and best-time recommendations.',['Bulk Scheduling','Recycling','Best Time','AI Assist'],4.4,'Bulk Tools','','2015-01-01'],
['Buffer','buffer.com','AU','FM','$6/mo','Simple social publishing with AI','The classic scheduling tool with an AI assistant for repurposing posts across channels.',['Scheduling','AI Assistant','Repurposing','Simple'],4.3,'Classic & Clean','','2010-01-01'],
['SocialBee','socialbee.com','AU','P','$29/mo','AI-powered content categories','Category-based social scheduling with AI copilot that builds your entire posting strategy.',['Categories','AI Copilot','Strategy','Evergreen'],4.3,'Category Engine','','2016-01-01'],
['Blotato','blotato.com','AU','P','$29/mo','AI content repurposing API','Turn one video into 10+ platform-native posts and automate faceless channels via API and no-code workflows.',['Repurposing','API','Faceless','No-Code'],4.2,'1-to-10 Content','N','2024-01-01'],
['Gumloop','gumloop.com','AU','FM','$97/mo','No-code AI workflow builder','Drag-and-drop AI automations for content pipelines — scrape, generate, and publish without code.',['No-Code','Workflows','Scraping','Pipelines'],4.4,'Visual AI Flows','N','2023-01-01'],
['Lindy','lindy.ai','AU','FM','$49.99/mo','AI employees for busy creators','Build AI agents that handle email, research, meeting notes, and content tasks autonomously.',['AI Agents','Email','Research','Autonomous'],4.3,'Agent Teams','N','2023-06-01'],
['Simplified','simplified.com','AU','FM','$18/mo','All-in-one AI marketing suite','Design, write, edit video, and schedule social posts in one workspace built for lean creator teams.',['All-in-One','Design','Scheduling','Teams'],4.3,'One Workspace','','2020-01-01'],
['Predis.ai','predis.ai','AU','FM','$32/mo','AI social posts from a prompt','Generate ready-to-publish branded posts, carousels, and reels with competitor analysis built in.',['Social Posts','Carousels','Reels','Competitor Intel'],4.2,'Brand-Aware Posts','','2021-01-01'],
['NotebookLM','notebooklm.google.com','AG','FM','$19.99/mo','AI research & podcast notebook','Upload sources and get grounded summaries, study guides, and viral Audio Overview podcasts from your own documents.',['Research','Audio Overviews','Grounded','Sources'],4.6,'Audio Overviews','TN','2023-07-12'],
// ===== Live & Streaming =====
['StreamYard','streamyard.com','LS','FM','$20/mo','Browser live streaming studio','Multistream to YouTube, LinkedIn, and Facebook with guests, overlays, and local recordings — no install needed.',['Multistream','Guests','Browser','Overlays'],4.6,'Zero Install','F','2018-01-01'],
['Restream','restream.io','LS','FM','$16/mo','Multistream to 30+ platforms','Broadcast simultaneously to 30+ destinations with studio, captions, and stream analytics.',['30+ Platforms','Studio','Analytics','Captions'],4.5,'30+ Destinations','','2015-01-01'],
['Streamlabs','streamlabs.com','LS','FM','$19/mo','All-in-one streaming toolkit','OBS-based streaming suite with AI highlights, alerts, tips, and the Podcast Editor for repurposing.',['OBS','Alerts','AI Highlights','Tips'],4.4,'AI Highlights','','2014-01-01'],
['Ecamm Live','ecamm.com','LS','P','$20/mo','Pro live production for Mac','Mac-native live streaming with scenes, interviews, PiP, and pro camera control loved by solo hosts.',['Mac','Scenes','Interviews','Pro Camera'],4.5,'Mac Native Pro','','2016-01-01'],
['StreamElements','streamelements.com','LS','FM','','Streaming overlays & engagement','Cloud scenes, alerts, chatbot and loyalty tools for Twitch and YouTube streamers, with AI-assisted clip and title features.',['Overlays','Alerts','Chatbot','Twitch'],4.3,'Cloud Scenes','','2017-01-01'],
// ===== 3D & Motion =====
['Wonder Studio','wonderdynamics.com','TM','P','$24.99/mo','AI CG character animation','Automatically animate, light, and composite CG characters into live-action footage — Autodesk\'s VFX game-changer.',['CG Characters','VFX','Auto Compositing','Autodesk'],4.6,'Auto VFX Comp','F','2023-03-01'],
['Move AI','move.ai','TM','P','$15/mo','Markerless motion capture','Capture 3D motion from regular phone videos — no suits or markers — and export to Blender, Unity, or Unreal.',['Motion Capture','Markerless','Phone Video','3D Export'],4.4,'Phone MoCap','','2019-01-01'],
['Cascadeur','cascadeur.com','TM','FM','$99/yr','AI-assisted 3D animation','Physics-based character animation with AI autoposing — create realistic action animations without mocap.',['3D Animation','Physics','Autoposing','Characters'],4.5,'Physics Engine','','2019-01-01'],
['Plask','plask.ai','TM','FM','$8/mo','Browser motion capture & animation','Extract motion from video in the browser and edit 3D animations with an intuitive timeline.',['Browser','Motion Capture','Timeline','Free Tier'],4.2,'Browser MoCap','','2021-01-01'],
['Rokoko Video','rokoko.com','TM','FM','$20/mo','Free video-to-animation capture','Turn any video into 3D character animation for free, with pro mocap hardware as you scale.',['Free','Video to 3D','Mocap Suits','Blender'],4.3,'Free Video MoCap','','2014-01-01'],
['Spline AI','spline.design','TM','FM','$12/mo','AI 3D design in the browser','Generate and edit interactive 3D scenes with AI prompts, then embed them directly on the web.',['3D Design','Web Embed','Interactive','Prompts'],4.4,'Web 3D Native','','2020-01-01'],
['Meshy','meshy.ai','TM','FM','$16/mo','Text & image to 3D models','Generate textured 3D models from text or images in under a minute — the most popular AI 3D pipeline.',['Text to 3D','Image to 3D','Textures','Game Assets'],4.5,'60s 3D Models','T','2023-10-01'],
['DeepMotion','deepmotion.com','TM','FM','','Markerless motion capture','Animate 3D characters from ordinary video with AI motion capture — no suit needed, with exports for Blender and Unreal.',['Motion Capture','Video to Animation','No Suit','Blender'],4.3,'Video Mocap','','2017-01-01'],
['Kaedim','kaedim.com','TM','P','','2D to production-ready 3D','Turn concept art and photos into clean, game-ready 3D models with AI mesh generation plus human review of the output.',['2D to 3D','Game Assets','Mesh Generation','Human QA'],4.2,'Game-Ready Meshes','N','2022-01-01'],
['Tripo AI','tripo3d.ai','TM','FM','','Fast text & image to 3D','Generate textured 3D models from a single image or prompt in seconds, with rigging and export options for games and animation.',['Image to 3D','Text to 3D','Rigging','Fast'],4.3,'Seconds to Model','N','2023-12-01'],
];

function slugify(name) {
  return name.toLowerCase().replace(/['’.]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const seen = new Set();
const tools = ROWS.map((r, i) => {
  const [name, domain, cat, pricing, price, tagline, description, tags, rating, metric, flags = '', launch = '2023-01-01'] = r;
  let slug = slugify(name);
  if (seen.has(slug)) slug = `${slug}-${slugify(CAT[cat])}`;
  seen.add(slug);
  return {
    id: String(100 + i),
    name, slug, tagline, description,
    url: `https://${domain.includes('/') ? domain : 'www.' + domain.replace(/^www\./, '')}`.replace('www.gemini', 'gemini').replace('www.sora', 'sora').replace('www.x.ai', 'x.ai').replace('www.goodsnooze', 'goodsnooze'),
    logo: `https://www.google.com/s2/favicons?domain=${domain.split('/')[0]}&sz=128`,
    category: CAT[cat],
    pricing: PRICE[pricing],
    ...(price ? { startingPrice: price } : {}),
    rating,
    reviewsCount: 0,
    ratingLabel: 'Editorial Score',
    isFeatured: flags.includes('F'),
    isEditorsChoice: flags.includes('E'),
    isTrending: flags.includes('T'),
    isNew: flags.includes('N'),
    hasFounderBadge: false,
    tags,
    metrics: metric,
    launchDate: launch,
    lastReviewed: '2026-08-01',
  };
});

const header = `// ⚠️ AUTO-GENERATED by scripts/gen-tools.mjs — edit the seed list there, then re-run.
// ${tools.length} curated tools across ${new Set(tools.map(t => t.category)).size} categories.
import type { ToolSeed } from './tools';

export const EXTENDED_TOOLS: ToolSeed[] = ${JSON.stringify(tools, null, 2)};
`;

writeFileSync(new URL('../src/data/tools-extended.ts', import.meta.url), header);
console.log(`✅ Generated ${tools.length} tools`);
const cats = {};
tools.forEach(t => cats[t.category] = (cats[t.category] || 0) + 1);
console.table(cats);
