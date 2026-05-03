-- Phase 3: Proactive Messaging
-- 1. Add email + unsubscribed to end_users
-- 2. Create proactive_messages table

ALTER TABLE "end_users"
  ADD COLUMN IF NOT EXISTS "email"        TEXT,
  ADD COLUMN IF NOT EXISTS "unsubscribed" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "proactive_messages" (
  "id"               TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "organization_id"  TEXT        NOT NULL,
  "end_user_id"      TEXT        NOT NULL,
  "flow_id"          TEXT        NOT NULL,
  "trigger_rule_id"  TEXT,
  "channel"          TEXT        NOT NULL, -- in_app | email
  "subject"          TEXT,
  "body_snippet"     TEXT,
  "deep_link"        TEXT,
  "status"           TEXT        NOT NULL DEFAULT 'sent',
  "sent_at"          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "opened_at"        TIMESTAMPTZ,
  "clicked_at"       TIMESTAMPTZ,

  CONSTRAINT "proactive_messages_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "proactive_messages_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
  CONSTRAINT "proactive_messages_end_user_id_fkey"
    FOREIGN KEY ("end_user_id") REFERENCES "end_users"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "proactive_messages_org_sent_idx"
  ON "proactive_messages"("organization_id", "sent_at" DESC);
CREATE INDEX IF NOT EXISTS "proactive_messages_end_user_sent_idx"
  ON "proactive_messages"("end_user_id", "sent_at" DESC);
