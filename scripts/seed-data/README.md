# Seeded content translations

Hand-written, professionally translated catalog content for all 7 non-English
locales. Each `{locale}.*.json` file holds translations for:

- `tools` / `tools.part1..3` — tagline + short description for **all 206 tools**
- `categories` — label + editorial intro / whatMatters / reality for all 17
  categories
- `news` — title + excerpt + category label for the curated news feed
- `blog` — title + excerpt + category label for blog posts

These are the SOURCE files. Run:

```bash
node scripts/build-snapshot.mjs fa es pt fr de zh ar
```

to regenerate `src/i18n-content/{locale}.json`, which the site reads at
runtime (falling back to English for anything missing). The auto-translate
engine (`npm run translate:content`) will top up anything new after this seed.
