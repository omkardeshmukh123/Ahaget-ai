-- CreateTable: mcp_pending_jobs
CREATE TABLE IF NOT EXISTS "mcp_pending_jobs" (
    "id"          TEXT NOT NULL,
    "org_id"      TEXT NOT NULL,
    "session_id"  TEXT,
    "status"      TEXT NOT NULL DEFAULT 'pending',
    "mcp_result"  JSONB,
    "context"     JSONB NOT NULL,
    "error"       TEXT,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mcp_pending_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "mcp_pending_jobs_org_id_status_idx" ON "mcp_pending_jobs"("org_id", "status");
CREATE INDEX IF NOT EXISTS "mcp_pending_jobs_created_at_idx" ON "mcp_pending_jobs"("created_at");
