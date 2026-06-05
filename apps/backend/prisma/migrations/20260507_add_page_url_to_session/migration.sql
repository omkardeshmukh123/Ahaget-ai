-- AlterTable
ALTER TABLE "user_onboarding_sessions" ADD COLUMN IF NOT EXISTS "page_url" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "user_onboarding_sessions_organization_id_page_url_idx" ON "user_onboarding_sessions"("organization_id", "page_url");
