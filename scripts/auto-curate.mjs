#!/usr/bin/env node
/**
 * ============================================================================
 * CREATOR AI HUB — AI AUTO-CURATOR PIPELINE FOR SOLO FOUNDERS
 * ============================================================================
 * نحوه اجرا:
 *   node scripts/auto-curate.mjs "https://example.ai"
 * 
 * این اسکریپت آدرس سایت را دریافت کرده، اطلاعات متای سایت را اسکرپ می‌کند
 * و آن را آماده ثبت در جدول Supabase یا فایل tools.ts می‌کند.
 * ============================================================================
 */

import https from 'https';
import http from 'http';
import { URL } from 'url';

const targetUrl = process.argv[2];

if (!targetUrl) {
  console.error('❌ خطا: لطفاً آدرس سایت ابزار را وارد کنید.');
  console.error('   مثال: node scripts/auto-curate.mjs "https://elevenlabs.io"');
  process.exit(1);
}

console.log(`🤖 [CreatorAI Hub Auto-Curator] در حال بررسی سایت: ${targetUrl} ...`);

async function fetchMetadata(urlStr) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(urlStr);
    const client = parsedUrl.protocol === 'https:' ? https : http;

    client.get(urlStr, { headers: { 'User-Agent': 'CreatorAIHub-AutoCurator/1.0' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        // Simple regex extraction for Title and Meta Description
        const titleMatch = data.match(/<title[^>]*>([^<]+)<\/title>/i);
        const descMatch = data.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
                          data.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["'][^>]*>/i);
        const ogImageMatch = data.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i);

        resolve({
          title: titleMatch ? titleMatch[1].trim() : parsedUrl.hostname,
          description: descMatch ? descMatch[1].trim() : 'No description found',
          ogImage: ogImageMatch ? ogImageMatch[1].trim() : `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80`,
          hostname: parsedUrl.hostname,
        });
      });
    }).on('error', (err) => reject(err));
  });
}

async function run() {
  try {
    const meta = await fetchMetadata(targetUrl);
    console.log('\n✅ اطلاعات اولیه استخراج شد:');
    console.log(`   📌 عنوان: ${meta.title}`);
    console.log(`   📝 توضیحات: ${meta.description}`);
    console.log(`   🖼️ کاور: ${meta.ogImage}`);

    // Create structured SQL insert snippet
    const slug = meta.hostname.replace('www.', '').split('.')[0].toLowerCase();
    const sqlSnippet = `
-- دستور SQL برای اضافه کردن در Supabase (بخش SQL Editor):
INSERT INTO public.tools (
  name, slug, tagline, description, url, logo, cover_image, category, pricing, is_featured, tags, status
) VALUES (
  '${meta.title.replace(/'/g, "''")}',
  '${slug}',
  '${meta.title.replace(/'/g, "''")} for Video Creators',
  '${meta.description.replace(/'/g, "''")}',
  '${targetUrl}',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
  '${meta.ogImage}',
  'Video Editing',
  'Freemium',
  false,
  ARRAY['AI Tool', 'Video', 'Creator'],
  'approved'
);
`;

    console.log('\n📋 کد SQL آماده برای درج در Supabase:');
    console.log(sqlSnippet);
    console.log('✅ می‌توانید این دستور را مستقیماً در پنل Supabase کپی و اجرا کنید!');
  } catch (err) {
    console.error('❌ خطا در اسکرپ سایت:', err.message);
  }
}

run();
