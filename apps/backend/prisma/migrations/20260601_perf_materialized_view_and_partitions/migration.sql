-- ─── P3 Performance: materialized view + partition indexes ──────────────────
-- Adds:
--   1. org_monthly_usage materialized view  — replaces full-table COUNT scans
--   2. org_monthly_mtu  materialized view   — replaces full end_user COUNT scans
--   3. Partition-friendly composite indexes on the three high-volume tables
--
-- REFRESH STRATEGY (handled by the backend cron every 5 minutes):
--   REFRESH MATERIALIZED VIEW CONCURRENTLY org_monthly_usage;
--   REFRESH MATERIALIZED VIEW CONCURRENTLY org_monthly_mtu;
-- Both use CONCURRENTLY so reads are never blocked.

-- ─── 1. Monthly session-message counts per org ───────────────────────────────
CREATE MATERIALIZED VIEW IF NOT EXISTS org_monthly_usage AS
SELECT
  s.organization_id,
  DATE_TRUNC('month', sm.created_at)::date  AS month,
  COUNT(*) FILTER (WHERE sm.role = 'assistant') AS message_count,
  COUNT(*)                                       AS total_messages
FROM session_messages sm
JOIN user_onboarding_sessions s ON sm.session_id = s.id
GROUP BY s.organization_id, DATE_TRUNC('month', sm.created_at);

-- Unique index required for CONCURRENTLY refresh
CREATE UNIQUE INDEX IF NOT EXISTS org_monthly_usage_pk
  ON org_monthly_usage (organization_id, month);

-- ─── 2. Monthly tracked users per org ────────────────────────────────────────
CREATE MATERIALIZED VIEW IF NOT EXISTS org_monthly_mtu AS
SELECT
  organization_id,
  DATE_TRUNC('month', last_seen_at)::date AS month,
  COUNT(*)                                AS unique_users
FROM end_users
GROUP BY organization_id, DATE_TRUNC('month', last_seen_at);

CREATE UNIQUE INDEX IF NOT EXISTS org_monthly_mtu_pk
  ON org_monthly_mtu (organization_id, month);

-- ─── 3. Partition-friendly composite indexes ─────────────────────────────────
-- session_messages: include created_at so queries can use index-only scans
--   when filtering by org + month (via the join to user_onboarding_sessions)
CREATE INDEX IF NOT EXISTS session_messages_session_role_created
  ON session_messages (session_id, role, created_at DESC);

-- events: org + time range scans (e.g. analytics over last 30 days)
CREATE INDEX IF NOT EXISTS events_org_type_created
  ON events (organization_id, event_type, created_at DESC);

-- audit_logs: org + time range scans (compliance export, admin view)
CREATE INDEX IF NOT EXISTS audit_logs_org_action_created
  ON audit_logs (organization_id, action_type, created_at DESC);

-- mcp_call_logs: org + error filter + time
CREATE INDEX IF NOT EXISTS mcp_call_logs_org_error_created
  ON mcp_call_logs (organization_id, is_error, created_at DESC);
