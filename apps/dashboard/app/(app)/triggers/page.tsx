'use client';
import { useEffect, useState } from 'react';
import { api, OnboardingFlow } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

const TRIGGER_TYPES = [
  { value: 'page_visit',          label: 'Page Visit',          icon: '🔗', desc: 'Fire when user visits a URL pattern' },
  { value: 'page_never_visited',  label: 'Page Never Visited',  icon: '🚫', desc: 'User hasn\'t visited a URL after N days' },
  { value: 'event_fired',         label: 'Event Fired',         icon: '⚡', desc: 'A specific tracking event fires' },
  { value: 'usage_threshold',     label: 'Usage Threshold',     icon: '📊', desc: 'User hits X% of a plan metric' },
  { value: 'inactivity',          label: 'Inactivity',          icon: '💤', desc: 'User hasn\'t logged in for N days' },
  { value: 'feature_unused',      label: 'Feature Unused',      icon: '🔇', desc: 'User hasn\'t used a feature slug for N days' },
  { value: 'error_state',         label: 'Error State',         icon: '🔴', desc: 'Fire when an error is detected on the page' },
] as const;

type TriggerType = typeof TRIGGER_TYPES[number]['value'];

interface TriggerRule {
  id: string;
  flowId: string;
  triggerType: TriggerType;
  isActive: boolean;
  urlPattern?: string | null;
  firstTimeOnly?: boolean;
  daysThreshold?: number | null;
  eventName?: string | null;
  usageMetric?: string | null;
  usagePercent?: number | null;
  featureSlug?: string | null;
  createdAt: string;
  flow?: { id: string; name: string; flowType: string };
}

