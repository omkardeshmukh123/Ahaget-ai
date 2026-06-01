-- SSO: add WorkOS organization ID and email domain to organizations table
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS sso_workos_org_id TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS sso_domain TEXT;
