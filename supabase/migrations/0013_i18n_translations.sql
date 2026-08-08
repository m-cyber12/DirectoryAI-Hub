-- ─────────────────────────────────────────────────────────────────────────
-- i18n (2026-08-07) — translation cache for the professional LLM engine.
--
-- Every translatable content string in the catalog (tool taglines &
-- descriptions, news bodies, blog posts, category editorial copy, tags) is
-- stored here per (locale, entity_type, entity_id, field), together with a
-- sha1 of the ENGLISH source text. `source_hash` is the change-detector:
-- when the English source is edited, the hash stops matching and the
-- auto-translate cron re-translates just that field.
--
-- Reads are served from here (or from the committed JSON snapshots in
-- src/i18n-content/ when Supabase is not configured); writes come only from
-- server code via SUPABASE_SERVICE_ROLE_KEY.
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists public.content_translations (
  id              bigint generated always as identity primary key,
  locale          text        not null,                -- es/pt/fr/de/zh/ar/fa
  entity_type     text        not null,                -- tool|news|blog|category|tag|deepDive|page
  entity_id       text        not null,                -- tool slug / news slug / category name…
  field           text        not null,                -- tagline|description|title|excerpt|content…
  source_hash     text        not null,                -- sha1 of the English source
  translated_text text        not null,
  provider        text        not null default 'openai',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint content_translations_unique_key
    unique (locale, entity_type, entity_id, field)
);

create index if not exists content_translations_lookup_idx
  on public.content_translations (entity_type, entity_id);

create index if not exists content_translations_pending_idx
  on public.content_translations (locale, updated_at);

alter table public.content_translations enable row level security;

-- Public reads: any visitor may read finished translations (needed by the
-- client-side content API). Writes are service-role only, like every other
-- write on the site (see 0003_lock_down_rls.sql).
create policy "Anyone can read content translations"
  on public.content_translations for select
  using (true);
