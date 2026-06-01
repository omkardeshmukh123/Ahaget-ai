-- SSO: add WorkOS organization ID to organizations table
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS sso_workos_org_id TEXT;
