-- CreateTable: mcp_pending_jobs
-- Async MCP tool call jobs — stores context for follow-up after worker completes (pivot1 Month 2)
CREATE TABLE "mcp_pending_jobs" (
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
CREATE INDEX "mcp_pending_jobs_org_id_status_idx" ON "mcp_pending_jobs"("org_id", "status");

-- CreateIndex
CREATE INDEX "mcp_pending_jobs_created_at_idx" ON "mcp_pending_jobs"("created_at");

-- Cleanup index: remove pending jobs older than 1 hour in background
-- (handled by the session_sweep worker in production)
