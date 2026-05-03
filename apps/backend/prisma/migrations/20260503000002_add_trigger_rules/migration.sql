-- Phase 2: Trigger System Expansion
-- Adds TriggerRule table — defines when the AI employee wakes up and acts

CREATE TABLE IF NOT EXISTS "trigger_rules" (
  "id"              TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "organization_id" TEXT NOT NULL,
  "flow_id"         TEXT NOT NULL,
  "trigger_type"    TEXT NOT NULL, -- page_visit | page_never_visited | usage_threshold | event_fired | inactivity | feature_unused
  "is_active"       BOOLEAN NOT NULL DEFAULT true,
  "url_pattern"     TEXT,
  "first_time_only" BOOLEAN NOT NULL DEFAULT false,
  "days_threshold"  INTEGER,
  "event_name"      TEXT,
  "usage_metric"    TEXT,
  "usage_percent"   INTEGER,
  "feature_slug"    TEXT,
  "created_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "trigger_rules_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "trigger_rules_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
  CONSTRAINT "trigger_rules_flow_id_fkey"
    FOREIGN KEY ("flow_id") REFERENCES "onboarding_flows"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "trigger_rules_organization_id_idx" ON "trigger_rules"("organization_id");
CREATE INDEX IF NOT EXISTS "trigger_rules_flow_id_idx" ON "trigger_rules"("flow_id");
