'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type ExpansionStats = {
  totalSuggestions: number;
  confirmed: number;
  pending: number;
  attributedMrr: number;
  conversionRate: number;
  mrrByPlan: Record<string, number>;
};

type UpsellFlow = {
  id: string;
  name: string;
  targetPlan: string | null;
  upgradeUrl: string | null;
  mrrPerConversion: number | null;
  isActive: boolean;
  totalSuggestions: number;
  confirmed: number;
  conversionRate: number;
  attributedMrr: number;
};

type RecentAttribution = {
  id: string;
  status: string;
  targetPlan: string;
  mrr: number | null;
  suggestedAt: string;
  confirmedAt: string | null;
  flow: { name: string } | null;
  endUser: { externalId: string | null; email: string | null } | null;
};

const STATUS_COLORS: Record<string, string> = {
  confirmed: '#10b981', pending: '#f59e0b', rejected: '#ef4444',
};

function Stat({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid rgba(70,69,84,0.12)',
      borderRadius: 12, padding: '18px 20px',
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 8px' }}>{label}</p>
      <p style={{ fontSize: 26, fontWeight: 800, color: accent ?? 'var(--on-surface)', margin: 0 }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

export default function ExpansionPage() {
  const [stats, setStats] = useState<ExpansionStats | null>(null);
  const [flows, setFlows] = useState<UpsellFlow[]>([]);
  const [recent, setRecent] = useState<RecentAttribution[]>([]);
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [editFlow, setEditFlow] = useState<UpsellFlow | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [period]);

  async function load() {
    setLoading(true);
    try {
      const [expData, flowsData] = await Promise.all([
        api.expansion.dashboard(period),
        api.expansion.flows(),
      ]);
      setStats(expData.stats);
      setRecent(expData.recent);
      setFlows(flowsData.flows);
    } catch (e) {
      console.error('[expansion] load error:', e);
    } finally {
      setLoading(false);
    }
  }

  async function saveFlow(id: string, data: { targetPlan?: string; upgradeUrl?: string; mrrPerConversion?: number }) {
    setSaving(true);
    try {
      await api.expansion.updateFlow(id, data);
    } finally {
      setSaving(false);
      setEditFlow(null);
      load();
    }
  }

  const inputStyle = {
    width: '100%', padding: '8px 12px', background: 'var(--surface-low)',
    border: '1px solid rgba(70,69,84,0.2)', borderRadius: 8,
    color: 'var(--on-surface)', fontSize: 13, boxSizing: 'border-box' as const,
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>Expansion Revenue</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
            MRR Ahaget attributed through AI-initiated upgrade conversations.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['7d', '30d', '90d'].map((p) => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: period === p ? 'linear-gradient(135deg, #8A2BE2, #6A0DAD)' : 'var(--surface-low)',
              color: period === p ? '#3d1008' : 'var(--muted)',
              border: `1px solid ${period === p ? 'transparent' : 'rgba(70,69,84,0.2)'}`,
            }}>{p}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>Loading…</p>
      ) : stats && (
        <>
          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
            <Stat label="Attributed MRR" value={`$${stats.attributedMrr.toLocaleString()}`} sub={`Last ${period}`} accent="#10b981" />
            <Stat label="Conversion Rate" value={`${stats.conversionRate}%`} sub={`${stats.confirmed} of ${stats.totalSuggestions} pitches`} />
            <Stat label="Pending" value={stats.pending} sub="Within attribution window" accent="#f59e0b" />
            <Stat label="Total Pitches" value={stats.totalSuggestions} sub={`Last ${period}`} />
          </div>

          {/* MRR by plan */}
          {Object.keys(stats.mrrByPlan).length > 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid rgba(70,69,84,0.12)', borderRadius: 12, padding: '18px 20px', marginBottom: 28 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--on-surface)', margin: '0 0 14px' }}>MRR by Plan</p>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {Object.entries(stats.mrrByPlan).map(([plan, mrr]) => (
                  <div key={plan} style={{
                    background: 'var(--surface-low)', borderRadius: 8, padding: '10px 16px',
                    border: '1px solid rgba(70,69,84,0.1)',
                  }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>{plan}</p>
                    <p style={{ fontSize: 20, fontWeight: 800, color: '#10b981', margin: 0 }}>${mrr.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upsell flows table */}
          <div style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 12 }}>Upsell Flows</p>
            {flows.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 0', border: '1px dashed rgba(70,69,84,0.2)', borderRadius: 12 }}>
                <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0 }}>
                  No upsell flows yet. Create a flow with type <strong>upsell</strong> in Agent Flows.
                </p>
              </div>
            ) : (
              <div style={{ background: 'var(--surface)', border: '1px solid rgba(70,69,84,0.12)', borderRadius: 12, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(70,69,84,0.1)' }}>
                      {['Flow', 'Target Plan', 'Pitches', 'Converted', 'Rate', 'MRR', ''].map((h) => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {flows.map((f) => (
                      <tr key={f.id} style={{ borderBottom: '1px solid rgba(70,69,84,0.06)' }}>
                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--on-surface)' }}>{f.name}</td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--muted)' }}>
                          {f.targetPlan ? <span style={{ background: 'rgba(217,70,239,0.1)', color: '#d946ef', padding: '2px 8px', borderRadius: 6, fontWeight: 600, fontSize: 11 }}>{f.targetPlan}</span> : '—'}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--on-surface)' }}>{f.totalSuggestions}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--on-surface)' }}>{f.confirmed}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: f.conversionRate >= 20 ? '#10b981' : 'var(--on-surface)', fontWeight: 600 }}>{f.conversionRate}%</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#10b981' }}>${f.attributedMrr.toLocaleString()}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <button onClick={() => setEditFlow(f)} style={{ fontSize: 11, color: 'var(--muted)', background: 'none', border: '1px solid rgba(70,69,84,0.2)', borderRadius: 6, padding: '3px 10px', cursor: 'pointer' }}>Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent attributions */}
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 12 }}>Recent Activity</p>
            {recent.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: 13 }}>No attribution events yet.</p>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {recent.map((a) => (
                  <div key={a.id} style={{
                    background: 'var(--surface)', border: '1px solid rgba(70,69,84,0.1)',
                    borderRadius: 10, padding: '12px 16px',
                    display: 'flex', alignItems: 'center', gap: 14,
                  }}>
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                      background: STATUS_COLORS[a.status] ?? '#94a3b8',
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface)' }}>
                        {a.endUser?.externalId ?? a.endUser?.email ?? 'Unknown user'}
                        <span style={{ fontWeight: 400, color: 'var(--muted)', marginLeft: 8 }}>→ {a.flow?.name ?? '—'}</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>
                        Plan: {a.targetPlan} · {a.status}
                        {a.mrr ? ` · $${a.mrr}/mo` : ''}
                        {' · '}
                        {new Date(a.suggestedAt).toLocaleDateString()}
                      </div>
                    </div>
                    {a.mrr && <span style={{ fontSize: 14, fontWeight: 800, color: '#10b981' }}>${a.mrr}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Edit flow modal */}
      {editFlow && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={(e) => e.target === e.currentTarget && setEditFlow(null)}>
          <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 28, width: 420, border: '1px solid rgba(70,69,84,0.15)' }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 20 }}>{editFlow.name} — Upsell Config</h2>
            <div style={{ display: 'grid', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Target plan slug</label>
                <input style={inputStyle} defaultValue={editFlow.targetPlan ?? ''} id="ef-plan" placeholder="e.g. growth, pro" />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Upgrade URL</label>
                <input style={inputStyle} defaultValue={editFlow.upgradeUrl ?? ''} id="ef-url" placeholder="https://app.yourproduct.com/billing" />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>MRR per conversion ($)</label>
                <input style={inputStyle} type="number" defaultValue={editFlow.mrrPerConversion ?? ''} id="ef-mrr" placeholder="e.g. 99" />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button onClick={() => {
                  const plan = (document.getElementById('ef-plan') as HTMLInputElement).value;
                  const url = (document.getElementById('ef-url') as HTMLInputElement).value;
                  const mrr = parseFloat((document.getElementById('ef-mrr') as HTMLInputElement).value);
                  saveFlow(editFlow.id, { targetPlan: plan || undefined, upgradeUrl: url || undefined, mrrPerConversion: isNaN(mrr) ? undefined : mrr });
                }} disabled={saving} style={{
                  flex: 1, padding: '9px 0', borderRadius: 8, fontWeight: 600, fontSize: 13,
                  background: 'linear-gradient(135deg, #8A2BE2, #6A0DAD)', color: '#fff',
                  border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
                }}>{saving ? 'Saving…' : 'Save'}</button>
                <button onClick={() => setEditFlow(null)} style={{
                  padding: '9px 16px', borderRadius: 8, fontWeight: 600, fontSize: 13,
                  background: 'var(--surface-low)', color: 'var(--muted)',
                  border: '1px solid rgba(70,69,84,0.2)', cursor: 'pointer',
                }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
