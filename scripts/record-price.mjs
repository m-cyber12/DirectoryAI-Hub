#!/usr/bin/env node
/**
 * Record a verified price point for a tool (critique §11-7 price tracking).
 *
 * Usage:
 *   export SUPABASE_URL=...
 *   export SUPABASE_SERVICE_ROLE_KEY=...
 *   node scripts/record-price.mjs <tool-slug> "<starting price>" [source-url]
 *
 * Example:
 *   node scripts/record-price.mjs opusclip "$15/mo" "https://www.opus.pro/pricing"
 *
 * Run this whenever you re-check a vendor's pricing page. The tool page
 * charts every recorded point; two points are enough to show a real trend.
 * Nothing here fabricates history — if you did not check the price today,
 * do not record a point for today.
 */

import { createClient } from '@supabase/supabase-js';

const [slug, price, sourceUrl] = process.argv.slice(2);
const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!slug || !price) {
  console.error('Usage: node scripts/record-price.mjs <tool-slug> "<starting price>" [source-url]');
  process.exit(1);
}
if (!url || !key) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const { error } = await supabase.from('price_history').insert({
  tool_slug: slug,
  starting_price: price,
  source_url: sourceUrl || null,
});

if (error) {
  console.error(`❌ Failed to record price: ${error.message}`);
  process.exit(1);
}
console.log(`✅ Recorded ${price} for "${slug}" at ${new Date().toISOString()}`);
