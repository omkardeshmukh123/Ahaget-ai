'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, OnboardingFlow, FlowTemplateMeta, FlowActivationStat } from '@/lib/api';

const FLOW_TYPES = [
  { value: 'onboarding', label: 'Onboarding', color: '#8A2BE2', desc: 'Get new users to their first value moment' },
  { value: 'adoption',   label: 'Adoption',   color: '#A050F0', desc: 'Surface unused features to existing users' },
  { value: 'upsell',     label: 'Upsell',     color: '#FBBF24', desc: 'Contextual upgrade prompts at the right moment' },
  { value: 'retention',  label: 'Retention',  color: '#F87171', desc: 'Re-engage inactive or at-risk users' },
  { value: 'support',    label: 'Support',    color: '#7B22C9', desc: 'Unblock confused users mid-task' },
] as const;

type FlowTypeValue = typeof FLOW_TYPES[number]['value'];

function flowTypeMeta(type: string) {
  return FLOW_TYPES.find((t) => t.value === type) ?? FLOW_TYPES[0];
}

export default function FlowsPage() {
  const router = useRouter();
  const [flows, setFlows] = useState<OnboardingFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<FlowTypeValue>('onboarding');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [templates, setTemplates] = useState<FlowTemplateMeta[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [flowStats, setFlowStats] = useState<FlowActivationStat[]>([]);

  useEffect(() => {
    Promise.all([
      api.flow.list(),
      api.activation.flows().catch(() => ({ flows: [] as FlowActivationStat[] })),
    ]).then(([flowsData, statsData]) => {
      setFlows(flowsData.flows);
      setFlowStats(statsData.flows);
    }).catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function openNewModal() {
    setShowNew(true);
    setSelectedTemplate(null);
    setNewName('');
    api.flow.listTemplates().then((d) => setTemplates(d.templates)).catch(() => {});
  }

  async function createFlow() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      if (selectedTemplate) {
        const d = await api.flow.createFromTemplate(selectedTemplate);
        router.push(`/flows/${d.flow.id}`);
      } else {
        const d = await api.flow.create(newName.trim(), undefined, newType);
        router.push(`/flows/${d.flow.id}`);
      }
    } catch (e: unknown) {
      alert((e as Error).message);
      setCreating(false);
    }
  }

  async function toggleActive(flow: OnboardingFlow) {
    try {
      await api.flow.update(flow.id, { isActive: !flow.isActive });
      setFlows((prev) => prev.map((f) => f.id === flow.id ? { ...f, isActive: !f.isActive } : f));
    } catch { /* ignore */ }
  }

  async function deleteFlow(id: string) {
    if (!confirm('Delete this flow?')) return;
    try {
      await api.flow.delete(id);
      setFlows((prev) => prev.filter((f) => f.id !== id));
    } catch { /* ignore */ }
  }

  function statFor(flowId: string): FlowActivationStat | undefined {
    return flowStats.find((s) => s.flowId === flowId);
  }

  const filtered = flows
    .filter((f) => typeFilter === 'all' || (f as OnboardingFlow & { flowType?: string }).flowType === typeFilter)
    .filter((f) => !search || f.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return (
    <div style={{ display: 'grid', gap: 12 }}>
      {[...Array(3)].map((_, i) => (
        <div key={i} style={{ height: 60, borderRadius: 10, background: 'var(--surface-container)', animation: 'pulse 1.5s infinite' }} />
      ))}
    </div>
  );

  if (error) return (
    <div style={{ padding: '40px 0', textAlign: 'center' }}>
      <p style={{ color: 'var(--error)', fontSize: 13 }}>Failed to load flows: {error}</p>
      <button onClick={() => { setError(null); setLoading(true); }} style={{ marginTop: 12, fontSize: 12, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}>Retry</button>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--on-surface)', letterSpacing: '-0.03em' }}>Agent Flows</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
            Manage your AI employee&apos;s lifecycle flows — onboarding, adoption, retention and more.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search flows…"
            style={{ width: 200, padding: '8px 12px', borderRadius: 8, fontSize: 13, background: 'var(--surface-container)', border: '1px solid rgba(139,92,246,0.15)', color: 'var(--on-surface)' }}
          />
          <button
            onClick={openNewModal}
            style={{ background: 'linear-gradient(135deg,#8A2BE2,#A050F0)', color: '#fff', padding: '8px 16px', borderRadius: 8, fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer', boxShadow: '0 0 20px rgba(138,43,226,0.3)' }}
          >
            + New flow
          </button>
        </div>
      </div>

      {/* Type filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['all', ...FLOW_TYPES.map(t => t.value)].map((val) => {
          const meta = val === 'all' ? null : flowTypeMeta(val);
          const active = typeFilter === val;
          return (
            <button
              key={val}
              onClick={() => setTypeFilter(val)}
              style={{
                padding: '5px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
                background: active ? (meta ? `${meta.color}22` : 'rgba(139,92,246,0.15)') : 'var(--surface-container)',
                color: active ? (meta ? meta.color : 'var(--primary-bright)') : 'var(--muted)',
                border: active ? `1px solid ${meta ? meta.color + '40' : 'rgba(139,92,246,0.3)'}` : '1px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              {val === 'all' ? 'All' : meta!.label}
            </button>
          );
        })}
      </div>

      {/* New flow panel */}
      {showNew && (
        <div style={{ background: 'var(--surface-container)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 12, padding: '20px 24px', marginBottom: 24 }}>
          {templates.length > 0 && (
            <>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--on-surface-variant)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Start from a template</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px,1fr))', gap: 8, marginBottom: 16 }}>
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setSelectedTemplate(t.id); setNewName(t.name); }}
                    style={{
                      textAlign: 'left', borderRadius: 8, padding: '10px 12px',
                      background: selectedTemplate === t.id ? 'rgba(139,92,246,0.12)' : 'var(--surface-low)',
                      border: `1px solid ${selectedTemplate === t.id ? 'rgba(139,92,246,0.5)' : 'rgba(139,92,246,0.1)'}`,
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{t.icon}</span>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--on-surface)', marginTop: 4 }}>{t.name}</p>
                    <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{t.stepCount} steps</p>
                  </button>
                ))}
                <button
                  onClick={() => { setSelectedTemplate(null); setNewName(''); }}
                  style={{
                    textAlign: 'left', borderRadius: 8, padding: '10px 12px',
                    background: selectedTemplate === null ? 'rgba(139,92,246,0.12)' : 'var(--surface-low)',
                    border: `1px solid ${selectedTemplate === null ? 'rgba(139,92,246,0.5)' : 'rgba(139,92,246,0.1)'}`,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: 16 }}>＋</span>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--on-surface)', marginTop: 4 }}>Blank flow</p>
                  <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>Start from scratch</p>
                </button>
              </div>
            </>
          )}
          {!selectedTemplate && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px,1fr))', gap: 8, marginBottom: 16 }}>
              {FLOW_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setNewType(t.value)}
                  style={{
                    textAlign: 'left', borderRadius: 8, padding: '10px 12px',
                    background: newType === t.value ? `${t.color}18` : 'var(--surface-low)',
                    border: `1px solid ${newType === t.value ? t.color + '50' : 'rgba(139,92,246,0.08)'}`,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: 10, fontWeight: 700, color: t.color, background: `${t.color}20`, padding: '2px 7px', borderRadius: 999 }}>{t.label}</span>
                  <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6, lineHeight: 1.4 }}>{t.desc}</p>
                </button>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createFlow()}
              placeholder="Flow name…"
              style={{ flex: 1, background: 'var(--surface-low)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: 'var(--on-surface)' }}
            />
            <button
              onClick={createFlow}
              disabled={creating || !newName.trim()}
              style={{ background: 'linear-gradient(135deg,#8B5CF6,#22D3EE)', color: '#fff', padding: '9px 18px', borderRadius: 8, fontWeight: 600, fontSize: 13, border: 'none', cursor: creating ? 'not-allowed' : 'pointer', opacity: (creating || !newName.trim()) ? 0.5 : 1 }}
            >
              {creating ? 'Creating…' : 'Create'}
            </button>
            <button
              onClick={() => { setShowNew(false); setNewName(''); setNewType('onboarding'); setSelectedTemplate(null); }}
              style={{ fontSize: 13, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ background: 'var(--surface-container)', border: '1px solid rgba(139,92,246,0.1)', borderRadius: 12, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <EmptyState onNew={openNewModal} hasSearch={!!search || typeFilter !== 'all'} />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(139,92,246,0.1)' }}>
                {['NAME', 'TYPE', 'STEPS', 'SESSIONS', 'COMPLETION', 'STATUS', ''].map((h, i) => (
                  <th key={i} style={{ textAlign: i >= 2 && i <= 4 ? 'right' : i === 5 ? 'right' : 'left', fontSize: 10, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.06em', padding: i === 0 || i === 6 ? '12px 20px' : '12px 14px' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((flow) => {
                const meta = flowTypeMeta((flow as OnboardingFlow & { flowType?: string }).flowType ?? 'onboarding');
                const stat = statFor(flow.id);
                return (
                  <tr key={flow.id} style={{ borderBottom: '1px solid rgba(139,92,246,0.06)', transition: 'background 0.12s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-container-high)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--on-surface)' }}>{flow.name}</span>
                      {flow.description && <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>{flow.description}</p>}
                    </td>
                    <td style={{ padding: '14px' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 999, background: `${meta.color}20`, color: meta.color }}>{meta.label}</span>
                    </td>
                    <td style={{ padding: '14px', textAlign: 'right', color: 'var(--on-surface-variant)' }}>{flow.steps?.length ?? 0}</td>
                    <td style={{ padding: '14px', textAlign: 'right', color: 'var(--on-surface-variant)' }}>{stat?.totalSessions ?? '—'}</td>
                    <td style={{ padding: '14px', textAlign: 'right' }}>
                      {!stat || stat.totalSessions === 0 ? (
                        <span style={{ color: 'var(--muted)', fontSize: 11 }}>—</span>
                      ) : (() => {
                        const rate = stat.completionRate;
                        const color = rate >= 70 ? '#4ADE80' : rate >= 40 ? '#FBBF24' : '#F87171';
                        return <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: `${color}20`, color }}>{rate}%</span>;
                      })()}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: flow.isActive ? '#8A2BE2' : 'var(--muted)' }}>{flow.isActive ? 'Live' : 'Draft'}</span>
                        <button
                          onClick={() => toggleActive(flow)}
                          style={{
                            width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
                            background: flow.isActive ? '#8A2BE2' : 'var(--surface-bright)',
                            position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                          }}
                        >
                          <span style={{
                            position: 'absolute', top: 3, left: flow.isActive ? 19 : 3,
                            width: 14, height: 14, borderRadius: '50%', background: '#fff',
                            transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                          }} />
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 14 }}>
                        <Link href={`/flows/${flow.id}`} style={{ fontSize: 12, fontWeight: 500, color: 'var(--primary-bright)' }}>Edit steps</Link>
                        <button onClick={() => deleteFlow(flow.id)} style={{ fontSize: 12, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.color = 'var(--error)')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
                        >Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {filtered.length > 0 && (
          <div style={{ padding: '10px 20px', borderTop: '1px solid rgba(139,92,246,0.08)', fontSize: 11, color: 'var(--muted)' }}>
            Showing {filtered.length} of {flows.length} flow{flows.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ onNew, hasSearch }: { onNew: () => void; hasSearch: boolean }) {
  if (hasSearch) return (
    <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>No flows match your filter.</div>
  );
  return (
    <div style={{ padding: '48px 0', textAlign: 'center' }}>
      <p style={{ fontSize: 32, marginBottom: 12 }}>◈</p>
      <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--on-surface)', marginBottom: 8 }}>No agent flows yet</h2>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>Create your first flow — choose a lifecycle stage and your AI employee will handle the rest.</p>
      <button onClick={onNew} style={{ background: 'linear-gradient(135deg,#8A2BE2,#A050F0)', color: '#fff', padding: '9px 20px', borderRadius: 8, fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer' }}>
        + New flow
      </button>
    </div>
  );
}
