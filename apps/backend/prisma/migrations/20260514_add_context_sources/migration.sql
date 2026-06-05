-- AddColumn: liveContextSnapshot on user_onboarding_sessions
ALTER TABLE "user_onboarding_sessions" ADD COLUMN IF NOT EXISTS "live_context_snapshot" JSONB;

-- CreateTable: context_sources
CREATE TABLE IF NOT EXISTS "context_sources" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "connector_id" TEXT,
    "mcp_tool_name" TEXT,
    "mcp_tool_args" JSONB NOT NULL DEFAULT '{}',
    "rest_url" TEXT,
    "rest_method" TEXT NOT NULL DEFAULT 'GET',
    "context_key" TEXT NOT NULL,
    "allowed_fields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "context_sources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "context_sources_organization_id_idx" ON "context_sources"("organization_id");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "context_sources" ADD CONSTRAINT "context_sources_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "context_sources" ADD CONSTRAINT "context_sources_connector_id_fkey"
    FOREIGN KEY ("connector_id") REFERENCES "mcp_connectors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- UniqueConstraint: contextKey per org
DO $$ BEGIN
  ALTER TABLE "context_sources" ADD CONSTRAINT "context_sources_org_context_key_key"
    UNIQUE ("organization_id", "context_key");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
