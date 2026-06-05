-- Create workspaces table
CREATE TABLE "workspaces" (
  "id"              TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "name"            TEXT NOT NULL,
  "is_default"      BOOLEAN NOT NULL DEFAULT false,
  "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "workspaces_organization_id_name_key" UNIQUE ("organization_id", "name"),
  CONSTRAINT "workspaces_organization_id_fkey" FOREIGN KEY ("organization_id")
    REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "workspaces_organization_id_idx" ON "workspaces"("organization_id");

-- Add workspace_id column to workspace-scoped entities (nullable — null = default workspace)
ALTER TABLE "onboarding_flows"        ADD COLUMN "workspace_id" TEXT REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "knowledge_base_articles" ADD COLUMN "workspace_id" TEXT REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "mcp_connectors"          ADD COLUMN "workspace_id" TEXT REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "context_sources"         ADD COLUMN "workspace_id" TEXT REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "interface_page_snapshots" ADD COLUMN "workspace_id" TEXT REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Indexes for workspace-scoped queries
CREATE INDEX "onboarding_flows_workspace_id_idx"         ON "onboarding_flows"("workspace_id");
CREATE INDEX "knowledge_base_articles_workspace_id_idx"  ON "knowledge_base_articles"("workspace_id");
CREATE INDEX "mcp_connectors_workspace_id_idx"           ON "mcp_connectors"("workspace_id");
CREATE INDEX "context_sources_workspace_id_idx"          ON "context_sources"("workspace_id");
CREATE INDEX "interface_page_snapshots_workspace_id_idx" ON "interface_page_snapshots"("workspace_id");

-- Back-fill: create a "Default" workspace for every existing org
-- and assign all existing workspace-scoped entities to it
INSERT INTO "workspaces" ("id", "organization_id", "name", "is_default", "created_at", "updated_at")
SELECT gen_random_uuid()::text, id, 'Default', true, NOW(), NOW()
FROM "organizations";

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
