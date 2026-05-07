-- Migration: add connector permissions + REST API endpoints
-- Applied: 2026-05-03

-- Step 1: Add new columns to mcp_connectors (all have defaults → safe on live DB)
ALTER TABLE "mcp_connectors"
  ADD COLUMN IF NOT EXISTS "description"     TEXT        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "connector_type"  TEXT        NOT NULL DEFAULT 'mcp',
  ADD COLUMN IF NOT EXISTS "allowed_tools"   TEXT[]      NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "read_only"       BOOLEAN     NOT NULL DEFAULT false;

-- Step 2: Create rest_api_endpoints table
CREATE TABLE IF NOT EXISTS "rest_api_endpoints" (
  "id"           TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "connector_id" TEXT        NOT NULL,
  "method"       TEXT        NOT NULL DEFAULT 'GET',
  "url_pattern"  TEXT        NOT NULL,
  "description"  TEXT        NOT NULL DEFAULT '',
  "read_only"    BOOLEAN     NOT NULL DEFAULT false,
  "created_at"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "rest_api_endpoints_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "rest_api_endpoints_connector_id_fkey"
    FOREIGN KEY ("connector_id")
    REFERENCES "mcp_connectors"("id")
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "rest_api_endpoints_connector_id_idx"
  ON "rest_api_endpoints"("connector_id");
