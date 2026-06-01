-- CreateTable: team_invites
CREATE TABLE "team_invites" (
    "id"              TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "email"           TEXT NOT NULL,
    "token"           TEXT NOT NULL,
    "role"            TEXT NOT NULL DEFAULT 'member',
    "expires_at"      TIMESTAMP(3) NOT NULL,
    "accepted_at"     TIMESTAMP(3),
    "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "team_invites_token_key" ON "team_invites"("token");

-- CreateIndex
CREATE INDEX "team_invites_organization_id_idx" ON "team_invites"("organization_id");

-- AddForeignKey
ALTER TABLE "team_invites" ADD CONSTRAINT "team_invites_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
