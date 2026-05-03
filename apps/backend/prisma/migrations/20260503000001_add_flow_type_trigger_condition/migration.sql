-- Phase 1: Unified Flow Engine
-- Add flowType (lifecycle stage) and triggerCondition (when to activate) to onboarding_flows

ALTER TABLE "onboarding_flows"
  ADD COLUMN IF NOT EXISTS "flow_type" TEXT NOT NULL DEFAULT 'onboarding',
  ADD COLUMN IF NOT EXISTS "trigger_condition" JSONB NOT NULL DEFAULT '{}';

-- Index for efficient flow selector queries (find best flow for org + type)
CREATE INDEX IF NOT EXISTS "onboarding_flows_organization_id_flow_type_idx"
  ON "onboarding_flows"("organization_id", "flow_type");

-- Existing rows are already correct: default 'onboarding' matches all legacy flows