const apiFetch = async <T,>(path: string, opts?: RequestInit): Promise<T> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('oai_token') : null;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
  const res = await fetch(`${baseUrl}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts?.headers },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as T;
};

const TYPE_COLORS: Record<string, string> = {
  page_visit: '#6366f1', page_never_visited: '#8b5cf6', event_fired: '#f59e0b',
  usage_threshold: '#10b981', inactivity: '#ef4444', feature_unused: '#3b82f6',
  error_state: '#dc2626',
};

function TriggerBadge({ type }: { type: string }) {
  const meta = TRIGGER_TYPES.find((t) => t.value === type);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: `${TYPE_COLORS[type] ?? '#6366f1'}18`,
      color: TYPE_COLORS[type] ?? '#6366f1',
      border: `1px solid ${TYPE_COLORS[type] ?? '#6366f1'}30`,
      borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600,
    }}>
      {meta?.icon} {meta?.label ?? type}
    </span>
  );
}

export default function TriggersPage() {
  const { token } = useAuthStore();
  const [rules, setRules] = useState<TriggerRule[]>([]);
  const [flows, setFlows] = useState<OnboardingFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);

  // New rule form state
  const [nFlowId, setNFlowId] = useState('');
  const [nType, setNType] = useState<TriggerType>('page_visit');
  const [nUrlPattern, setNUrlPattern] = useState('');
  const [nFirstTimeOnly, setNFirstTimeOnly] = useState(false);
  const [nDays, setNDays] = useState('');
  const [nEvent, setNEvent] = useState('');
  const [nMetric, setNMetric] = useState('');
  const [nPercent, setNPercent] = useState('');
  const [nFeature, setNFeature] = useState('');

  useEffect(() => { load(); }, [token]);

  async function load() {
    setLoading(true);
    try {
      const [rulesData, flowsData] = await Promise.all([
        apiFetch<{ rules: TriggerRule[] }>('/api/v1/triggers'),
        api.flow.list(),
      ]);
      setRules(rulesData.rules);
      setFlows(flowsData.flows);
      if (flowsData.flows.length > 0 && !nFlowId) setNFlowId(flowsData.flows[0].id);
    } finally {
      setLoading(false);
    }
  }

  async function createRule() {
    if (!nFlowId) return;
    setSaving(true);
    try {
      await apiFetch('/api/v1/triggers', {
        method: 'POST',
        body: JSON.stringify({
          flowId: nFlowId,
          triggerType: nType,
          urlPattern: nUrlPattern || null,
          firstTimeOnly: nFirstTimeOnly,
          daysThreshold: nDays ? parseInt(nDays) : null,
          eventName: nEvent || null,
          usageMetric: nMetric || null,
          usagePercent: nPercent ? parseInt(nPercent) : null,
          featureSlug: nFeature || null,
        }),
      });
      setShowNew(false);
      resetForm();
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function toggleRule(id: string, isActive: boolean) {
    await apiFetch(`/api/v1/triggers/${id}`, { method: 'PUT', body: JSON.stringify({ isActive }) });
    setRules((r) => r.map((x) => x.id === id ? { ...x, isActive } : x));
  }

  async function deleteRule(id: string) {
    if (!confirm('Delete this trigger rule?')) return;
    await apiFetch(`/api/v1/triggers/${id}`, { method: 'DELETE' });
    setRules((r) => r.filter((x) => x.id !== id));
  }

  function resetForm() {
    setNType('page_visit'); setNUrlPattern(''); setNFirstTimeOnly(false);
    setNDays(''); setNEvent(''); setNMetric(''); setNPercent(''); setNFeature('');
  }

  const inputStyle = {
    width: '100%', padding: '8px 12px',
    background: 'var(--surface-low)', border: '1px solid rgba(70,69,84,0.2)',
    borderRadius: 8, color: 'var(--on-surface)', fontSize: 13, boxSizing: 'border-box' as const,
  };

  const labelStyle = { fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginBottom: 4, display: 'block' as const };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>Triggers</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
            Define when the AI employee wakes up and activates a flow.
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          style={{
            background: 'linear-gradient(135deg, #8A2BE2, #6A0DAD)', color: '#fff',
            border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600, fontSize: 13,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <span style={{ fontSize: 16 }}>＋</span> New Trigger
        </button>
      </div>

      {/* New rule modal */}
      {showNew && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={(e) => e.target === e.currentTarget && setShowNew(false)}>
          <div style={{
            background: 'var(--surface)', borderRadius: 12, padding: 28, width: 520, maxHeight: '85vh',
            overflowY: 'auto', border: '1px solid rgba(70,69,84,0.15)',
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 20 }}>
              New Trigger Rule
            </h2>

            <div style={{ display: 'grid', gap: 16 }}>
              {/* Flow */}
              <div>
                <label style={labelStyle}>Flow</label>
                <select value={nFlowId} onChange={(e) => setNFlowId(e.target.value)} style={inputStyle}>
                  {flows.map((f) => (
                    <option key={f.id} value={f.id}>{f.name} ({f.flowType})</option>
                  ))}
                </select>
              </div>

              {/* Trigger type */}
              <div>
                <label style={labelStyle}>Trigger type</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {TRIGGER_TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setNType(t.value)}
                      style={{
                        padding: '8px 10px', borderRadius: 8, textAlign: 'left',
                        background: nType === t.value ? `${TYPE_COLORS[t.value]}20` : 'var(--surface-low)',
                        border: `1px solid ${nType === t.value ? TYPE_COLORS[t.value] : 'rgba(70,69,84,0.2)'}`,
                        color: 'var(--on-surface)', cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{t.icon} {t.label}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Type-specific fields */}
              {(nType === 'page_visit' || nType === 'page_never_visited') && (
                <div>
                  <label style={labelStyle}>URL pattern (regex or glob, e.g. /dashboard/*)</label>
                  <input style={inputStyle} value={nUrlPattern} onChange={(e) => setNUrlPattern(e.target.value)} placeholder="/dashboard*" />
                </div>
              )}
              {nType === 'page_visit' && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--on-surface)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={nFirstTimeOnly} onChange={(e) => setNFirstTimeOnly(e.target.checked)} />
                  First visit only
                </label>
              )}
              {(nType === 'inactivity' || nType === 'page_never_visited' || nType === 'feature_unused') && (
                <div>
                  <label style={labelStyle}>Days threshold</label>
                  <input style={inputStyle} type="number" value={nDays} onChange={(e) => setNDays(e.target.value)} placeholder="e.g. 14" />
                </div>
              )}
              {nType === 'event_fired' && (
                <div>
                  <label style={labelStyle}>Event name</label>
                  <input style={inputStyle} value={nEvent} onChange={(e) => setNEvent(e.target.value)} placeholder="e.g. user_connected_source" />
                </div>
              )}
              {nType === 'usage_threshold' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Metric key</label>
                    <input style={inputStyle} value={nMetric} onChange={(e) => setNMetric(e.target.value)} placeholder="api_calls" />
                  </div>
                  <div>
                    <label style={labelStyle}>Threshold %</label>
                    <input style={inputStyle} type="number" value={nPercent} onChange={(e) => setNPercent(e.target.value)} placeholder="80" min="0" max="100" />
                  </div>
                </div>
              )}
              {nType === 'feature_unused' && (
                <div>
                  <label style={labelStyle}>Feature slug</label>
                  <input style={inputStyle} value={nFeature} onChange={(e) => setNFeature(e.target.value)} placeholder="e.g. exports" />
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  onClick={createRule} disabled={saving || !nFlowId}
                  style={{
                    flex: 1, padding: '9px 0', borderRadius: 8, fontWeight: 600, fontSize: 13,
                    background: 'linear-gradient(135deg, #8A2BE2, #6A0DAD)', color: '#fff',
                    border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? 'Creating…' : 'Create rule'}
                </button>
                <button
                  onClick={() => { setShowNew(false); resetForm(); }}
                  style={{
                    padding: '9px 16px', borderRadius: 8, fontWeight: 600, fontSize: 13,
                    background: 'var(--surface-low)', color: 'var(--muted)',
                    border: '1px solid rgba(70,69,84,0.2)', cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rules list */}
      {loading ? (
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>Loading…</p>
      ) : rules.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 0',
          border: '1px dashed rgba(70,69,84,0.2)', borderRadius: 12,
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⚡</div>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--on-surface)', margin: 0 }}>No trigger rules yet</p>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>
            Create one to define when your AI employee wakes up.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {rules.map((rule) => (
            <div key={rule.id} style={{
              background: 'var(--surface)', border: '1px solid rgba(70,69,84,0.12)',
              borderRadius: 10, padding: '14px 18px',
              display: 'flex', alignItems: 'center', gap: 14,
              opacity: rule.isActive ? 1 : 0.55,
            }}>
              {/* Active toggle */}
              <input
                type="checkbox" checked={rule.isActive}
                onChange={(e) => toggleRule(rule.id, e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                  <TriggerBadge type={rule.triggerType} />
                  <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>
                    → {rule.flow?.name ?? rule.flowId}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {rule.urlPattern && <span>URL: <code>{rule.urlPattern}</code></span>}
                  {rule.firstTimeOnly && <span>First visit only</span>}
                  {rule.daysThreshold && <span>{rule.daysThreshold} days</span>}
                  {rule.eventName && <span>Event: <code>{rule.eventName}</code></span>}
                  {rule.usageMetric && <span>Metric: {rule.usageMetric} ≥ {rule.usagePercent}%</span>}
                  {rule.featureSlug && <span>Feature: <code>{rule.featureSlug}</code></span>}
                </div>
              </div>
              <button
                onClick={() => deleteRule(rule.id)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--muted)', fontSize: 16, lineHeight: 1,
                  padding: '4px 6px', borderRadius: 4,
                }}
                title="Delete"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
