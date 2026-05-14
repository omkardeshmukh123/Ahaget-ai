-- Add targetSegments and targetPlans to onboarding_flows
ALTER TABLE "onboarding_flows" ADD COLUMN IF NOT EXISTS "target_segments" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "onboarding_flows" ADD COLUMN IF NOT EXISTS "target_plans"    TEXT[] NOT NULL DEFAULT '{}';
