'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, OnboardingFlow, OnboardingStep, FunnelStep, FlowTimeline, AdoptionStats } from '@/lib/api';

const ACTION_TYPES = ['none', 'fill_form', 'click', 'navigate', 'highlight'];

const ACTION_TYPE_LABELS: Record<string, string> = {
  fill_form: 'Fill form',
  click:     'Click',
  navigate:  'Navigate',
  highlight: 'Highlight',
};

const BLANK_STEP: Omit<OnboardingStep, 'id' | 'flowId' | 'createdAt'> = {
  title: '',
  intent: '',
  description: '',
  aiPrompt: '',
  smartQuestions: [],
  actionType: null,
  actionConfig: {},
  allowedActions: [],
  completionEvent: '',
  isMilestone: false,
  targetUrl: null,
  order: 0,
};

export default function FlowEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [flow, setFlow] = useState<OnboardingFlow | null>(null);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [editingStep, setEditingStep] = useState<OnboardingStep | null>(null);
  const [newStep, setNewStep] = useState<typeof BLANK_STEP>({ ...BLANK_STEP });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Trigger config state
  const [triggerDelaySec, setTriggerDelaySec] = useState(30);
  const [urlPattern, setUrlPattern] = useState('');
  const [maxTriggers, setMaxTriggers] = useState(0);
  const [savingTrigger, setSavingTrigger] = useState(false);
  const [triggerSaved, setTriggerSaved] = useState(false);

  // Flow goal + feature slug state
  const [flowGoal, setFlowGoal] = useState('');
  const [featureSlug, setFeatureSlug] = useState('');
  const [savingMeta, setSavingMeta] = useState(false);
  const [metaSaved, setMetaSaved] = useState(false);

  // Target audience state
  const [targetRolesInput, setTargetRolesInput]       = useState('');
  const [targetSegmentsInput, setTargetSegmentsInput] = useState('');
  const [targetPlansInput, setTargetPlansInput]       = useState('');
  const [savingAudience, setSavingAudience]           = useState(false);
  const [audienceSaved, setAudienceSaved]             = useState(false);

  // Analytics tab state
  const [activeTab, setActiveTab] = useState<'steps' | 'analytics'>('steps');
  const [funnel, setFunnel] = useState<{ flowName: string | null; totalSessions: number; funnel: FunnelStep[] } | null>(null);
  const [timeline, setTimeline] = useState<FlowTimeline[]>([]);
  const [timelineDays, setTimelineDays] = useState(30);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [adoptionStats, setAdoptionStats] = useState<AdoptionStats | null>(null);

  useEffect(() => {
    api.flow.get(id).then((d) => {
      setFlow(d.flow);
      setSteps(d.flow.steps ?? []);
      setTriggerDelaySec(Math.round((d.flow.triggerDelayMs ?? 30000) / 1000));
      setUrlPattern(d.flow.urlPattern ?? '');
      setMaxTriggers(d.flow.maxTriggersPerUser ?? 0);
      setFlowGoal(d.flow.description ?? '');
      setFeatureSlug((d.flow.triggerCondition as Record<string, unknown>)?.featureSlug as string ?? '');
      setTargetRolesInput((d.flow.targetRoles ?? []).join(', '));
      setTargetSegmentsInput((d.flow.targetSegments ?? []).join(', '));
      setTargetPlansInput((d.flow.targetPlans ?? []).join(', '));
      setLoading(false);
    });
  }, [id]);

  async function saveMeta() {
    setSavingMeta(true);
    const updates: Parameters<typeof api.flow.update>[1] = { description: flowGoal };
    if (flow?.flowType === 'adoption' && featureSlug) {
      (updates as Record<string, unknown>).triggerCondition = {
        ...(flow.triggerCondition as Record<string, unknown>),
        featureSlug,
      };
    }
    await api.flow.update(id, updates);
    setSavingMeta(false);
    setMetaSaved(true);
    setTimeout(() => setMetaSaved(false), 2000);
  }

  async function saveTriggerConfig() {
    setSavingTrigger(true);
    await api.flow.update(id, {
      triggerDelayMs: triggerDelaySec * 1000,
      urlPattern,
      maxTriggersPerUser: maxTriggers,
    });
    setSavingTrigger(false);
    setTriggerSaved(true);
    setTimeout(() => setTriggerSaved(false), 2000);
  }

  function splitTags(s: string): string[] {
    return s.split(',').map((v) => v.trim()).filter(Boolean);
  }

  async function saveAudience() {
    setSavingAudience(true);
    await api.flow.update(id, {
      targetRoles:    splitTags(targetRolesInput),
      targetSegments: splitTags(targetSegmentsInput),
      targetPlans:    splitTags(targetPlansInput),
    });
    setSavingAudience(false);
    setAudienceSaved(true);
    setTimeout(() => setAudienceSaved(false), 2000);
  }

  async function loadAnalytics(days: number) {
    setAnalyticsLoading(true);
    const isAdoption = flow?.flowType === 'adoption';
    const [funnelData, timelineData, adoptionData] = await Promise.all([
      api.activation.funnel(id),
      api.activation.flowTimeline(id, days),
      isAdoption ? api.activation.adoption(id) : Promise.resolve(null),
    ]);
    setFunnel(funnelData);
    setTimeline(timelineData.timeline);
    setAdoptionStats(adoptionData);
    setAnalyticsLoading(false);
  }

  function switchTab(tab: 'steps' | 'analytics') {
    setActiveTab(tab);
    if (tab === 'analytics' && !funnel) loadAnalytics(timelineDays);
  }

  async function addStep() {
    if (!newStep.title.trim()) return;
    setSaving(true);
    const d = await api.flow.createStep(id, newStep);
    setSteps((prev) => [...prev, d.step]);
    setNewStep({ ...BLANK_STEP });
    setSaving(false);
  }

  async function saveEdit() {
    if (!editingStep) return;
    setSaving(true);
    await api.flow.updateStep(id, editingStep.id, editingStep);
    setSteps((prev) => prev.map((s) => s.id === editingStep.id ? editingStep : s));
    setEditingStep(null);
    setSaving(false);
  }

  async function deleteStep(stepId: string) {
    if (!confirm('Delete this step?')) return;
    await api.flow.deleteStep(id, stepId);
    setSteps((prev) => prev.filter((s) => s.id !== stepId));
  }

  if (loading) return <div className="p-8 text-slate-400">Loading…</div>;
  if (!flow) return <div className="p-8 text-red-500">Flow not found</div>;

  return (
    <div className="max-w-3xl mx-auto p-8">
      <button onClick={() => router.push('/flows')} className="text-sm text-slate-400 hover:text-slate-700 mb-6 flex items-center gap-1">
        ← Back to flows
      </button>

      <h1 className="text-2xl font-bold text-slate-900 mb-1">{flow.name}</h1>
      <p className="text-slate-500 text-sm mb-4">
        Define each step of the journey. The AI copilot will guide users through these steps automatically.
      </p>

      {/* Tab switcher */}
      <div className="flex mb-8 border-b border-slate-200">
        {(['steps', 'analytics'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => switchTab(tab)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab === 'steps' ? 'Steps' : 'Analytics'}
          </button>
        ))}
      </div>

      {activeTab === 'steps' && (<>

      {/* Flow goal + feature slug */}
      <div className="border border-slate-200 rounded-xl p-6 mb-6 bg-white">
        <h2 className="font-semibold text-slate-800 mb-1">Flow Goal</h2>
        <p className="text-xs text-slate-400 mb-4">What does success look like? The AI uses this to know when the flow is truly complete.</p>
        <textarea
          value={flowGoal}
          onChange={(e) => setFlowGoal(e.target.value)}
          placeholder="User has connected their first data source and seen their first chart."
          rows={2}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none mb-4"
        />
        {flow.flowType === 'adoption' && (
          <div className="mb-4">
            <label className="text-xs font-medium text-slate-500 block mb-1">Feature slug</label>
            <input
              value={featureSlug}
              onChange={(e) => setFeatureSlug(e.target.value)}
              placeholder="csv-import"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <p className="text-xs text-slate-400 mt-1">Identifier for the feature this flow teaches — used by trigger rules.</p>
          </div>
        )}
        <div className="flex items-center gap-3">
          <button
            onClick={saveMeta}
            disabled={savingMeta}
            className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
          >
            {savingMeta ? 'Saving…' : 'Save'}
          </button>
          {metaSaved && <span className="text-xs text-green-600 font-medium">Saved</span>}
        </div>
      </div>

      {/* Trigger settings */}
      <div className="border border-slate-200 rounded-xl p-6 mb-8 bg-white">
        <h2 className="font-semibold text-slate-800 mb-1">Trigger Settings</h2>
        <p className="text-xs text-slate-400 mb-5">Control when and how often the widget appears to users.</p>
        <div className="grid grid-cols-3 gap-5">
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">
              Delay after page load (seconds)
            </label>
            <input
              type="number"
              min={0}
              value={triggerDelaySec}
              onChange={(e) => setTriggerDelaySec(Math.max(0, Number(e.target.value)))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <p className="text-xs text-slate-400 mt-1">0 = appear immediately</p>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">
              URL pattern (comma-separated)
            </label>
            <input
              type="text"
              value={urlPattern}
              onChange={(e) => setUrlPattern(e.target.value)}
              placeholder="/dashboard, /onboarding/*"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <p className="text-xs text-slate-400 mt-1">Empty = all pages. Use * as wildcard.</p>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">
              Max triggers per user
            </label>
            <input
              type="number"
              min={0}
              value={maxTriggers}
              onChange={(e) => setMaxTriggers(Math.max(0, Number(e.target.value)))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <p className="text-xs text-slate-400 mt-1">0 = unlimited</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={saveTriggerConfig}
            disabled={savingTrigger}
            className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
          >
            {savingTrigger ? 'Saving…' : 'Save Trigger Settings'}
          </button>
          {triggerSaved && <span className="text-xs text-green-600 font-medium">Saved</span>}
        </div>
      </div>

      {/* Target Audience */}
      <div className="border border-slate-200 rounded-xl p-6 mb-8 bg-white">
        <h2 className="font-semibold text-slate-800 mb-1">Target Audience</h2>
        <p className="text-xs text-slate-400 mb-5">Restrict this flow to users with specific attributes. Leave blank to target all users. Use commas to separate multiple values.</p>
        <div className="grid grid-cols-3 gap-5">
          {([
            { label: 'Roles',    value: targetRolesInput,    set: setTargetRolesInput,    placeholder: 'admin, member' },
            { label: 'Segments', value: targetSegmentsInput, set: setTargetSegmentsInput, placeholder: 'enterprise, smb' },
            { label: 'Plans',    value: targetPlansInput,    set: setTargetPlansInput,    placeholder: 'free, pro, growth' },
          ] as const).map(({ label, value, set, placeholder }) => (
            <div key={label}>
              <label className="text-xs font-medium text-slate-500 block mb-1">{label}</label>
              <input
                type="text"
                value={value}
                onChange={(e) => set(e.target.value)}
                placeholder={placeholder}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={saveAudience}
            disabled={savingAudience}
            className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
          >
            {savingAudience ? 'Saving…' : 'Save Audience'}
          </button>
          {audienceSaved && <span className="text-xs text-green-600 font-medium">Saved</span>}
        </div>
      </div>

      {/* Steps list */}
      <div className="space-y-4 mb-10">
        {steps.length === 0 && (
          <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-sm">
            No steps yet. Add the first step below.
          </div>
        )}
        {steps.map((step, idx) => (
          <div key={step.id} className={`border rounded-xl p-5 bg-white ${step.isMilestone ? 'border-brand-300 ring-1 ring-brand-200' : 'border-slate-200'}`}>
            {editingStep?.id === step.id ? (
              <StepForm
                step={editingStep}
                onChange={setEditingStep}
                onSave={saveEdit}
                onCancel={() => setEditingStep(null)}
                saving={saving}
              />
            ) : (
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400">STEP {idx + 1}</span>
                    {step.isMilestone && (
                      <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium">
                        First Value Milestone
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-slate-900 mt-1">{step.title}</h3>
                  {step.description && <p className="text-slate-500 text-sm mt-0.5">{step.description}</p>}
                  <div className="flex gap-4 mt-2 text-xs text-slate-400">
                    {step.intent && <span>Intent: <code>{step.intent}</code></span>}
                    {step.actionType && <span>Action: <code>{step.actionType}</code></span>}
                    {step.completionEvent && <span>Auto-complete on: <code>{step.completionEvent}</code></span>}
                    {(step.smartQuestions as string[])?.length > 0 && (
                      <span>{(step.smartQuestions as string[]).length} smart question(s)</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button onClick={() => setEditingStep(step)} className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
                    Edit
                  </button>
                  <button onClick={() => deleteStep(step.id)} className="text-xs px-3 py-1.5 border border-red-200 text-red-500 rounded-lg hover:bg-red-50">
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add new step */}
      <div className="border-2 border-dashed border-slate-200 rounded-xl p-6">
        <h2 className="font-semibold text-slate-700 mb-4">Add Step</h2>
        <StepForm
          step={newStep as OnboardingStep}
          onChange={(s) => setNewStep(s as typeof BLANK_STEP)}
          onSave={addStep}
          onCancel={() => setNewStep({ ...BLANK_STEP })}
          saving={saving}
          isNew
        />
      </div>

      </>)}

      {activeTab === 'analytics' && (
        <AnalyticsTab
          funnel={funnel}
          timeline={timeline}
          timelineDays={timelineDays}
          loading={analyticsLoading}
          flowType={flow.flowType}
          adoptionStats={adoptionStats}
          onChangeDays={(days) => { setTimelineDays(days); loadAnalytics(days); }}
        />
      )}
    </div>
  );
}

function StepForm({
  step,
  onChange,
  onSave,
  onCancel,
  saving,
  isNew = false,
}: {
  step: OnboardingStep | typeof BLANK_STEP;
  onChange: (s: any) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  isNew?: boolean;
}) {
  const set = (key: string, value: unknown) => onChange({ ...step, [key]: value });
  const questions = (step.smartQuestions as string[]) ?? [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-slate-500 block mb-1">Step Title *</label>
          <input
            value={step.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Connect your data source"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 block mb-1">Intent keyword</label>
          <input
            value={step.intent as string}
            onChange={(e) => set('intent', e.target.value)}
            placeholder="data_connection"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-slate-500 block mb-1">Description (shown to user)</label>
        <input
          value={step.description as string}
          onChange={(e) => set('description', e.target.value)}
          placeholder="We'll connect your analytics data source so you can see real insights."
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-slate-500 block mb-1">AI instructions for this step</label>
        <textarea
          value={step.aiPrompt as string}
          onChange={(e) => set('aiPrompt', e.target.value)}
          placeholder="When the user connects a CSV, ask for their primary metric. Help them pick the right chart type."
          rows={2}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-slate-500 block mb-1">
          Smart questions (max 2) — one per line
        </label>
        <textarea
          value={questions.join('\n')}
          onChange={(e) => set('smartQuestions', e.target.value.split('\n').filter(Boolean).slice(0, 2))}
          placeholder={"What's your main data source?\nWhat metric do you want to track first?"}
          rows={2}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-medium text-slate-500 block mb-1">Page action type</label>
          <select
            value={step.actionType ?? 'none'}
            onChange={(e) => set('actionType', e.target.value === 'none' ? null : e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {ACTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 block mb-1">Auto-complete event</label>
          <input
            value={step.completionEvent as string ?? ''}
            onChange={(e) => set('completionEvent', e.target.value || null)}
            placeholder="data_connected"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 block mb-1">Target page (optional)</label>
          <input
            value={(step as OnboardingStep).targetUrl ?? ''}
            onChange={(e) => set('targetUrl', e.target.value || null)}
            placeholder="/settings/billing"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <p className="text-xs text-slate-400 mt-1">Widget offers to navigate if user is elsewhere.</p>
        </div>
      </div>

      {/* Action config — conditional fields per action type */}
      {step.actionType === 'click' && (
        <div className="border border-slate-100 rounded-lg p-4 bg-slate-50">
          <label className="text-xs font-medium text-slate-500 block mb-1">Click — CSS selector</label>
          <input
            value={((step.actionConfig as Record<string, unknown>)?.selector as string) ?? ''}
            onChange={(e) => set('actionConfig', { ...((step.actionConfig as Record<string, unknown>) ?? {}), selector: e.target.value })}
            placeholder="#submit-button"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <p className="text-xs text-slate-400 mt-1">Agent clicks this element at step start.</p>
        </div>
      )}

      {step.actionType === 'highlight' && (
        <div className="border border-slate-100 rounded-lg p-4 bg-slate-50 space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Highlight — CSS selector</label>
            <input
              value={((step.actionConfig as Record<string, unknown>)?.selector as string) ?? ''}
              onChange={(e) => set('actionConfig', { ...((step.actionConfig as Record<string, unknown>) ?? {}), selector: e.target.value })}
              placeholder=".pricing-table"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Highlight style</label>
            <select
              value={((step.actionConfig as Record<string, unknown>)?.mode as string) ?? 'spotlight'}
              onChange={(e) => set('actionConfig', { ...((step.actionConfig as Record<string, unknown>) ?? {}), mode: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="spotlight">Spotlight — dark backdrop + ring (max attention)</option>
              <option value="beacon">Beacon — pulsing dot badge (passive hint)</option>
              <option value="arrow">Arrow — speech bubble pointing at element</option>
              <option value="multi">Multi — numbered rings on several elements</option>
              <option value="ring">Ring — thin pulsing ring only, no backdrop</option>
            </select>
          </div>
        </div>
      )}

      {step.actionType === 'fill_form' && (
        <div className="border border-slate-100 rounded-lg p-4 bg-slate-50">
          <label className="text-xs font-medium text-slate-500 block mb-2">Fill Form — Fields (selector → value)</label>
          {Object.entries(((step.actionConfig as Record<string, unknown>)?.fields as Record<string, string>) ?? {}).map(([sel, val], i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                value={sel}
                onChange={(e) => {
                  const fields = { ...((((step.actionConfig as Record<string, unknown>)?.fields ?? {}) as Record<string, string>)) };
                  delete fields[sel];
                  fields[e.target.value] = val;
                  set('actionConfig', { ...((step.actionConfig as Record<string, unknown>) ?? {}), fields });
                }}
                placeholder="#email-input"
                className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <input
                value={val}
                onChange={(e) => {
                  const fields = { ...((((step.actionConfig as Record<string, unknown>)?.fields ?? {}) as Record<string, string>)) };
                  fields[sel] = e.target.value;
                  set('actionConfig', { ...((step.actionConfig as Record<string, unknown>) ?? {}), fields });
                }}
                placeholder="{{collectedData.email}}"
                className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="button"
                onClick={() => {
                  const fields = { ...((((step.actionConfig as Record<string, unknown>)?.fields ?? {}) as Record<string, string>)) };
                  delete fields[sel];
                  set('actionConfig', { ...((step.actionConfig as Record<string, unknown>) ?? {}), fields });
                }}
                className="text-red-400 hover:text-red-600 px-2"
              >×</button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              const fields = { ...((((step.actionConfig as Record<string, unknown>)?.fields ?? {}) as Record<string, string>)) };
              fields[''] = '';
              set('actionConfig', { ...((step.actionConfig as Record<string, unknown>) ?? {}), fields });
            }}
            className="text-xs text-brand-600 hover:text-brand-800 font-medium"
          >+ Add field</button>
          <p className="text-xs text-slate-400 mt-2">Use <code>{'{{collectedData.key}}'}</code> to substitute collected answers.</p>
        </div>
      )}

      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={step.isMilestone as boolean}
            onChange={(e) => set('isMilestone', e.target.checked)}
            className="w-4 h-4 accent-brand-600"
          />
          <span className="text-sm text-slate-700">First value milestone</span>
        </label>
      </div>

      {/* Guardrails — allowed AI action types */}
      <div>
        <label className="text-xs font-medium text-slate-500 block mb-1">
          Guardrails — allowed AI actions <span className="font-normal text-slate-400">(unchecked = all allowed)</span>
        </label>
        <div className="flex flex-wrap gap-3">
          {(['fill_form', 'click', 'navigate', 'highlight'] as const).map((type) => {
            const allowed = (step.allowedActions as string[]) ?? [];
            const isChecked = allowed.length === 0 || allowed.includes(type);
            const isConstrained = allowed.length > 0;
            return (
              <label key={type} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isChecked}
                  className="w-3.5 h-3.5 accent-brand-600"
                  onChange={(e) => {
                    const current: string[] = allowed.length === 0
                      ? ['fill_form', 'click', 'navigate', 'highlight']
                      : [...allowed];
                    const next = e.target.checked
                      ? [...new Set([...current, type])]
                      : current.filter((t) => t !== type);
                    // If all 4 selected, store empty (= all allowed)
                    const allTypes = ['fill_form', 'click', 'navigate', 'highlight'];
                    set('allowedActions', next.length === allTypes.length ? [] : next);
                  }}
                />
                <span className={`text-xs ${isConstrained && !isChecked ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                  {ACTION_TYPE_LABELS[type]}
                </span>
              </label>
            );
          })}
        </div>
        {((step.allowedActions as string[]) ?? []).length > 0 && (
          <p className="text-xs text-amber-600 mt-1">
            Restricted to: {(step.allowedActions as string[]).map((t) => ACTION_TYPE_LABELS[t] ?? t).join(', ')}
          </p>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onSave}
          disabled={saving || !step.title}
          className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : isNew ? 'Add Step' : 'Save Changes'}
        </button>
        <button onClick={onCancel} className="text-sm text-slate-500 hover:text-slate-800 px-4 py-2">
          Cancel
        </button>
      </div>
    </div>
  );
}

function StatCard({
  label, value, sub, color = 'slate',
}: {
  label: string; value: string; sub?: string; color?: 'slate' | 'emerald' | 'amber' | 'red';
}) {
  const valueColor = { slate: 'text-slate-900', emerald: 'text-emerald-600', amber: 'text-amber-600', red: 'text-red-600' }[color];
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5 truncate">{sub}</p>}
    </div>
  );
}

function AnalyticsTab({
  funnel, timeline, timelineDays, loading, flowType, adoptionStats, onChangeDays,
}: {
  funnel: { flowName: string | null; totalSessions: number; funnel: FunnelStep[] } | null;
  timeline: FlowTimeline[];
  timelineDays: number;
  loading: boolean;
  flowType: string;
  adoptionStats: AdoptionStats | null;
  onChangeDays: (days: number) => void;
}) {
  if (loading) return <div className="p-8 text-center text-slate-400 text-sm animate-pulse">Loading analytics…</div>;
  if (!funnel) return <div className="p-8 text-center text-slate-400 text-sm">No analytics data yet.</div>;

  const steps = funnel.funnel;
  const total = funnel.totalSessions;
  const lastStep = steps[steps.length - 1];
  const completionRate = total > 0 && lastStep ? Math.round((lastStep.completed / total) * 100) : 0;
  const avgTimeSecs = steps.reduce((s, st) => s + (st.avgTimeSecs ?? 0), 0);
  const avgTimeMins = avgTimeSecs > 0 ? Math.round((avgTimeSecs / 60) * 10) / 10 : null;
  const worstStep = steps.length > 0 ? steps.reduce((a, b) => (b.dropOffRate > a.dropOffRate ? b : a)) : null;
  const maxBar = steps[0]?.started ?? 1;

  // SVG chart constants
  const W = 600; const H = 120; const pL = 28; const pR = 8; const pT = 8; const pB = 8;
  const iW = W - pL - pR; const iH = H - pT - pB;
  const cx = (i: number) => pL + (timeline.length > 1 ? (i / (timeline.length - 1)) * iW : iW / 2);
  const cy = (rate: number) => pT + iH - (rate / 100) * iH;

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className={`grid gap-4 ${flowType === 'adoption' ? 'grid-cols-5' : 'grid-cols-4'}`}>
        <StatCard label="Total sessions" value={total.toLocaleString()} />
        <StatCard
          label="Completion rate"
          value={total > 0 ? `${completionRate}%` : '—'}
          color={completionRate >= 70 ? 'emerald' : completionRate >= 40 ? 'amber' : total > 0 ? 'red' : 'slate'}
        />
        <StatCard label="Avg time to complete" value={avgTimeMins !== null ? `${avgTimeMins}m` : '—'} />
        <StatCard
          label="Worst drop-off"
          value={worstStep && worstStep.dropOffRate > 0 ? `${worstStep.dropOffRate}%` : '—'}
          sub={worstStep && worstStep.dropOffRate > 0 ? worstStep.stepTitle : undefined}
          color={worstStep && worstStep.dropOffRate >= 50 ? 'red' : worstStep && worstStep.dropOffRate >= 25 ? 'amber' : 'slate'}
        />
        {flowType === 'adoption' && (
          <StatCard
            label={adoptionStats?.featureSlug ? `"${adoptionStats.featureSlug}" adoption` : 'Feature adoption'}
            value={adoptionStats ? `${adoptionStats.adoptionRate}%` : '—'}
            sub={adoptionStats ? `${adoptionStats.adoptedCount} of ${adoptionStats.totalSessions} users` : undefined}
            color={adoptionStats && adoptionStats.adoptionRate >= 60 ? 'emerald' : adoptionStats && adoptionStats.adoptionRate >= 30 ? 'amber' : adoptionStats ? 'red' : 'slate'}
          />
        )}
      </div>

      {/* Step drop-off waterfall */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="font-semibold text-slate-800 mb-5">Step drop-off</h2>
        {steps.length === 0 ? (
          <p className="text-sm text-slate-400">No step data yet.</p>
        ) : (
          <div className="space-y-3">
            {steps.map((step) => {
              const isWorst = worstStep?.stepId === step.stepId && step.dropOffRate > 0;
              const startedPct = (step.started / maxBar) * 100;
              const completedPct = (step.completed / maxBar) * 100;
              const dropColor = step.dropOffRate >= 50 ? 'text-red-600' : step.dropOffRate >= 25 ? 'text-amber-600' : 'text-slate-400';
              return (
                <div key={step.stepId} className={`rounded-lg p-3 ${isWorst ? 'bg-red-50 ring-1 ring-red-200' : 'bg-slate-50'}`}>
                  <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-400">#{step.order + 1}</span>
                      <span className="text-sm font-medium text-slate-800">{step.stepTitle}</span>
                      {step.isMilestone && <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium">Milestone</span>}
                      {isWorst && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">Worst drop-off ⚠</span>}
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-slate-500">{step.started} started · {step.completed} completed</span>
                      {step.avgTimeSecs !== null && (
                        <span className="text-slate-400">{step.avgTimeSecs < 60 ? `${step.avgTimeSecs}s` : `${Math.round((step.avgTimeSecs / 60) * 10) / 10}m`} avg</span>
                      )}
                      <span className={`font-bold ${dropColor}`}>{step.dropOffRate > 0 ? `−${step.dropOffRate}%` : '✓ 0%'}</span>
                    </div>
                  </div>
                  <div className="relative h-3.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="absolute left-0 top-0 h-full bg-slate-300 rounded-full" style={{ width: `${startedPct}%` }} />
                    <div className={`absolute left-0 top-0 h-full rounded-full ${isWorst ? 'bg-red-400' : 'bg-indigo-500'}`} style={{ width: `${completedPct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completion rate over time */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-slate-800">Completion rate over time</h2>
          <div className="flex gap-1">
            {([7, 30, 90] as const).map((d) => (
              <button
                key={d}
                onClick={() => onChangeDays(d)}
                className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${timelineDays === d ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
        {timeline.length === 0 ? (
          <p className="text-sm text-slate-400">No sessions in this period.</p>
        ) : (
          <>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 140 }}>
              {[0, 25, 50, 75, 100].map((pct) => (
                <g key={pct}>
                  <line x1={pL} y1={cy(pct)} x2={pL + iW} y2={cy(pct)} stroke="#f1f5f9" strokeWidth={1} />
                  <text x={pL - 4} y={cy(pct) + 4} textAnchor="end" fontSize={9} fill="#94a3b8">{pct}%</text>
                </g>
              ))}
              <polygon
                points={[`${cx(0)},${pT + iH}`, ...timeline.map((t, i) => `${cx(i)},${cy(t.completionRate)}`), `${cx(timeline.length - 1)},${pT + iH}`].join(' ')}
                fill="#6366f1" fillOpacity={0.08}
              />
              <polyline
                points={timeline.map((t, i) => `${cx(i)},${cy(t.completionRate)}`).join(' ')}
                fill="none" stroke="#6366f1" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round"
              />
              {timeline.map((t, i) => <circle key={i} cx={cx(i)} cy={cy(t.completionRate)} r={3} fill="#6366f1" />)}
            </svg>
            <div className="flex justify-between text-xs text-slate-400 mt-1 px-1">
              <span>{timeline[0]?.date}</span>
              {timeline.length > 2 && <span>{timeline[Math.floor(timeline.length / 2)]?.date}</span>}
              <span>{timeline[timeline.length - 1]?.date}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
