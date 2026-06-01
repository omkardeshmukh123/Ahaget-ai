'use client';
import { useEffect, useState } from 'react';
import { api, FlowExperiment, ExperimentResults, OnboardingFlow } from '@/lib/api';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function pct(n: number) { return `${Math.round(n * 100)}%`; }

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  running:   { bg: 'rgba(59,130,246,0.1)',  text: '#3b82f6' },
  paused:    { bg: 'rgba(245,158,11,0.1)',  text: '#d97706' },
  concluded: { bg: 'rgba(16,185,129,0.1)',  text: '#059669' },
};

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState<FlowExperiment[]>([]);
  const [flows, setFlows]             = useState<OnboardingFlow[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [results, setResults]         = useState<ExperimentResults | null>(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [showCreate, setShowCreate]   = useState(false);
  const [form, setForm] = useState({ name: '', controlFlowId: '', variantFlowId: '', trafficSplit: 50 });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    Promise.all([api.experiments.list(), api.flow.list()])
      .then(([exps, fls]) => {
        setExperiments(exps.experiments);
        setFlows(fls.flows);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function loadResults(id: string) {
    setSelectedId(id);
    setResultsLoading(true);
    setResults(null);
    try {
      const r = await api.experiments.results(id);
      setResults(r);
    } catch { /* show empty */ }
    setResultsLoading(false);
  }

  async function handleCreate() {
    if (!form.name || !form.controlFlowId || !form.variantFlowId) {
      setCreateError('All fields are required');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      const { experiment } = await api.experiments.create(form);
      setExperiments((prev) => [experiment, ...prev]);
      setShowCreate(false);
      setForm({ name: '', controlFlowId: '', variantFlowId: '', trafficSplit: 50 });
    } catch (e: unknown) {
      setCreateError(e instanceof Error ? e.message : 'Failed to create');
    } finally {
      setCreating(false);
    }
  }

  async function handleDeclareWinner(expId: string, winnerId: string) {
    await api.experiments.update(expId, { status: 'concluded', winnerId });
    setExperiments((prev) =>
      prev.map((e) => e.id === expId ? { ...e, status: 'concluded', winnerId } : e)
    );
    if (results && results.experiment.id === expId) {
      setResults((r) => r ? { ...r, experiment: { ...r.experiment, status: 'concluded', winnerId } } : r);
    }
  }

  if (loading) return <div style={{ padding: 48, color: 'var(--muted)', fontSize: 13 }}>Loading…</div>;
  if (error)   return <div style={{ padding: 48, color: '#ef4444', fontSize: 13 }}>{error}</div>;

  const selected = experiments.find((e) => e.id === selectedId);

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>A/B Experiments</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
            Compare two flow variants to find what converts better.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: 'linear-gradient(135deg, #8A2BE2, #6A0DAD)',
            color: '#fff', border: 'none', cursor: 'pointer',
            boxShadow: '0 0 12px rgba(138,43,226,0.25)',
          }}
        >
          + New Experiment
        </button>
      </div>

      {experiments.length === 0 ? (
        <div style={{
          background: 'var(--surface)', border: '1px solid rgba(70,69,84,0.12)',
          borderRadius: 12, padding: 48, textAlign: 'center',
        }}>
          <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0 }}>
            No experiments yet. Create one to start comparing flow variants.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selectedId ? '360px 1fr' : '1fr', gap: 20, alignItems: 'start' }}>
          {/* List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {experiments.map((exp) => {
              const sc = STATUS_COLORS[exp.status] ?? STATUS_COLORS.paused;
              const isSelected = exp.id === selectedId;
              return (
                <div
                  key={exp.id}
                  onClick={() => loadResults(exp.id)}
                  style={{
                    background: 'var(--surface)', border: `1px solid ${isSelected ? '#8A2BE2' : 'rgba(70,69,84,0.12)'}`,
                    borderRadius: 10, padding: '14px 16px', cursor: 'pointer',
                    boxShadow: isSelected ? '0 0 0 2px rgba(138,43,226,0.2)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--on-surface)' }}>{exp.name}</p>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: sc.bg, color: sc.text }}>
                      {exp.status}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)' }}>
                    {exp.controlFlow?.name} vs {exp.variantFlow?.name}
                  </p>
                  <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 11, color: 'var(--muted)' }}>
                    <span>Control: {exp.controlSessions ?? 0} sessions</span>
                    <span>Variant: {exp.variantSessions ?? 0} sessions</span>
                  </div>
                  <p style={{ margin: '6px 0 0', fontSize: 10, color: 'var(--muted)' }}>
                    Started {fmtDate(exp.startedAt)} · {exp.trafficSplit}% to variant
                  </p>
                </div>
              );
            })}
          </div>

          {/* Results panel */}
          {selectedId && (
            <div style={{ background: 'var(--surface)', border: '1px solid rgba(70,69,84,0.12)', borderRadius: 12, overflow: 'hidden' }}>
              {resultsLoading ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                  Loading results…
                </div>
              ) : results ? (
                <div>
                  {/* Header */}
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(70,69,84,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--on-surface)' }}>
                      {results.experiment.name}
                    </h2>
                    {results.experiment.status === 'running' && results.significant && !results.experiment.winnerId && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        {[
                          { label: `Control wins`, id: results.experiment.controlFlow.id },
                          { label: `Variant wins`, id: results.experiment.variantFlow.id },
                        ].map(({ label, id }) => (
                          <button
                            key={id}
                            onClick={() => handleDeclareWinner(results.experiment.id, id)}
                            style={{
                              padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                              background: 'rgba(138,43,226,0.1)', color: '#8A2BE2',
                              border: '1px solid rgba(138,43,226,0.3)', cursor: 'pointer',
                            }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Stats grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                    {([
                      { label: results.experiment.controlFlow.name + ' (control)', arm: results.control, flowId: results.experiment.controlFlow.id },
                      { label: results.experiment.variantFlow.name + ' (variant)', arm: results.variant, flowId: results.experiment.variantFlow.id },
                    ] as const).map(({ label, arm, flowId }) => {
                      const isWinner = results.experiment.winnerId === flowId;
                      return (
                        <div key={label} style={{
                          padding: '20px', borderRight: label.includes('control') ? '1px solid rgba(70,69,84,0.1)' : undefined,
                          background: isWinner ? 'rgba(16,185,129,0.04)' : 'transparent',
                        }}>
                          <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: 'var(--on-surface)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            {label}
                            {isWinner && <span style={{ fontSize: 10, background: '#ecfdf5', color: '#059669', border: '1px solid #86efac', padding: '1px 6px', borderRadius: 4 }}>Winner</span>}
                          </p>
                          {[
                            ['Sessions', String(arm.total)],
                            ['Completed', String(arm.completed)],
                            ['Completion rate', pct(arm.completionRate)],
                            ['Avg time', arm.avgTimeMs ? `${Math.round(arm.avgTimeMs / 60000)}m` : '—'],
                          ].map(([k, v]) => (
                            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                              <span style={{ color: 'var(--muted)' }}>{k}</span>
                              <span style={{ fontWeight: 600, color: 'var(--on-surface)' }}>{v}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>

                  {/* Significance */}
                  <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(70,69,84,0.1)', display: 'flex', gap: 20, fontSize: 12 }}>
                    <div>
                      <span style={{ color: 'var(--muted)' }}>Z-score </span>
                      <strong style={{ color: 'var(--on-surface)' }}>{results.zScore}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--muted)' }}>Lift </span>
                      <strong style={{ color: results.lift !== null && results.lift > 0 ? '#10b981' : results.lift !== null && results.lift < 0 ? '#ef4444' : 'var(--on-surface)' }}>
                        {results.lift !== null ? `${results.lift > 0 ? '+' : ''}${results.lift}%` : '—'}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--muted)' }}>Significance </span>
                      {(results.control.total < 10 || results.variant.total < 10) ? (
                        <span style={{ color: '#d97706', fontWeight: 600 }}>Not enough data (need 10+ per arm)</span>
                      ) : results.significant ? (
                        <span style={{ color: '#10b981', fontWeight: 600 }}>95% confident</span>
                      ) : (
                        <span style={{ color: 'var(--muted)', fontWeight: 600 }}>Not significant yet</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                  No results yet — sessions will appear once the experiment runs.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}
        >
          <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 28, width: 440, maxWidth: '90vw' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: 'var(--on-surface)' }}>
              New A/B Experiment
            </h2>
            {[
              { label: 'Experiment name', key: 'name', type: 'text', placeholder: 'e.g. Short vs. long onboarding' },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 600, color: 'var(--on-surface)' }}>{label}</p>
                <input
                  type={type}
                  placeholder={placeholder}
                  value={(form as Record<string, unknown>)[key] as string}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  style={{
                    width: '100%', boxSizing: 'border-box', padding: '8px 12px',
                    borderRadius: 8, fontSize: 13, background: 'var(--surface-low)',
                    border: '1px solid rgba(70,69,84,0.2)', color: 'var(--on-surface)', outline: 'none',
                  }}
                />
              </div>
            ))}
            {(['controlFlowId', 'variantFlowId'] as const).map((key) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 600, color: 'var(--on-surface)' }}>
                  {key === 'controlFlowId' ? 'Control flow' : 'Variant flow'}
                </p>
                <select
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 13,
                    background: 'var(--surface-low)', border: '1px solid rgba(70,69,84,0.2)',
                    color: 'var(--on-surface)', outline: 'none',
                  }}
                >
                  <option value="">Select a flow…</option>
                  {flows.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
            ))}
            <div style={{ marginBottom: 14 }}>
              <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 600, color: 'var(--on-surface)' }}>
                Traffic to variant: {form.trafficSplit}%
              </p>
              <input
                type="range" min={10} max={90} step={5}
                value={form.trafficSplit}
                onChange={(e) => setForm((f) => ({ ...f, trafficSplit: Number(e.target.value) }))}
                style={{ width: '100%' }}
              />
            </div>
            {createError && <p style={{ fontSize: 12, color: '#ef4444', margin: '0 0 12px' }}>{createError}</p>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => { setShowCreate(false); setCreateError(''); }}
                style={{ padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'var(--surface-low)', border: '1px solid rgba(70,69,84,0.2)', color: 'var(--muted)', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                style={{
                  padding: '7px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: creating ? 'rgba(138,43,226,0.4)' : 'linear-gradient(135deg, #8A2BE2, #6A0DAD)',
                  color: '#fff', border: 'none', cursor: creating ? 'not-allowed' : 'pointer',
                }}
              >
                {creating ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
