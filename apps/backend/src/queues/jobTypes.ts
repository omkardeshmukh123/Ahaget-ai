// ─── Job name constants ───────────────────────────────────────────────────────

export const JOBS = {
  FLOW_ALERTS:        'flow_alerts',
  KB_REFRESH:         'kb_refresh',
  PROACTIVE:          'proactive_messaging',
  SESSION_SWEEP:      'session_abandonment_sweep',
  DAILY_TRIGGERS:     'daily_triggers',
  EVAL_REGRESSION:    'eval_regression_check',
  MCP_TOOL_CALL:      'mcp_tool_call',
  USAGE_LIMIT_ALERT:  'usage_limit_alert',
  EVENTS_RETENTION:   'events_retention',
  AUTO_OPTIMIZE:      'auto_optimize',
} as const;

export type JobName = typeof JOBS[keyof typeof JOBS];

// ─── Job payload types ────────────────────────────────────────────────────────

export interface McpToolCallPayload {
  jobId:         string;       // stable correlation ID pushed to widget
  orgId:         string;
  sessionId?:    string;
  connectorId:   string;
  connectorName: string;
  serverUrl:     string;
  authType:      string;
  authValue:     string | null;
  mcpToolName:   string;
  args:          Record<string, unknown>;
  readOnly:      boolean;
  allowedTools:  string[];
}

export interface McpToolCallResult {
  jobId:   string;
  orgId:   string;
  result?: Array<{ type: string; text: string }>;
  error?:  string;
}
