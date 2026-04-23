-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "attribution" TEXT,
ADD COLUMN     "onboarding_complete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "onboarding_step" TEXT NOT NULL DEFAULT 'workspace',
ADD COLUMN     "website_url" TEXT;
