-- CreateTable
CREATE TABLE IF NOT EXISTS "playbook_configs" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "agent_name" TEXT NOT NULL DEFAULT 'AI Assistant',
    "tone" TEXT NOT NULL DEFAULT 'friendly',
    "language" TEXT NOT NULL DEFAULT 'en',
    "must_always_do" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "must_never_do" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "escalate_on_user_request" BOOLEAN NOT NULL DEFAULT true,
    "escalate_on_repeated_fail" BOOLEAN NOT NULL DEFAULT true,
    "escalate_on_billing_topics" BOOLEAN NOT NULL DEFAULT false,
    "escalation_webhook" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "playbook_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "playbook_configs_organization_id_key" ON "playbook_configs"("organization_id");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "playbook_configs" ADD CONSTRAINT "playbook_configs_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
