-- Phase patch: add missing FK constraints + flow_id FK to proactive_messages
-- and end_user_id FK to upsell_attributions

-- proactive_messages: add FK for flow_id (was missing in 20260503000003)
ALTER TABLE "proactive_messages"
  ADD CONSTRAINT IF NOT EXISTS "proactive_messages_flow_id_fkey"
    FOREIGN KEY ("flow_id") REFERENCES "onboarding_flows"("id") ON DELETE CASCADE;

-- upsell_attributions: add FK for end_user_id (was missing in 20260503000004)
ALTER TABLE "upsell_attributions"
  ADD CONSTRAINT IF NOT EXISTS "upsell_attributions_end_user_id_fkey"
    FOREIGN KEY ("end_user_id") REFERENCES "end_users"("id") ON DELETE CASCADE;

-- trigger_rules: add updated_at trigger for auto-update (best practice)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_rules_updated_at'
  ) THEN
    CREATE TRIGGER trigger_rules_updated_at
      BEFORE UPDATE ON trigger_rules
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;
