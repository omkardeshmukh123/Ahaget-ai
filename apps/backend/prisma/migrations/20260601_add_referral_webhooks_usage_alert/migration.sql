-- Add columns missing from org migration history (were applied via db push)
-- Safe to run on existing DBs — all use IF NOT EXISTS / ADD COLUMN IF NOT EXISTS.

-- ─── organizations: usage-limit alert deduplication ──────────────────────────
ALTER TABLE "organizations"
  ADD COLUMN IF NOT EXISTS "limit_alert_80_sent_at"  TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "limit_alert_100_sent_at" TIMESTAMP(3);

-- ─── organizations: referral program ─────────────────────────────────────────
ALTER TABLE "organizations"
  ADD COLUMN IF NOT EXISTS "referral_code"    TEXT,
  ADD COLUMN IF NOT EXISTS "referred_by_code" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "organizations_referral_code_key"
  ON "organizations"("referral_code");

-- ─── referral_conversions ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "referral_conversions" (
    "id"               TEXT NOT NULL,
    "referring_org_id" TEXT NOT NULL,
    "referred_org_id"  TEXT NOT NULL,
    "referral_code"    TEXT NOT NULL,
    "credit_usd"       DOUBLE PRECISION,
    "credited_at"      TIMESTAMP(3),
    "status"           TEXT NOT NULL DEFAULT 'pending',
    "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_conversions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "referral_conversions_referring_org_id_idx"
  ON "referral_conversions"("referring_org_id");

CREATE INDEX IF NOT EXISTS "referral_conversions_referred_org_id_idx"
  ON "referral_conversions"("referred_org_id");

DO $$ BEGIN
  ALTER TABLE "referral_conversions"
    ADD CONSTRAINT "referral_conversions_referring_org_id_fkey"
    FOREIGN KEY ("referring_org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "referral_conversions"
    ADD CONSTRAINT "referral_conversions_referred_org_id_fkey"
    FOREIGN KEY ("referred_org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── webhooks ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "webhooks" (
    "id"             TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "event_type"     TEXT NOT NULL,
    "url"            TEXT NOT NULL,
    "secret"         TEXT NOT NULL,
    "enabled"        BOOLEAN NOT NULL DEFAULT true,
    "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhooks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "webhooks_organization_id_event_type_idx"
  ON "webhooks"("organization_id", "event_type");

DO $$ BEGIN
  ALTER TABLE "webhooks"
    ADD CONSTRAINT "webhooks_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
