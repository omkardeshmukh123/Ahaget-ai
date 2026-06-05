-- CreateTable: user_memories
CREATE TABLE IF NOT EXISTS "user_memories" (
    "id"              TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "end_user_id"     TEXT NOT NULL,
    "memory_type"     TEXT NOT NULL,
    "content"         TEXT NOT NULL,
    "confidence"      DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_memories_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "user_memories_organization_id_end_user_id_idx" ON "user_memories"("organization_id", "end_user_id");
CREATE INDEX IF NOT EXISTS "user_memories_created_at_idx" ON "user_memories"("created_at");

-- CreateTable: agent_eval_logs
CREATE TABLE IF NOT EXISTS "agent_eval_logs" (
    "id"                    TEXT NOT NULL,
    "organization_id"       TEXT NOT NULL,
    "session_id"            TEXT,
    "step_id"               TEXT,
    "model"                 TEXT,
    "tool_called"           TEXT NOT NULL,
    "latency_ms"            INTEGER NOT NULL,
    "is_init"               BOOLEAN NOT NULL,
    "is_verify"             BOOLEAN NOT NULL,
    "kb_hit"                BOOLEAN,
    "kb_top_score"          DOUBLE PRECISION,
    "selector_valid"        BOOLEAN,
    "step_completed_on_turn" BOOLEAN NOT NULL,
    "streaming"             BOOLEAN NOT NULL DEFAULT false,
    "created_at"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_eval_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "agent_eval_logs_organization_id_idx" ON "agent_eval_logs"("organization_id");
CREATE INDEX IF NOT EXISTS "agent_eval_logs_created_at_idx" ON "agent_eval_logs"("created_at");
CREATE INDEX IF NOT EXISTS "agent_eval_logs_organization_id_created_at_idx" ON "agent_eval_logs"("organization_id", "created_at");

-- CreateTable: branding_configs
CREATE TABLE IF NOT EXISTS "branding_configs" (
    "id"               TEXT NOT NULL,
    "organization_id"  TEXT NOT NULL,
    "primary_color"    TEXT NOT NULL DEFAULT '#6366f1',
    "grad_from"        TEXT NOT NULL DEFAULT '#6366f1',
    "grad_to"          TEXT NOT NULL DEFAULT '#8b5cf6',
    "position"         TEXT NOT NULL DEFAULT 'bottom-right',
    "idle_threshold"   INTEGER NOT NULL DEFAULT 30000,
    "show_mode"        TEXT NOT NULL DEFAULT 'idle',
    "exclude_patterns" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "widget_title"     TEXT NOT NULL DEFAULT 'AI Assistant',
    "greeting"         TEXT NOT NULL DEFAULT 'Hi! How can I help you today?',
    "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"       TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branding_configs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "branding_configs_organization_id_key" ON "branding_configs"("organization_id");

DO $$ BEGIN
  ALTER TABLE "branding_configs" ADD CONSTRAINT "branding_configs_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
