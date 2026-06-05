-- CreateTable
CREATE TABLE IF NOT EXISTS "mcp_call_logs" (
    "id"             TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "session_id"     TEXT,
    "connector_id"   TEXT,
    "connector_name" TEXT NOT NULL,
    "tool_name"      TEXT NOT NULL,
    "call_type"      TEXT NOT NULL,
    "args"           JSONB NOT NULL DEFAULT '{}',
    "result"         JSONB,
    "is_error"       BOOLEAN NOT NULL DEFAULT false,
    "latency_ms"     INTEGER,
    "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mcp_call_logs_pkey" PRIMARY KEY ("id")
);

-- AddCheckConstraint
DO $$ BEGIN
  ALTER TABLE "mcp_call_logs" ADD CONSTRAINT "mcp_call_logs_call_type_check"
    CHECK ("call_type" IN ('mcp', 'rest'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "mcp_call_logs" ADD CONSTRAINT "mcp_call_logs_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "mcp_call_logs_organization_id_created_at_idx" ON "mcp_call_logs"("organization_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "mcp_call_logs_session_id_idx" ON "mcp_call_logs"("session_id");
