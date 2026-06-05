// Fetch wrapper — automatically attaches JWT from localStorage

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('oai_token');
}

interface FetchOptions extends RequestInit {
  auth?: boolean; // default true — attach JWT header
}

async function apiFetch<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const { auth = true, ...rest } = opts;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(rest.headers ?? {}),
  };

  if (auth) {
    const token = getToken();
    if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    const wsId = typeof window !== 'undefined' ? localStorage.getItem('ahaget_workspace_id') : null;
    if (wsId) (headers as Record<string, string>)['X-Workspace-Id'] = wsId;
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...rest, headers });
  } catch (networkErr) {
    const msg = `Network error — is the backend running? (${(networkErr as Error).message})`;
    console.error('[api]', path, msg);
    throw new Error(msg);
  }

  if (res.status === 401) {
    // Token expired — clear and redirect to login
    localStorage.removeItem('oai_token');
    localStorage.removeItem('oai_user');
    localStorage.removeItem('oai_org');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (res.status === 403 && body.code === 'PLAN_FEATURE_LOCKED' && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('plan:locked', {
        detail: { feature: body.feature, currentPlan: body.currentPlan, upgradeUrl: body.upgradeUrl },
      }));
    }
    const msg = body.error ?? body.message ?? `Request failed: ${res.status}`;
    console.error('[api]', res.status, path, msg);
    throw new Error(msg);
  }

  return res.json();
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export const api = {
  auth: {
    login: (email: string, password: string) =>
      apiFetch<{ token: string; user: User; organization: Org }>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        auth: false,
      }),
    register: (data: { name: string; email: string; password: string; orgName: string }) =>
      apiFetch<{ token: string; user: User; organization: Org }>('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
        auth: false,
      }),
    sendMagicLink: (email: string) =>
      apiFetch<{ sent: boolean }>('/api/v1/auth/magic-link/send', {
        method: 'POST',
        body: JSON.stringify({ email }),
        auth: false,
      }),
    verifyMagicLink: (token: string) =>
      apiFetch<{ token: string; user: User; organization: Org }>(
        `/api/v1/auth/magic-link/verify?token=${encodeURIComponent(token)}`,
        { auth: false },
      ),
  },

  team: {
    list: () => apiFetch<{ members: TeamMember[]; pendingInvites: PendingInvite[] }>('/api/v1/auth/team'),
    invite: (email: string, role: 'member' | 'admin' = 'member') =>
      apiFetch<{ sent: boolean }>('/api/v1/auth/invite', {
        method: 'POST',
        body: JSON.stringify({ email, role }),
      }),
    getInvite: (token: string) =>
      apiFetch<{ email: string; orgName: string; role: string }>(
        `/api/v1/auth/invite/${encodeURIComponent(token)}`,
        { auth: false },
      ),
    acceptInvite: (token: string, name: string, password: string) =>
      apiFetch<{ token: string; user: User; organization: Org }>('/api/v1/auth/accept-invite', {
        method: 'POST',
        body: JSON.stringify({ token, name, password }),
        auth: false,
      }),
    removeUser: (userId: string) =>
      apiFetch<{ removed: boolean }>(`/api/v1/auth/team/${userId}`, { method: 'DELETE' }),
    revokeInvite: (inviteId: string) =>
      apiFetch<{ revoked: boolean }>(`/api/v1/auth/invite/${inviteId}`, { method: 'DELETE' }),
  },

  conversations: {
    list: (params?: { limit?: number; offset?: number }) => {
      const q = new URLSearchParams({ limit: String(params?.limit ?? 20), offset: String(params?.offset ?? 0) });
      return apiFetch<{ conversations: Conversation[]; total: number; hasMore: boolean }>(`/api/v1/conversations?${q}`);
    },
    get: (id: string) => apiFetch<ConversationDetail>(`/api/v1/conversations/${id}`),
  },

  analytics: {
    overview: () => apiFetch<OverviewStats>('/api/v1/analytics/overview'),
    timeline: (days = 30) => apiFetch<TimelinePoint[]>(`/api/v1/analytics/timeline?days=${days}`),
    triggers: () => apiFetch<TriggerStat[]>('/api/v1/analytics/triggers'),
    intents: (days = 30, page?: string) => apiFetch<IntentsResponse>(`/api/v1/analytics/intents?days=${days}${page ? `&page=${encodeURIComponent(page)}` : ''}`),
    health: () => apiFetch<AgentHealth>('/api/v1/analytics/health'),
    eval: () => apiFetch<AgentEvalMetrics>('/api/v1/analytics/eval'),
    chokePoints: (days = 30) =>
      apiFetch<ChokePointsResponse>(`/api/v1/analytics/choke-points?days=${days}`),
    hasFirstSession: () => apiFetch<{ detected: boolean; count: number }>('/api/v1/analytics/has-first-session'),
  },

  config: {
    get: () => apiFetch<OrgConfig>('/api/v1/config'),
    updateAI: (customInstructions: string) =>
      apiFetch<{ updated: boolean }>('/api/v1/config/ai', {
        method: 'PUT',
        body: JSON.stringify({ customInstructions }),
      }),
    rotateKey: () => apiFetch<{ apiKey: string }>('/api/v1/config/rotate-key', { method: 'POST' }),
  },

  onboarding: {
    status: () => apiFetch<OnboardingStatus>('/api/v1/onboarding/status'),
    wizardState: () => apiFetch<{ wizardState: WizardState }>('/api/v1/onboarding/wizard-state'),
    updateWizard: (data: { websiteUrl?: string; attribution?: string; step?: string }) =>
      apiFetch<{ org: WizardState }>('/api/v1/onboarding/wizard', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    createWorkspace: (description: string) =>
      apiFetch<{ workspace: { id: string; name: string; apiKey: string } }>('/api/v1/onboarding/workspace', {
        method: 'POST',
        body: JSON.stringify({ description }),
      }),
    getSnippet: () => apiFetch<{ snippet: string; apiKey: string; domain: string }>('/api/v1/onboarding/snippet'),
    installStatus: () => apiFetch<{ installed: boolean; eventCount: number }>('/api/v1/onboarding/install-status'),
    complete: () => apiFetch<{ done: boolean }>('/api/v1/onboarding/complete', { method: 'POST' }),
  },

  checklist: {
    list: () => apiFetch<{ steps: ChecklistStep[] }>('/api/v1/checklist/admin'),
    create: (data: Omit<ChecklistStep, 'id' | 'organizationId' | 'createdAt'>) =>
      apiFetch<{ step: ChecklistStep }>('/api/v1/checklist/steps', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Omit<ChecklistStep, 'id' | 'organizationId' | 'createdAt'>>) =>
      apiFetch<{ step: ChecklistStep }>(`/api/v1/checklist/steps/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      apiFetch<{ deleted: boolean }>(`/api/v1/checklist/steps/${id}`, { method: 'DELETE' }),
  },

  followup: {
    getConfig: () => apiFetch<FollowUpConfig>('/api/v1/followup/config'),
    saveConfig: (data: Partial<FollowUpConfig>) =>
      apiFetch<{ saved: boolean }>('/api/v1/followup/config', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  billing: {
    status: () => apiFetch<BillingStatus>('/api/v1/billing/status'),
    checkout: (priceId: string) =>
      apiFetch<{ url: string }>('/api/v1/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ priceId }),
      }),
    portal: () =>
      apiFetch<{ url: string }>('/api/v1/billing/portal', { method: 'POST' }),
  },

  flow: {
    list: () => apiFetch<{ flows: OnboardingFlow[] }>('/api/v1/flow'),
    get: (id: string) => apiFetch<{ flow: OnboardingFlow }>(`/api/v1/flow/${id}`),
    listTemplates: () => apiFetch<{ templates: FlowTemplateMeta[] }>('/api/v1/flow/templates'),
    createFromTemplate: (templateId: string) =>
      apiFetch<{ flow: OnboardingFlow }>('/api/v1/flow/from-template', {
        method: 'POST',
        body: JSON.stringify({ templateId }),
      }),
    create: (name: string, description?: string, flowType?: string) =>
      apiFetch<{ flow: OnboardingFlow }>('/api/v1/flow', {
        method: 'POST',
        body: JSON.stringify({ name, description, flowType: flowType ?? 'onboarding' }),
      }),
    update: (id: string, data: Partial<Pick<OnboardingFlow, 'name' | 'description' | 'isActive' | 'triggerDelayMs' | 'urlPattern' | 'maxTriggersPerUser' | 'targetRoles' | 'targetSegments' | 'targetPlans'>>) =>
      apiFetch<{ updated: boolean }>(`/api/v1/flow/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      apiFetch<{ deleted: boolean }>(`/api/v1/flow/${id}`, { method: 'DELETE' }),
    createStep: (flowId: string, data: Omit<OnboardingStep, 'id' | 'flowId' | 'createdAt'>) =>
      apiFetch<{ step: OnboardingStep }>(`/api/v1/flow/${flowId}/steps`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateStep: (flowId: string, stepId: string, data: Partial<OnboardingStep>) =>
      apiFetch<{ step: OnboardingStep }>(`/api/v1/flow/${flowId}/steps/${stepId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    deleteStep: (flowId: string, stepId: string) =>
      apiFetch<{ deleted: boolean }>(`/api/v1/flow/${flowId}/steps/${stepId}`, { method: 'DELETE' }),
  },

  churn: {
    atRisk: (minScore?: number) => apiFetch<ChurnAtRiskResponse>(`/api/v1/churn/at-risk${minScore !== undefined ? `?minScore=${minScore}` : ''}`),
    summary: () => apiFetch<ChurnSummary>('/api/v1/churn/summary'),
  },

  autooptimize: {
    getSettings: () => apiFetch<AutoOptimizeSettings>('/api/v1/autooptimize/settings'),
    updateSettings: (data: Partial<Pick<AutoOptimizeSettings, 'enabled' | 'threshold' | 'minSessions'>>) =>
      apiFetch<AutoOptimizeSettings>('/api/v1/autooptimize/settings', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    run: () => apiFetch<AutoOptimizeRunResult>('/api/v1/autooptimize/run', { method: 'POST' }),
    log: (limit?: number) => apiFetch<{ logs: OptimizationLogEntry[]; total: number }>(`/api/v1/autooptimize/log${limit ? `?limit=${limit}` : ''}`),
  },

  benchmarks: {
    overview: () => apiFetch<BenchmarkOverview>('/api/v1/benchmarks/overview'),
    steps: () => apiFetch<{ flowName: string; steps: BenchmarkStep[] }>('/api/v1/benchmarks/steps'),
  },

  optimize: {
    flow: () => apiFetch<{ flowId: string; flowName: string; steps: OptimizeStep[] }>('/api/v1/optimize/flow'),
    suggest: (stepId: string) => apiFetch<OptimizeSuggestion>(`/api/v1/optimize/suggest/${stepId}`, { method: 'POST' }),
    apply: (stepId: string, prompt: string) =>
      apiFetch<{ applied: boolean; stepId: string }>(`/api/v1/optimize/apply/${stepId}`, {
        method: 'POST',
        body: JSON.stringify({ prompt }),
      }),
  },

  escalations: {
    list: (status?: string) =>
      apiFetch<{ tickets: EscalationTicket[]; counts: { open: number; in_progress: number; resolved: number } }>(
        `/api/v1/escalations${status ? `?status=${status}` : ''}`
      ),
    get: (id: string) => apiFetch<{ ticket: EscalationTicketDetail }>(`/api/v1/escalations/${id}`),
    update: (id: string, data: { status?: string; notes?: string }) =>
      apiFetch<{ ticket: EscalationTicket }>(`/api/v1/escalations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    createManual: (sessionId: string, notes?: string) =>
      apiFetch<{ ticket: { id: string; status: string; createdAt: string } }>('/api/v1/escalations/manual', {
        method: 'POST',
        body: JSON.stringify({ sessionId, notes }),
      }),
  },

  users: {
    list: (params?: { limit?: number; offset?: number }) => {
      const q = new URLSearchParams({ limit: String(params?.limit ?? 50), offset: String(params?.offset ?? 0) });
      return apiFetch<{ users: EndUserSummary[]; total: number; hasMore: boolean }>(`/api/v1/users?${q}`);
    },
    history: (userId: string) => apiFetch<UserHistoryDetail>(`/api/v1/users/${userId}/history`),
  },

  flowHealth: {
    list: () => apiFetch<FlowHealthResponse>('/api/v1/flow/health'),
  },

  experiments: {
    list: () => apiFetch<{ experiments: FlowExperiment[] }>('/api/v1/experiments'),
    create: (data: { name: string; controlFlowId: string; variantFlowId: string; trafficSplit: number }) =>
      apiFetch<{ experiment: FlowExperiment }>('/api/v1/experiments', {
        method: 'POST', body: JSON.stringify(data),
      }),
    results: (id: string) => apiFetch<ExperimentResults>(`/api/v1/experiments/${id}/results`),
    update: (id: string, data: { status?: string; winnerId?: string | null }) =>
      apiFetch<{ experiment: FlowExperiment }>(`/api/v1/experiments/${id}`, {
        method: 'PUT', body: JSON.stringify(data),
      }),
  },

  alertConfig: {
    get: () => apiFetch<AlertConfig>('/api/v1/config/alerts'),
    update: (data: Partial<AlertConfig>) =>
      apiFetch<{ saved: boolean }>('/api/v1/config/alerts', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  kb: {
    list: () => apiFetch<{ articles: KnowledgeArticle[] }>('/api/v1/kb'),
    get: (id: string) => apiFetch<{ article: KnowledgeArticle & { content: string } }>(`/api/v1/kb/${id}`),
    create: (data: { title: string; content: string; tags?: string[]; pageUrlPattern?: string }) =>
      apiFetch<{ article: KnowledgeArticle }>('/api/v1/kb', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    ingestUrl: (data: { url: string; pageUrlPattern?: string; tags?: string[] }) =>
      apiFetch<{ article: KnowledgeArticle; message: string }>('/api/v1/kb/ingest-url', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    ingestFile: (formData: FormData) =>
      // multipart — bypass default Content-Type so browser sets boundary
      (async () => {
        const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
        const token = typeof window !== 'undefined' ? localStorage.getItem('oai_token') : null;
        const res = await fetch(`${API_URL}/api/v1/kb/ingest-file`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });
        if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error ?? `HTTP ${res.status}`); }
        return res.json() as Promise<{ article: KnowledgeArticle }>;
      })(),
    sync: (id: string) => apiFetch<{ syncing: boolean }>(`/api/v1/kb/${id}/sync`, { method: 'POST' }),
    update: (id: string, data: { title?: string; content?: string; tags?: string[]; pageUrlPattern?: string }) =>
      apiFetch<{ article: KnowledgeArticle }>(`/api/v1/kb/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      apiFetch<{ deleted: boolean }>(`/api/v1/kb/${id}`, { method: 'DELETE' }),
  },

  integrations: {
    list: () => apiFetch<{ integrations: IntegrationConfig[] }>('/api/v1/integrations'),
    upsert: (type: string, data: { credentials: Record<string, string>; enabled?: boolean; settings?: Record<string, unknown> }) =>
      apiFetch<{ integration: IntegrationConfig }>('/api/v1/integrations', {
        method: 'POST',
        body: JSON.stringify({ type, ...data }),
      }),
    toggle: (type: string, enabled: boolean) =>
      apiFetch<{ updated: boolean }>(`/api/v1/integrations/${type}/toggle`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled }),
      }),
    remove: (type: string) =>
      apiFetch<{ deleted: boolean }>(`/api/v1/integrations/${type}`, { method: 'DELETE' }),
    test: (type: string) =>
      apiFetch<{ success: boolean; message: string }>(`/api/v1/integrations/${type}/test`, { method: 'POST' }),
  },

  insights: {
    list: () => apiFetch<InsightsResponse>('/api/v1/analytics/insights'),
  },

  activation: {
    overview: () => apiFetch<ActivationOverview>('/api/v1/activation/overview'),
    funnel: (flowId?: string) => {
      const qs = flowId ? `?flowId=${encodeURIComponent(flowId)}` : '';
      return apiFetch<{ flowName: string | null; totalSessions: number; funnel: FunnelStep[] }>(`/api/v1/activation/funnel${qs}`);
    },
    timeline: (days = 30) => apiFetch<{ timeline: ActivationTimeline[] }>(`/api/v1/activation/timeline?days=${days}`),
    trend: () => apiFetch<ActivationTrend>('/api/v1/activation/trend'),
    flows: () => apiFetch<{ flows: FlowActivationStat[] }>('/api/v1/activation/flows'),
    flowTimeline: (flowId: string, days = 30) =>
      apiFetch<{ flowId: string; flowName: string; days: number; timeline: FlowTimeline[] }>(
        `/api/v1/activation/flow-timeline?flowId=${encodeURIComponent(flowId)}&days=${days}`
      ),
    adoption: (flowId: string) =>
      apiFetch<AdoptionStats>(`/api/v1/activation/adoption?flowId=${encodeURIComponent(flowId)}`),
  },

  sessions: {
    list: (params?: {
      limit?: number;
      offset?: number;
      status?: 'active' | 'completed' | 'abandoned';
      q?: string;
      from?: string;
      to?: string;
    }) => {
      const qs = new URLSearchParams();
      if (params?.limit)  qs.set('limit',  String(params.limit));
      if (params?.offset) qs.set('offset', String(params.offset));
      if (params?.status) qs.set('status', params.status);
      if (params?.q)      qs.set('q',      params.q);
      if (params?.from)   qs.set('from',   params.from);
      if (params?.to)     qs.set('to',     params.to);
      return apiFetch<{ sessions: SessionListItem[]; total: number; limit: number; offset: number }>(`/api/v1/sessions?${qs}`);
    },
    get: (id: string) => apiFetch<{ session: SessionDetail }>(`/api/v1/sessions/${id}`),
  },

  mcp: {
    list: () => apiFetch<{ connectors: McpConnector[] }>('/api/v1/mcp'),
    create: (data: {
      name: string; description?: string; connectorType?: 'mcp' | 'rest';
      serverUrl: string; authType: 'none' | 'bearer' | 'api_key';
      authValue?: string; enabled?: boolean;
      allowedTools?: string[]; readOnly?: boolean;
    }) =>
      apiFetch<{ connector: McpConnector }>('/api/v1/mcp', {
        method: 'POST', body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<{
      name: string; description: string; connectorType: 'mcp' | 'rest';
      serverUrl: string; authType: string; authValue: string;
      enabled: boolean; allowedTools: string[]; readOnly: boolean;
      allowInGoalMode: boolean;
    }>) =>
      apiFetch<{ connector: McpConnector }>(`/api/v1/mcp/${id}`, {
        method: 'PUT', body: JSON.stringify(data),
      }),
    delete:  (id: string) => apiFetch<{ deleted: boolean }>(`/api/v1/mcp/${id}`, { method: 'DELETE' }),
    test:    (id: string) => apiFetch<{ ok: boolean; tools: Array<{ name: string; description: string }>; error?: string; connectorType?: string }>(`/api/v1/mcp/${id}/test`, { method: 'POST' }),
    listEndpoints:  (id: string) => apiFetch<{ endpoints: RestApiEndpoint[] }>(`/api/v1/mcp/${id}/endpoints`),
    addEndpoint:    (id: string, data: { method: string; urlPattern: string; description?: string; readOnly?: boolean }) =>
      apiFetch<{ endpoint: RestApiEndpoint }>(`/api/v1/mcp/${id}/endpoints`, { method: 'POST', body: JSON.stringify(data) }),
    deleteEndpoint: (id: string, endpointId: string) =>
      apiFetch<{ deleted: boolean }>(`/api/v1/mcp/${id}/endpoints/${endpointId}`, { method: 'DELETE' }),
    listCalls: (params?: { connectorId?: string; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.limit) qs.set('limit', String(params.limit));
      if (params?.connectorId) qs.set('connectorId', params.connectorId);
      const query = qs.toString() ? `?${qs.toString()}` : '';
      return apiFetch<{ calls: McpCallLog[] }>(`/api/v1/mcp/calls${query}`);
    },
    callTool: (connectorId: string, toolName: string, args: Record<string, unknown>) =>
      apiFetch<{ result: Array<{ type: string; text: string }>; isError: boolean; latencyMs: number }>(
        `/api/v1/mcp/${connectorId}/call`,
        { method: 'POST', body: JSON.stringify({ toolName, args }) }
      ),
  },

  audit: {
    list: (params?: { limit?: number; offset?: number }) => {
      const q = new URLSearchParams({ limit: String(params?.limit ?? 100), offset: String(params?.offset ?? 0) });
      return apiFetch<{ logs: AuditLogEntry[]; total: number }>(`/api/v1/sessions/audit?${q}`);
    },
  },

  failures: {
    list: () => apiFetch<{
      failures: Array<{
        sessionId: string; userId: string; flowName: string;
        completedSteps: number; totalSteps: number; progressPct: number;
        lastActiveMinutesAgo: number; type: 'dropped_off';
      }>;
      escalations: Array<{
        ticketId: string; userId: string; flowName: string;
        reason: string; createdAt: string; status: string;
      }>;
      summary: { droppedOff: number; openEscalations: number };
    }>('/api/v1/failures'),
  },

  expansion: {
    dashboard: (period = '30d') =>
      apiFetch<{
        stats: {
          totalSuggestions: number;
          confirmed: number;
          pending: number;
          attributedMrr: number;
          conversionRate: number;
          mrrByPlan: Record<string, number>;
        };
        recent: Array<{
          id: string;
          status: string;
          targetPlan: string;
          mrr: number | null;
          suggestedAt: string;
          confirmedAt: string | null;
          flow: { name: string; targetPlan: string | null } | null;
          endUser: { externalId: string | null; email: string | null } | null;
        }>;
        period: string;
      }>(`/api/v1/expansion?period=${period}`),
    flows: () =>
      apiFetch<{
        flows: Array<{
          id: string; name: string; targetPlan: string | null;
          upgradeUrl: string | null; mrrPerConversion: number | null;
          isActive: boolean; createdAt: string;
          totalSuggestions: number; confirmed: number;
          conversionRate: number; attributedMrr: number;
        }>;
      }>('/api/v1/expansion/flows'),
    updateFlow: (id: string, data: { targetPlan?: string; upgradeUrl?: string; mrrPerConversion?: number }) =>
      apiFetch<{ flow: OnboardingFlow }>(`/api/v1/expansion/flows/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  proactive: {
    list: (limit = 50) =>
      apiFetch<{
        messages: Array<{
          id: string; channel: string; subject: string | null;
          bodySnippet: string | null; status: string;
          sentAt: string; openedAt: string | null; clickedAt: string | null;
          endUser: { externalId: string | null; email: string | null } | null;
          flow: { id: string; name: string; flowType: string } | null;
        }>;
        stats: { total: number; openRate: number; clickRate: number };
      }>(`/api/v1/proactive?limit=${limit}`),
    send: (data: { endUserId: string; flowId: string; subject?: string; bodySnippet?: string; channel?: 'in_app' | 'email' }) =>
      apiFetch<{ message: { id: string } }>('/api/v1/proactive/send', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  triggerRules: {
    list: () =>
      apiFetch<{
        rules: Array<{
          id: string; flowId: string; triggerType: string; isActive: boolean;
          urlPattern: string | null; firstTimeOnly: boolean;
          daysThreshold: number | null; eventName: string | null;
          usageMetric: string | null; usagePercent: number | null;
          featureSlug: string | null; createdAt: string;
          flow: { id: string; name: string; flowType: string };
        }>;
      }>('/api/v1/triggers'),
    create: (data: {
      flowId: string; triggerType: string; isActive?: boolean;
      urlPattern?: string; firstTimeOnly?: boolean; daysThreshold?: number;
      eventName?: string; usageMetric?: string; usagePercent?: number; featureSlug?: string;
    }) => apiFetch<{ rule: { id: string } }>('/api/v1/triggers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: Record<string, unknown>) =>
      apiFetch<{ updated: boolean }>(`/api/v1/triggers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    remove: (id: string) =>
      apiFetch<{ deleted: boolean }>(`/api/v1/triggers/${id}`, { method: 'DELETE' }),
  },

  lifecycleAnalytics: {
    get: () => apiFetch<{
      stages: Record<string, { started: number; completed: number; completionRate: number }>;
      proactive: { total: number; openRate: number; clickRate: number };
      expansion: { totalMrr: number; conversionRate: number; confirmedCount: number };
      activeUsers: number;
      period: string;
    }>('/api/v1/analytics/lifecycle'),
  },

  interfaceMap: {
    listSnapshots: () =>
      apiFetch<{ snapshots: InterfaceSnapshot[] }>('/api/v1/interface-map/snapshots'),
    getSnapshot: (id: string) =>
      apiFetch<{ snapshot: InterfaceSnapshot & { elements: InterfaceElement[] } }>(
        `/api/v1/interface-map/snapshots/${id}`
      ),
    capture: (data: {
      url: string; title: string; stateLabel?: string; framework?: string;
      elements: Array<{
        tag: string; selector: string; text: string; elementType?: string;
        inputType?: string; ariaLabel?: string; placeholder?: string;
        name?: string; dataTestId?: string; role?: string;
        classes?: string[]; rect?: { x: number; y: number; w: number; h: number };
      }>;
    }) =>
      apiFetch<{ snapshot: InterfaceSnapshot }>('/api/v1/interface-map/capture', {
        method: 'POST', body: JSON.stringify(data),
      }),
    annotateElement: (
      id: string,
      data: {
        customLabel?: string; customDescription?: string;
        businessRule?: string; isSensitive?: boolean; elementType?: string;
      }
    ) =>
      apiFetch<{ element: InterfaceElement }>(`/api/v1/interface-map/elements/${id}`, {
        method: 'PATCH', body: JSON.stringify(data),
      }),
    archiveSnapshot: (id: string) =>
      apiFetch<{ archived: boolean }>(`/api/v1/interface-map/snapshots/${id}`, { method: 'DELETE' }),
  },

  contextSources: {
    list: () => apiFetch<{ sources: ContextSource[] }>('/api/v1/context-sources'),
    create: (data: {
      name: string; description?: string; enabled?: boolean;
      connectorId?: string | null; mcpToolName?: string | null;
      mcpToolArgs?: Record<string, unknown>;
      restUrl?: string | null; restMethod?: string;
      contextKey: string; allowedFields?: string[];
    }) => apiFetch<{ source: ContextSource }>('/api/v1/context-sources', {
      method: 'POST', body: JSON.stringify(data),
    }),
    update: (id: string, data: Partial<{
      name: string; description: string; enabled: boolean;
      connectorId: string | null; mcpToolName: string | null;
      mcpToolArgs: Record<string, unknown>;
      restUrl: string | null; restMethod: string;
      contextKey: string; allowedFields: string[];
    }>) => apiFetch<{ source: ContextSource }>(`/api/v1/context-sources/${id}`, {
      method: 'PUT', body: JSON.stringify(data),
    }),
    delete: (id: string) => apiFetch<{ deleted: boolean }>(`/api/v1/context-sources/${id}`, { method: 'DELETE' }),
    test: (id: string) => apiFetch<{ raw: unknown; filtered: unknown; error?: string }>(`/api/v1/context-sources/${id}/test`, { method: 'POST' }),
  },

  playbook: {
    get: () => apiFetch<{ config: PlaybookConfig }>('/api/v1/config/playbook'),
    update: (data: Partial<Omit<PlaybookConfig, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>>) =>
      apiFetch<{ config: PlaybookConfig }>('/api/v1/config/playbook', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  branding: {
    get: () => apiFetch<BrandingConfig>('/api/v1/config/branding'),
    update: (data: Partial<BrandingConfig>) =>
      apiFetch<BrandingConfig>('/api/v1/config/branding', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  webhooks: {
    list: () => apiFetch<Webhook[]>('/api/v1/webhooks'),
    create: (data: { eventType: string; url: string }) =>
      apiFetch<Webhook & { secret: string }>('/api/v1/webhooks', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    toggle: (id: string, enabled: boolean) =>
      apiFetch<Webhook>(`/api/v1/webhooks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled }),
      }),
    delete: (id: string) =>
      apiFetch<void>(`/api/v1/webhooks/${id}`, { method: 'DELETE' }),
    test: (id: string) =>
      apiFetch<{ ok: boolean; status?: number; error?: string }>(`/api/v1/webhooks/${id}/test`, { method: 'POST' }),
  },
};


// ─── Types ───────────────────────────────────────────────────────────────────

export interface PlaybookConfig {
  id?: string;
  organizationId?: string;
  agentName: string;
  tone: 'friendly' | 'formal' | 'concise' | 'custom';
  language: string;
  mustAlwaysDo: string[];
  mustNeverDo: string[];
  escalateOnUserRequest: boolean;
  escalateOnRepeatedFail: boolean;
  escalateOnBillingTopics: boolean;
  escalationWebhook: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Webhook {
  id: string;
  eventType: string;
  url: string;
  enabled: boolean;
  createdAt: string;
}

export interface BrandingConfig {
  primaryColor: string;
  gradFrom: string;
  gradTo: string;
  position: 'bottom-right' | 'bottom-left';
  idleThreshold: number;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export interface TeamMember {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface PendingInvite {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  expiresAt: string;
}

export interface Org {
  id: string;
  name: string;
  apiKey: string;
  planType: string;
  onboardingComplete?: boolean;
  onboardingStep?: string;
}

export interface OrgConfig extends Org {
  customInstructions: string | null;
}

export interface WizardState {
  websiteUrl: string | null;
  attribution: string | null;
  onboardingStep: string;
  onboardingComplete: boolean;
  customInstructions: string | null;
  apiKey: string;
}

export interface Conversation {
  id: string;
  status: string;
  triggeredBy: string | null;
  startedAt: string;
  endedAt: string | null;
  messageCount: number;
  endUser: { id: string; externalId: string | null; metadata: Record<string, unknown> };
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  tokensUsed: number;
}

export interface ConversationDetail extends Omit<Conversation, 'messageCount'> {
  messages: Message[];
  endUser: { id: string; externalId: string | null; metadata: Record<string, unknown>; firstSeenAt: string; lastSeenAt: string };
}

export interface OverviewStats {
  totalConversations: number;
  conversationsThisWeek: number;
  activeUsers: number;
  avgMessagesPerConv: number;
  totalMessages: number;   // Fix #1: exact count from backend
  conversionRate: number;
}

export interface TimelinePoint {
  date: string;
  conversations: number;
}

export interface TriggerStat {
  trigger: string;
  count: number;
}

export interface BillingPlan {
  key: string;
  name: string;
  price: number;
  annualMonthlyPrice: number;
  limit: number;
  agentLimit: number;
  mtuLimit: number;
  features: string[];
  current: boolean;
}

export interface ChecklistStep {
  id: string;
  organizationId: string;
  label: string;
  description: string;
  order: number;
  completionEvent: string | null;
  isRequired: boolean;
  createdAt: string;
}

export interface FollowUpConfig {
  emailEnabled: boolean;
  slackWebhookUrl: string | null;
  whatsappEnabled: boolean;
  twilioAccountSid: string | null;
  twilioAuthToken: string | null;
  twilioFromNumber: string | null;
  followUpDelayMins: number;
  emailSubject: string;
  emailBody: string;
}

export interface WidgetChecklistStep {
  id: string;
  label: string;
  description: string;
  done: boolean;
}

export interface OnboardingStatus {
  steps: WidgetChecklistStep[];
  completedCount: number;
  totalCount: number;
  allDone: boolean;
}

export interface BillingStatus {
  plan: string;
  planName: string;
  price: number;
  features: string[];
  monthlyMessageLimit: number;
  messagesUsedThisMonth: number;
  mtuLimit: number;       // 0 = unlimited
  mtuUsed: number;
  agentLimit: number;     // 0 = unlimited
  agentsUsed: number;
  subscriptionStatus: string;
  currentPeriodEnd: string | null;
  hasStripeCustomer: boolean;
  plans: BillingPlan[];
}

export interface ContextSource {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  connectorId: string | null;
  mcpToolName: string | null;
  mcpToolArgs: Record<string, unknown>;
  restUrl: string | null;
  restMethod: string;
  contextKey: string;
  allowedFields: string[];
  createdAt: string;
  updatedAt: string;
}

export interface McpConnector {
  id: string;
  name: string;
  description: string;
  connectorType: 'mcp' | 'rest';
  serverUrl: string;
  authType: 'none' | 'bearer' | 'api_key';
  enabled: boolean;
  allowedTools: string[];
  readOnly: boolean;
  allowInGoalMode: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface McpCallLog {
  id:            string;
  connectorName: string;
  toolName:      string;
  callType:      'mcp' | 'rest';
  isError:       boolean;
  latencyMs:     number | null;
  createdAt:     string;
  sessionId:     string | null;
}

export interface RestApiEndpoint {
  id: string;
  connectorId: string;
  method: string;
  urlPattern: string;
  description: string;
  readOnly: boolean;
  createdAt: string;
}

export interface OnboardingStep {
  id: string;
  flowId: string;
  order: number;
  title: string;
  intent: string;
  description: string;
  aiPrompt: string;
  smartQuestions: string[];
  actionType: string | null;
  actionConfig: Record<string, unknown>;
  allowedActions: string[]; // [] = all; ['highlight','navigate'] = read-only
  completionEvent: string | null;
  isMilestone: boolean;
  targetUrl: string | null;
  createdAt: string;
}

export interface OnboardingFlow {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  flowType: string; // onboarding | adoption | upsell | retention | support
  triggerCondition: Record<string, unknown>;
  triggerDelayMs: number;
  urlPattern: string;
  maxTriggersPerUser: number;
  targetRoles: string[];
  targetSegments: string[];
  targetPlans: string[];
  createdAt: string;
  updatedAt: string;
  steps: OnboardingStep[];
}

export interface ActivationOverview {
  totalSessions: number;
  completedSessions: number;
  completionRate: number;
  firstValueCount: number;
  avgTimeToValueMins: number | null;
}

export interface FunnelStep {
  stepId: string;
  stepTitle: string;
  order: number;
  isMilestone: boolean;
  started: number;
  completed: number;
  dropOff: number;
  dropOffRate: number;
  aiAssistedRate: number;
  avgTimeSecs: number | null;
}

export interface ActivationTimeline {
  date: string;
  started: number;
  completed: number;
  firstValue: number;
}

export interface FlowTimeline {
  date: string;
  started: number;
  completed: number;
  firstValue: number;
  completionRate: number;
}

export interface AdoptionStats {
  flowId: string;
  flowName: string;
  flowType: string;
  featureSlug: string | null;
  totalSessions: number;
  adoptedCount: number;
  adoptionRate: number;
}

export interface FlowActivationStat {
  flowId: string;
  flowName: string;
  flowType: string;
  isActive: boolean;
  totalSessions: number;
  completedSessions: number;
  completionRate: number;
  worstStepTitle: string | null;
  worstDropOffRate: number;
}

export interface ChurnUser {
  sessionId: string;
  userId: string | null;
  userMetadata: Record<string, unknown>;
  flowName: string;
  status: string;
  stepsCompleted: number;
  totalSteps: number;
  progressFraction: number;
  lastActiveAt: string;
  startedAt: string;
  firstSeenAt: string;
  currentStepId: string | null;
  score: number;
  risk: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
  recommendation: string;
}

export interface ChurnAtRiskResponse {
  users: ChurnUser[];
  breakdown: { critical: number; high: number; medium: number; total: number };
}

export interface ChurnSummary {
  total: number;
  breakdown: { critical: number; high: number; medium: number; low: number };
  atRisk: number;
}

export interface AutoOptimizeSettings {
  enabled: boolean;
  threshold: number;
  minSessions: number;
  lastRunAt: string | null;
}

export interface AutoOptimizeRunResult {
  stepsScanned: number;
  stepsOptimized: number;
  stepsSkipped: number;
  optimized: Array<{
    stepId: string;
    stepTitle: string;
    completionRateBefore: number;
    previousPrompt: string | null;
    newPrompt: string;
    reason: string;
  }>;
}

export interface OptimizationLogEntry {
  id: string;
  stepId: string;
  stepTitle: string;
  stepIntent: string;
  triggeredBy: string;
  completionRateBefore: number | null;
  previousPrompt: string | null;
  newPrompt: string;
  reason: string;
  appliedAt: string;
}

export interface ActivationTrend {
  thisWeek: { sessions: number; completed: number; firstValue: number; completionRate: number; firstValueRate: number };
  lastWeek: { sessions: number; completed: number; firstValue: number; completionRate: number; firstValueRate: number };
  deltas: { sessions: number; completionRate: number; firstValueRate: number };
}

export interface BenchmarkOverview {
  org: {
    totalSessions: number;
    completedSessions: number;
    completionRate: number | null;
    firstValueCount: number;
    avgTimeToValueMins: number | null;
    aiAssistRate: number;
  };
  industry: {
    completionRate: number;
    timeToValueMins: number;
    dataPoints: number;
    orgCount: number;
  };
  score: number;
  dataMaturity: 'early' | 'growing' | 'mature';
}

export interface BenchmarkStep {
  stepId: string;
  stepTitle: string;
  intent: string;
  order: number;
  isMilestone: boolean;
  orgStarted: number;
  orgCompleted: number;
  orgDropOffRate: number | null;
  industryDropOffRate: number;
  delta: number | null;
  status: 'good' | 'average' | 'poor' | 'no_data';
  recommendation: string | null;
}

export interface OptimizeStep {
  stepId: string;
  stepTitle: string;
  intent: string;
  order: number;
  isMilestone: boolean;
  currentPrompt: string | null;
  latestSnapshot: string | null;
  stats: {
    total: number;
    completed: number;
    dropped: number;
    completionRate: number | null;
    avgMessages: number | null;
    avgTimeSecs: number | null;
    dropReasons: Record<string, number>;
  };
  health: number;
  needsOptimization: boolean;
}

export interface OptimizeSuggestion {
  stepId: string;
  stepTitle: string;
  currentPrompt: string | null;
  suggestedPrompt: string;
  changes: string[];
  expectedImpact: string;
  reasoning: string;
  stats: { total: number; completed: number; completionRate: number; avgMessages: number };
}

export interface IntegrationConfig {
  id: string;
  type: string; // segment | mixpanel | hubspot | webhook
  enabled: boolean;
  credentials: Record<string, string>; // masked values returned from API
  settings: Record<string, unknown>;
  lastFiredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EscalationTicket {
  id: string;
  status: 'open' | 'in_progress' | 'resolved';
  trigger: 'agent_detected' | 'user_requested' | 'manual';
  reason: string;
  agentMessage: string;
  notes: string | null;
  userId: string | null;
  userMetadata: Record<string, unknown>;
  createdAt: string;
  resolvedAt: string | null;
}

export interface EscalationTicketDetail extends EscalationTicket {
  context: {
    userId: string | null;
    userMetadata: Record<string, unknown>;
    flowName: string;
    stepTitle: string;
    collectedData: Record<string, unknown>;
    recentMessages: Array<{ role: string; content: string }>;
  };
  userFirstSeen: string;
  sessionId: string;
  stepId: string | null;
}

export interface EndUserSummary {
  id: string;
  externalId: string | null;
  metadata: Record<string, unknown>;
  firstSeenAt: string;
  lastSeenAt: string;
  totalSessions: number;
  completedSessions: number;
  latestSession: {
    flowName: string;
    status: string;
    stepsCompleted: number;
    lastActiveAt: string;
  } | null;
}

export interface UserSessionStep {
  stepId: string;
  title: string;
  order: number;
  intent: string;
  status: string;
  completedAt: string | null;
  timeSpentMs: number;
  messagesCount: number;
  aiAssisted: boolean;
}

export interface UserSessionHistory {
  sessionId: string;
  flowId: string;
  flowName: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  lastActiveAt: string;
  firstValueAt: string | null;
  collectedData: Record<string, unknown>;
  steps: UserSessionStep[];
}

export interface UserHistoryDetail {
  user: {
    id: string;
    externalId: string | null;
    metadata: Record<string, unknown>;
    firstSeenAt: string;
    lastSeenAt: string;
  };
  sessions: UserSessionHistory[];
  mergedCollectedData: Record<string, unknown>;
  totalSessions: number;
  completedSessions: number;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  content?: string;            // omitted in list view, present in get/:id
  tags: string[];
  sourceType: 'manual' | 'url' | 'file' | 'sitemap';
  sourceUrl: string | null;
  pageUrlPattern: string | null; // substring match against user's current URL; null = all pages
  syncStatus: 'idle' | 'syncing' | 'error';
  syncedAt: string | null;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}


export interface HealEntry {
  originalSelector: string;
  status: 'healthy' | 'healing' | 'failing';
  healCount: number;
  failCount: number;
  lastSeen: string;
  actionType: string | null;
  page: string;
  strategies: string[];
  suggestedSelector: string | null;
  step: { id: string; title: string; flowId: string; flowName: string } | null;
}

export interface FlowHealthResponse {
  entries: HealEntry[];
  total: number;
  since: string;
}

export interface FlowExperiment {
  id: string;
  name: string;
  status: 'running' | 'paused' | 'concluded';
  trafficSplit: number;
  winnerId: string | null;
  startedAt: string;
  concludedAt: string | null;
  controlFlow: { id: string; name: string };
  variantFlow:  { id: string; name: string };
  controlSessions?: number;
  variantSessions?:  number;
}

export interface ExperimentArmStats {
  total: number;
  completed: number;
  completionRate: number;
  avgTimeMs: number | null;
  stepStats: Array<{ stepId: string; title: string; order: number; completionRate: number }>;
}

export interface ExperimentResults {
  experiment: FlowExperiment;
  control: ExperimentArmStats;
  variant:  ExperimentArmStats;
  significant: boolean;
  zScore: number;
  lift: number | null;
}

export interface AlertConfig {
  selectorAlertEnabled: boolean;
  selectorAlertWebhook: string | null;
}

export interface IntentQuestion {
  raw: string;
  count: number;
  lastSeen: string;
  intent: 'how_to' | 'stuck' | 'navigation' | 'question' | 'other';
  pageUrl: string | null;
}

export interface IntentsResponse {
  questions: IntentQuestion[];
  categorySummary: Record<string, number>;
  totalMessages: number;
  days: number;
  pages: { url: string; questionCount: number }[];
}

export interface FlowTemplateMeta {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  benchmarkTimeToValueMins: number;
  stepCount: number;
}

export interface SessionListItem {
  id: string;
  status: 'active' | 'completed' | 'abandoned';
  startedAt: string;
  completedAt: string | null;
  lastActiveAt: string;
  firstValueAt: string | null;
  durationMs: number;
  stepsCompleted: number;
  dropStepId: string | null;
  dropReason: string | null;
  flow: { id: string; name: string; flowType: string };
  endUser: { id: string; externalId: string | null; metadata: Record<string, unknown> };
}

export interface SessionStepDetail {
  stepId: string;
  order: number;
  title: string;
  intent: string;
  isMilestone: boolean;
  actionType: string | null;
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  startedAt: string | null;
  completedAt: string | null;
  timeSpentMs: number;
  messagesCount: number;
  aiAssisted: boolean;
  attempts: number;
  outcome: string | null;
  dropReason: string | null;
}

export interface SessionMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actionType: string | null;
  stepId: string | null;
  feedback: number | null;
  createdAt: string;
}

export interface SessionDetail {
  id: string;
  status: 'active' | 'completed' | 'abandoned';
  startedAt: string;
  completedAt: string | null;
  lastActiveAt: string;
  firstValueAt: string | null;
  collectedData: Record<string, unknown>;
  liveContextSnapshot: string | null;
  escalationTicketId: string | null;
  flow: { id: string; name: string };
  endUser: {
    id: string;
    externalId: string | null;
    metadata: Record<string, unknown>;
    firstSeenAt: string;
    lastSeenAt: string;
  };
  steps: SessionStepDetail[];
  messages: SessionMessage[];
}

export interface AgentHealthSession {
  id: string;
  status: 'active' | 'completed' | 'abandoned';
  flowName: string;
  userId: string | null;
  startedAt: string;
  completedAt: string | null;
  lastActiveAt: string;
}

export interface AgentHealth {
  status: 'green' | 'yellow' | 'red' | 'unknown';
  successRate: number | null;
  totalSessions: number;
  completedSessions: number;
  avgResponseMs: number | null;
  windowHours: number;
  sessions: AgentHealthSession[];
}

export interface AgentEvalMetrics {
  window: '7d';
  totalTurns: number;
  firstTurnCompletionRate: number | null;
  firstTurnCompletionAlert: boolean;
  p95LatencyMs: number | null;
  avgLatencyMs: number | null;
  selectorSuccessRate: number | null;
  kbHitRate: number | null;
}

export interface Insight {
  id: string;
  type: 'pain_point' | 'knowledge_gap' | 'navigation_confusion' | 'frequent_question' | 'low_engagement';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  count: number;
  examples: string[];
  detectedAt: string;
}

export interface InsightsResponse {
  insights: Insight[];
  generatedAt: string;
  days: number;
}

export interface ChokePoint {
  rank: number;
  step_id: string;
  step_title: string;
  flow_id: string;
  flow_name: string;
  action_type: string | null;
  field_choke: boolean;
  frequency: number;
  drop_rate: number;
  avg_attempts: number;
  avg_time_stuck_secs: number;
  neg_feedback_rate: number;
  severity_score: number;
  severity_label: 'critical' | 'high' | 'medium' | 'low';
  example_messages: string[];
  trend: 'worsening' | 'improving' | 'stable' | 'new';
}

export interface PageSummary {
  url: string;
  sessions: number;
}

export interface ChokePointsResponse {
  choke_points: ChokePoint[];
  page_summary: PageSummary[];
  generated_at: string;
  days: number;
}

export interface AuditLogEntry {
  id: string;
  sessionId: string | null;
  endUserId: string | null;
  stepId: string | null;
  actionType: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

// ─── Interface Map types ──────────────────────────────────────────────────────

export interface InterfaceSnapshot {
  id: string;
  organizationId: string;
  url: string;
  title: string;
  stateLabel: string;
  framework: string;
  elementCount: number;
  annotatedCount: number;
  capturedAt: string;
  isActive: boolean;
  elements?: InterfaceElement[];
}

export interface InterfaceElement {
  id: string;
  snapshotId: string;
  tag: string;
  selector: string;
  text: string;
  elementType: string;
  inputType: string | null;
  ariaLabel: string | null;
  placeholder: string | null;
  name: string | null;
  dataTestId: string | null;
  role: string | null;
  classes: string[];
  rect: { x?: number; y?: number; w?: number; h?: number };
  customLabel: string | null;
  customDescription: string | null;
  businessRule: string | null;
  isSensitive: boolean;
  annotatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
