-- Phase 5: Expansion Revenue Tooling
-- 1. Add upsell fields to onboarding_flows
-- 2. Create upsell_attributions table

ALTER TABLE "onboarding_flows"
  ADD COLUMN IF NOT EXISTS "target_plan"         TEXT,
  ADD COLUMN IF NOT EXISTS "upgrade_url"          TEXT,
  ADD COLUMN IF NOT EXISTS "mrr_per_conversion"   DOUBLE PRECISION;

CREATE TABLE IF NOT EXISTS "upsell_attributions" (
  "id"                   TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "organization_id"      TEXT        NOT NULL,
  "end_user_id"          TEXT        NOT NULL,
  "flow_id"              TEXT        NOT NULL,
  "session_id"           TEXT,
  "target_plan"          TEXT        NOT NULL,
  "attribution_window_h" INTEGER     NOT NULL DEFAULT 48,
  "status"               TEXT        NOT NULL DEFAULT 'pending',
  "mrr"                  DOUBLE PRECISION,
  "suggested_at"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "confirmed_at"         TIMESTAMPTZ,
  "expires_at"           TIMESTAMPTZ NOT NULL,

  CONSTRAINT "upsell_attributions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "upsell_attributions_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
  CONSTRAINT "upsell_attributions_flow_id_fkey"
    FOREIGN KEY ("flow_id") REFERENCES "onboarding_flows"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "upsell_attr_org_suggested_idx"
  ON "upsell_attributions"("organization_id", "suggested_at" DESC);
CREATE INDEX IF NOT EXISTS "upsell_attr_end_user_idx"
  ON "upsell_attributions"("end_user_id", "suggested_at" DESC);
CREATE INDEX IF NOT EXISTS "upsell_attr_status_idx"
  ON "upsell_attributions"("status");
