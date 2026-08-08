// Builds src/i18n-content/{locale}.json from scripts/seed-data/{locale}.*.json
// Usage: node scripts/build-snapshot.mjs <locale> [locale...]
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const locales = process.argv.slice(2);
const dir = join(process.cwd(), 'scripts', 'seed-data');
const outDir = join(process.cwd(), 'src', 'i18n-content');

const TYPE_BY_PREFIX = {
  'categories': 'category',
  'tools': 'tool',
  'tools.part1': 'tool',
  'tools.part2': 'tool',
  'tools.part3': 'tool',
  'news': 'news',
  'blog': 'blog',
  'tags': 'tag',
};

for (const locale of locales) {
  const snap = {};
  const files = readdirSync(dir).filter((f) => f.startsWith(`${locale}.`) && f.endsWith('.json')).sort();
  if (files.length === 0) {
    console.error(`No seed files for ${locale}`);
    process.exit(1);
  }
  for (const file of files) {
    const prefix = file.slice(locale.length + 1, -5); // e.g. "tools.part1"
    const type = TYPE_BY_PREFIX[prefix];
    if (!type) {
      console.warn(`Unknown seed file: ${file}`);
      continue;
    }
    const data = JSON.parse(readFileSync(join(dir, file), 'utf8'));
    snap[type] = { ...(snap[type] ?? {}), ...data };
  }
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, `${locale}.json`), JSON.stringify(snap, null, 1), 'utf8');
  const counts = Object.fromEntries(Object.entries(snap).map(([k, v]) => [k, Object.keys(v).length]));
  console.log(`${locale}.json written:`, JSON.stringify(counts));
}
