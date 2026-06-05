-- Create workspaces table
CREATE TABLE IF NOT EXISTS "workspaces" (
  "id"              TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "name"            TEXT NOT NULL,
  "is_default"      BOOLEAN NOT NULL DEFAULT false,
  "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_organization_id_name_key" UNIQUE ("organization_id", "name");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "workspaces_organization_id_idx" ON "workspaces"("organization_id");

-- Add workspace_id column to workspace-scoped entities
ALTER TABLE "onboarding_flows"         ADD COLUMN IF NOT EXISTS "workspace_id" TEXT;
ALTER TABLE "knowledge_base_articles"  ADD COLUMN IF NOT EXISTS "workspace_id" TEXT;
ALTER TABLE "mcp_connectors"           ADD COLUMN IF NOT EXISTS "workspace_id" TEXT;
ALTER TABLE "context_sources"          ADD COLUMN IF NOT EXISTS "workspace_id" TEXT;
ALTER TABLE "interface_page_snapshots" ADD COLUMN IF NOT EXISTS "workspace_id" TEXT;

-- Add FK constraints (idempotent)
DO $$ BEGIN
  ALTER TABLE "onboarding_flows" ADD CONSTRAINT "onboarding_flows_workspace_id_fkey"
    FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "knowledge_base_articles" ADD CONSTRAINT "knowledge_base_articles_workspace_id_fkey"
    FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "mcp_connectors" ADD CONSTRAINT "mcp_connectors_workspace_id_fkey"
    FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "context_sources" ADD CONSTRAINT "context_sources_workspace_id_fkey"
    FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "interface_page_snapshots" ADD CONSTRAINT "interface_page_snapshots_workspace_id_fkey"
    FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Indexes for workspace-scoped queries
CREATE INDEX IF NOT EXISTS "onboarding_flows_workspace_id_idx"         ON "onboarding_flows"("workspace_id");
CREATE INDEX IF NOT EXISTS "knowledge_base_articles_workspace_id_idx"  ON "knowledge_base_articles"("workspace_id");
CREATE INDEX IF NOT EXISTS "mcp_connectors_workspace_id_idx"           ON "mcp_connectors"("workspace_id");
CREATE INDEX IF NOT EXISTS "context_sources_workspace_id_idx"          ON "context_sources"("workspace_id");
CREATE INDEX IF NOT EXISTS "interface_page_snapshots_workspace_id_idx" ON "interface_page_snapshots"("workspace_id");

-- Back-fill: create a "Default" workspace for every org that doesn't have one
INSERT INTO "workspaces" ("id", "organization_id", "name", "is_default", "created_at", "updated_at")
SELECT gen_random_uuid()::text, id, 'Default', true, NOW(), NOW()
FROM "organizations"
WHERE id NOT IN (SELECT organization_id FROM "workspaces" WHERE is_default = true);

-- Assign all existing workspace-scoped entities to their org's default workspace
UPDATE "onboarding_flows" f
SET "workspace_id" = w.id
FROM "workspaces" w
WHERE w.organization_id = f.organization_id AND w.is_default = true AND f.workspace_id IS NULL;

UPDATE "knowledge_base_articles" a
SET "workspace_id" = w.id
FROM "workspaces" w
WHERE w.organization_id = a.organization_id AND w.is_default = true AND a.workspace_id IS NULL;

UPDATE "mcp_connectors" m
SET "workspace_id" = w.id
FROM "workspaces" w
WHERE w.organization_id = m.organization_id AND w.is_default = true AND m.workspace_id IS NULL;

UPDATE "context_sources" c
SET "workspace_id" = w.id
FROM "workspaces" w
WHERE w.organization_id = c.organization_id AND w.is_default = true AND c.workspace_id IS NULL;

UPDATE "interface_page_snapshots" s
SET "workspace_id" = w.id
FROM "workspaces" w
WHERE w.organization_id = s.organization_id AND w.is_default = true AND s.workspace_id IS NULL;
