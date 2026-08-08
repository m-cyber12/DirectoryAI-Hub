-- ================================================================
-- CREATOR AI HUB — SUPABASE FAIL-SAFE SQL SCHEMA & INITIAL SEED DATA
-- ================================================================
-- این کد را در بخش SQL Editor در پنل Supabase کپی و دکمه Run را بزنید
-- (حتی اگر قبلاً اجرا کرده باشید، بدون خطا از اول جدول‌ها را تمیز می‌سازد)
-- ================================================================

-- 0. پاک کردن قوانین و جدول‌های قبلی در صورت وجود (برای جلوگیری از خطای policy exists)
DROP POLICY IF EXISTS "Public tools are viewable by everyone" ON public.tools;
DROP POLICY IF EXISTS "Anyone can insert a tool submission" ON public.submissions;
DROP TABLE IF EXISTS public.tools CASCADE;
DROP TABLE IF EXISTS public.submissions CASCADE;

-- 1. Create tools table (جدول اصلی ابزارهای سایت)
CREATE TABLE public.tools (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  tagline TEXT NOT NULL,
  description TEXT NOT NULL,
  url TEXT NOT NULL,
  affiliate_url TEXT,
  logo TEXT NOT NULL,
  cover_image TEXT NOT NULL,
  category TEXT NOT NULL,
  pricing TEXT NOT NULL DEFAULT 'Freemium',
  starting_price TEXT,
  rating NUMERIC(3,1) DEFAULT 4.8,
  reviews_count INTEGER DEFAULT 10,
  is_featured BOOLEAN DEFAULT false,
  has_founder_badge BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  metrics TEXT,
  status TEXT DEFAULT 'approved' CHECK (status IN ('approved', 'pending', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create submissions table (جدول درخواست‌های ارسال ابزار توسط کاربران)
CREATE TABLE public.submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_name TEXT NOT NULL,
  website_url TEXT NOT NULL,
  tagline TEXT NOT NULL,
  category TEXT NOT NULL,
  pricing TEXT NOT NULL,
  founder_email TEXT NOT NULL,
  will_add_badge BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
CREATE POLICY "Public tools are viewable by everyone" 
  ON public.tools FOR SELECT 
  USING (status = 'approved');

CREATE POLICY "Anyone can insert a tool submission" 
  ON public.submissions FOR INSERT 
  WITH CHECK (true);

-- ================================================================
-- 5. INSERT 10 INITIAL TESTED TOOLS INTO DATABASE
-- ================================================================
INSERT INTO public.tools (
  name, slug, tagline, description, url, affiliate_url, logo, cover_image, category, pricing, starting_price, rating, reviews_count, is_featured, has_founder_badge, tags, metrics, status
) VALUES 
(
  'OpusClip AI', 'opusclip', '1 long YouTube video into 10 viral Shorts in 1 click',
  'AI-powered video clipping tool that turns long YouTube videos into viral TikTok, YouTube Shorts, and Reels with dynamic captions and AI virality score.',
  'https://www.opus.pro', 'https://www.opus.pro/?via=creatoraihub',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1626544827763-d516dce335e2?w=800&auto=format&fit=crop&q=80',
  'Shorts & Reels', 'Freemium', '$19/mo', 4.9, 428, true, true,
  ARRAY['Shorts', 'Auto-Captions', 'Virality Score', 'YouTube to TikTok'], '10x Faster Editing', 'approved'
),
(
  'ElevenLabs', 'elevenlabs', 'Hyper-realistic AI voice generator & cloning for creators',
  'The industry standard for AI voiceovers, voice cloning, and dubbing in 29+ languages. Perfect for faceless YouTube channels and documentaries.',
  'https://elevenlabs.io', 'https://elevenlabs.io/?from=creatoraihub',
  'https://images.unsplash.com/photo-1557683316-973673baf926?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
  'Voice & Audio', 'Freemium', '$5/mo', 4.9, 612, true, true,
  ARRAY['Voice Cloning', 'Text to Speech', 'Multilingual Dubbing', 'Audio'], '29+ Languages', 'approved'
),
(
  'Descript Studio', 'descript', 'Edit video and audio by editing text like a doc',
  'All-in-one video and podcast editor with AI overdub, studio sound enhancement, filler word removal, and automatic transcription.',
  'https://www.descript.com', 'https://www.descript.com?via=creatoraihub',
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&auto=format&fit=crop&q=80',
  'Video Editing', 'Freemium', '$12/mo', 4.8, 520, true, false,
  ARRAY['Text-Based Editing', 'Studio Sound', 'Filler Removal', 'Podcasting'], 'Studio Quality AI', 'approved'
),
(
  'Midjourney v6', 'midjourney', 'Ultra-photorealistic AI image & thumbnail asset generator',
  'Generate stunning YouTube video thumbnails, custom B-roll illustrations, and cinematic concept art from simple text descriptions.',
  'https://www.midjourney.com', NULL,
  'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
  'Thumbnails & Design', 'Paid', '$10/mo', 4.9, 940, false, false,
  ARRAY['Thumbnails', 'Concept Art', 'AI Images', 'Discord'], 'v6 Photorealism', 'approved'
),
(
  'Submagic AI', 'submagic', 'Captivating AI captions & emojis for short-form videos',
  'Automatically generate Alex Hormozi style animated captions, B-rolls, zooms, and sound effects for your Shorts, Reels, and TikToks.',
  'https://submagic.co', 'https://submagic.co?ref=creatoraihub',
  'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=800&auto=format&fit=crop&q=80',
  'Shorts & Reels', 'Free Trial', '$20/mo', 4.8, 298, false, true,
  ARRAY['Animated Captions', 'Emojis', 'Auto Zoom', 'TikTok'], 'Alex Hormozi Captions', 'approved'
),
(
  'Runway Gen-3', 'runway-gen3', 'Next-generation AI video generation & VFX toolkit',
  'Create cinematic AI video clips from text or reference images, remove moving objects, and apply motion tracking with Hollywood-grade AI.',
  'https://runwayml.com', NULL,
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
  'Video Editing', 'Freemium', '$12/mo', 4.9, 410, false, false,
  ARRAY['Text to Video', 'Gen-3 Alpha', 'Inpainting', 'VFX'], 'Hollywood VFX', 'approved'
),
(
  'VidIQ AI Copilot', 'vidiq-ai', 'AI YouTube video ideas, keyword research, and script assistant',
  'Boost your YouTube channel growth with AI-driven topic recommendations, title predictions, competitor analysis, and daily video ideas.',
  'https://vidiq.com', 'https://vidiq.com/creatoraihub',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
  'Script & SEO', 'Freemium', '$7.50/mo', 4.7, 750, false, true,
  ARRAY['YouTube SEO', 'Keyword Research', 'Title Generator', 'Analytics'], '+300% CTR Boost', 'approved'
),
(
  'Adobe Podcast AI', 'adobe-podcast', 'Turn phone voice recordings into professional studio quality',
  'Free AI speech enhancement that removes background noise and echoes from any microphone recording instantly.',
  'https://podcast.adobe.com/enhance', NULL,
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&auto=format&fit=crop&q=80',
  'Voice & Audio', 'Free', NULL, 4.9, 880, false, false,
  ARRAY['Noise Removal', 'Audio Enhancement', 'Free Tool', 'Studio Speech'], '100% Free Tool', 'approved'
),
(
  'HeyGen Avatars', 'heygen', 'AI avatar video generator with instant voice translation',
  'Create studio-quality videos with AI avatars that speak 40+ languages. Automatically translate and lip-sync your existing YouTube videos.',
  'https://www.heygen.com', 'https://www.heygen.com?ref=creatoraihub',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
  'Video Editing', 'Freemium', '$24/mo', 4.8, 345, false, true,
  ARRAY['AI Avatars', 'Lip Syncing', 'Video Translation', 'Faceless Video'], '40+ Languages', 'approved'
),
(
  'Photoshop AI Thumbnail Studio', 'photoshop-ai', 'Expand, modify, and generate YouTube thumbnail elements in seconds',
  'Adobe Firefly powered Generative Fill allows creators to extend thumbnail backgrounds, remove unwanted items, and add realistic props.',
  'https://www.adobe.com/products/photoshop', NULL,
  'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
  'Thumbnails & Design', 'Paid', '$22.99/mo', 4.8, 980, false, false,
  ARRAY['Thumbnail Editor', 'Generative Fill', 'AI Object Removal', 'Adobe'], '10M+ Creators', 'approved'
);
