-- Make step_id nullable on session_messages so goal-mode turns (not tied to a
-- specific flow step) can be persisted for session replay.
ALTER TABLE "session_messages" ALTER COLUMN "step_id" DROP NOT NULL;
