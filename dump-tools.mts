import { ALL_TOOLS } from './src/data/tools.ts';
const tools = ALL_TOOLS.map((t) => ({
  id: t.id, name: t.name, slug: t.slug, tagline: t.tagline,
  description: t.description, url: t.url,
  category: t.category, pricing: t.pricing, startingPrice: t.startingPrice,
  verificationLevel: t.verificationLevel,
  testedAt: t.testedAt ?? null, pricingCheckedAt: t.pricingCheckedAt ?? null,
  isFeatured: t.isFeatured, isEditorsChoice: t.isEditorsChoice,
  tags: t.tags, metrics: t.metrics ?? null, launchDate: t.launchDate ?? null,
}));
const out = { total: tools.length, generated_at: new Date().toISOString(), tools };
process.stdout.write(JSON.stringify(out, null, 2));
