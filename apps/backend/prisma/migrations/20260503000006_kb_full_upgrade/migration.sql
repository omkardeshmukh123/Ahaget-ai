-- KB Phase 2: full knowledge base upgrade
-- Add sourceType, sourceUrl, pageUrlPattern (page-scoping), syncStatus, syncedAt, wordCount

ALTER TABLE "knowledge_base_articles"
  ADD COLUMN IF NOT EXISTS "source_type"      TEXT        NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS "source_url"       TEXT,
  ADD COLUMN IF NOT EXISTS "page_url_pattern" TEXT,
  ADD COLUMN IF NOT EXISTS "sync_status"      TEXT        NOT NULL DEFAULT 'idle',
  ADD COLUMN IF NOT EXISTS "synced_at"        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "word_count"       INTEGER     NOT NULL DEFAULT 0;

-- Page-scope index for efficient widget lookups
CREATE INDEX IF NOT EXISTS "kb_articles_org_page_idx"
  ON "knowledge_base_articles"("organization_id", "page_url_pattern");
