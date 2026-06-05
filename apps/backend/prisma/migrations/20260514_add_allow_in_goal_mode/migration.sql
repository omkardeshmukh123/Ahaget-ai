ALTER TABLE "mcp_connectors" ADD COLUMN IF NOT EXISTS "allow_in_goal_mode" BOOLEAN NOT NULL DEFAULT false;
