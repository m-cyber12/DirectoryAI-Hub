-- ================================================================
-- CREATOR AI HUB — NO-CODE DYNAMIC SITE SETTINGS SCHEMA
-- ================================================================
-- این کد را در بخش SQL Editor در پنل Supabase کپی و دکمه Run را بزنید
-- ================================================================

-- 1. Create site_settings table
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- همه کاربران عمومی می‌توانند تنظیمات سایت (تایتل و شعار) را بخوانند
CREATE POLICY "Public site settings are viewable by everyone" 
  ON public.site_settings FOR SELECT 
  USING (true);

-- اجازه ویرایش تنظیمات سایت
CREATE POLICY "Anyone can update site settings" 
  ON public.site_settings FOR UPDATE 
  USING (true);

CREATE POLICY "Anyone can insert site settings" 
  ON public.site_settings FOR INSERT 
  WITH CHECK (true);

-- ================================================================
-- 4. INSERT DEFAULT SITE SETTINGS (تایتل‌ها و متون پیش‌فرض سایت)
-- ================================================================
INSERT INTO public.site_settings (key, value, description) VALUES
('hero_badge', 'Inspired by Bold Studio • MotionSites.ai 3D Edition', 'بج درخشان بالای عنوان اصلی'),
('hero_title_main', 'THE BOLD AI STUDIO', 'تیتر اصلی بزرگ'),
('hero_title_sub', 'For Video Creators & Editors', 'زیرتیتر اصلی'),
('hero_description', 'Cinematic 3D aesthetics, scroll-driven transforms, and hand-curated AI video editors for YouTube, Shorts & studio audio production.', 'توضیحات زیر عنوان Hero'),
('announcement_title', 'Are you building an AI video tool? Get the Verified Founder Badge!', 'عنوان بنر اطلاعیه Founder Flywheel'),
('announcement_desc', 'Add our verified badge on your website or mention CreatorAI Hub on Twitter/X to receive priority listing & permanent SEO backlink.', 'توضیحات بنر اطلاعیه')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
