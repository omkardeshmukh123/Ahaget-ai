'use client';
import { useEffect, useState, useCallback } from 'react';
import { api, InterfaceSnapshot, InterfaceElement } from '@/lib/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ELEMENT_TYPE_COLORS: Record<string, string> = {
  button: '#6366f1', input: '#10b981', select: '#f59e0b', textarea: '#8b5cf6',
  link: '#3b82f6', modal_trigger: '#ec4899', error_indicator: '#ef4444', unknown: '#6b7280',
};
function typeBadge(t: string) {
  return (
    <span style={{
      background: `${ELEMENT_TYPE_COLORS[t] ?? '#6b7280'}22`,
      color: ELEMENT_TYPE_COLORS[t] ?? '#6b7280',
      border: `1px solid ${ELEMENT_TYPE_COLORS[t] ?? '#6b7280'}44`,
      borderRadius: 5, padding: '2px 8px', fontSize: 10, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.05em',
    }}>
      {t}
    </span>
  );
}
function fmtDate(s: string) {
  return new Date(s).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── Annotation Panel ─────────────────────────────────────────────────────────
function AnnotationPanel({
  element, onClose, onSave,
}: {
  element: InterfaceElement;
  onClose: () => void;
  onSave: (id: string, data: Partial<InterfaceElement>) => void;
}) {
  const [label, setLabel] = useState(element.customLabel ?? '');
  const [desc, setDesc]   = useState(element.customDescription ?? '');
  const [rule, setRule]   = useState(element.businessRule ?? '');
  const [sens, setSens]   = useState(element.isSensitive);
  const [type, setType]   = useState(element.elementType);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.interfaceMap.annotateElement(element.id, {
        customLabel: label, customDescription: desc,
        businessRule: rule, isSensitive: sens, elementType: type,
      });
      onSave(element.id, { customLabel: label, customDescription: desc, businessRule: rule, isSensitive: sens, elementType: type });
      onClose();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const TYPES = ['button','input','select','textarea','link','modal_trigger','error_indicator','unknown'];

  const panelStyle: React.CSSProperties = {
    position: 'fixed', top: 0, right: 0, width: 380, height: '100vh',
    background: 'var(--surface-low)', borderLeft: '1px solid rgba(99,102,241,0.2)',
    zIndex: 200, display: 'flex', flexDirection: 'column',
    boxShadow: '-12px 0 40px rgba(0,0,0,0.3)',
  };

  const field = (label: string, child: React.ReactNode) => (
    <div style={{ marginBottom: 16 }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{label}</p>
      {child}
    </div>
  );

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', background: 'var(--surface)', border: '1px solid rgba(99,102,241,0.2)',
    borderRadius: 8, color: 'var(--on-surface)', fontSize: 13, outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit', resize: 'vertical',
  };

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(99,102,241,0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--on-surface)' }}>Annotate Element</p>
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, fontFamily: 'monospace', wordBreak: 'break-all' }}>
            {element.selector.slice(0, 50)}{element.selector.length > 50 ? '…' : ''}
          </p>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>✕</button>
      </div>

      {/* Meta chip */}
      <div style={{ padding: '10px 20px', background: 'rgba(99,102,241,0.05)', borderBottom: '1px solid rgba(99,102,241,0.08)', display: 'flex', alignItems: 'center', gap: 8 }}>
        {typeBadge(element.elementType)}
        {element.text && <span style={{ fontSize: 12, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>"{element.text.slice(0,50)}"</span>}
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {field('Custom Label', <input value={label} onChange={e => setLabel(e.target.value)} placeholder='e.g. "Billing plan selector"' style={inputStyle} />)}
        {field('Description', <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="What does this element do?" rows={3} style={inputStyle} />)}
        {field('Business Rule', <textarea value={rule} onChange={e => setRule(e.target.value)} placeholder='e.g. "Selecting Personal disables team features"' rows={3} style={inputStyle} />)}
        {field('Element Type Override', (
          <select value={type} onChange={e => setType(e.target.value)} style={inputStyle}>
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        ))}
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: 'var(--muted)' }}>
          <input type="checkbox" checked={sens} onChange={e => setSens(e.target.checked)} style={{ width: 14, height: 14 }} />
          Sensitive — agent won't read or log this field's value
        </label>
      </div>

      {/* Footer */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(99,102,241,0.12)', display: 'flex', gap: 10 }}>
        <button onClick={handleSave} disabled={saving} style={{
          flex: 1, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff',
          border: 'none', borderRadius: 9, padding: '10px', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: saving ? 0.6 : 1,
        }}>
          {saving ? 'Saving…' : 'Save Annotation'}
        </button>
        <button onClick={onClose} style={{
          background: 'rgba(99,102,241,0.1)', color: 'var(--muted)', border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 9, padding: '10px 16px', fontSize: 13, cursor: 'pointer',
        }}>Cancel</button>
      </div>
    </div>
  );
}

// ─── Element row ──────────────────────────────────────────────────────────────
function ElementRow({ el, onAnnotate }: { el: InterfaceElement; onAnnotate: (el: InterfaceElement) => void }) {
  const annotated = !!(el.customLabel || el.customDescription || el.businessRule);
  return (
    <div onClick={() => onAnnotate(el)} style={{
      display: 'grid', gridTemplateColumns: '1fr 2fr 1fr auto',
      alignItems: 'center', gap: 12,
      padding: '10px 16px', borderRadius: 9,
      background: 'var(--surface-low)', border: `1px solid ${annotated ? 'rgba(16,185,129,0.25)' : 'rgba(99,102,241,0.1)'}`,
      cursor: 'pointer', transition: 'all 0.15s',
    }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.07)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface-low)')}
    >
      {/* Type */}
      {typeBadge(el.elementType)}
      {/* Selector + label */}
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: annotated ? 600 : 400, color: 'var(--on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {el.customLabel || el.text || <span style={{ color: 'var(--muted)' }}>No label</span>}
        </p>
        <p style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{el.selector}</p>
      </div>
      {/* Business rule preview */}
      <p style={{ fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {el.businessRule ? el.businessRule.slice(0, 40) + (el.businessRule.length > 40 ? '…' : '') : '—'}
      </p>
      {/* Status */}
      <span style={{
        width: 8, height: 8, borderRadius: '50%',
        background: annotated ? '#10b981' : 'rgba(107,114,128,0.3)',
        flexShrink: 0,
      }} />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function InterfacePage() {
  const [snapshots, setSnapshots]   = useState<InterfaceSnapshot[]>([]);
  const [selected, setSelected]     = useState<(InterfaceSnapshot & { elements: InterfaceElement[] }) | null>(null);
  const [panelEl, setPanelEl]       = useState<InterfaceElement | null>(null);
  const [loading, setLoading]       = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError]           = useState('');
  const [search, setSearch]         = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [archiving, setArchiving]   = useState<string | null>(null);

  // Load snapshot list
  useEffect(() => {
    (async () => {
      try {
        const { snapshots } = await api.interfaceMap.listSnapshots();
        setSnapshots(snapshots);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Load detail
  const openSnapshot = useCallback(async (s: InterfaceSnapshot) => {
    setLoadingDetail(true);
    setPanelEl(null);
    try {
      const { snapshot } = await api.interfaceMap.getSnapshot(s.id);
      setSelected(snapshot);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  // Update element locally after annotation save
  const handleAnnotationSave = useCallback((id: string, data: Partial<InterfaceElement>) => {
    setSelected(prev => {
      if (!prev) return prev;
      const elements = prev.elements.map(e => e.id === id ? { ...e, ...data } : e);
      const annotatedCount = elements.filter(e => e.customLabel || e.customDescription || e.businessRule).length;
      return { ...prev, elements, annotatedCount };
    });
    setSnapshots(prev => prev.map(s => s.id === selected?.id ? { ...s, annotatedCount: selected ? selected.elements.filter(e => e.customLabel || e.customDescription || e.businessRule).length : s.annotatedCount } : s));
  }, [selected]);

  // Archive
  const archiveSnapshot = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Archive this snapshot? It will no longer be used by the agent.')) return;
    setArchiving(id);
    try {
      await api.interfaceMap.archiveSnapshot(id);
      setSnapshots(prev => prev.filter(s => s.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setArchiving(null);
    }
  };

  // Filtered elements
  const filtered = selected?.elements?.filter(el => {
    const matchSearch = !search || [el.selector, el.text, el.customLabel ?? '', el.customDescription ?? '', el.businessRule ?? ''].some(v => v.toLowerCase().includes(search.toLowerCase()));
    const matchType = !typeFilter || el.elementType === typeFilter;
    return matchSearch && matchType;
  }) ?? [];

  const uniqueTypes = [...new Set(selected?.elements?.map(e => e.elementType) ?? [])];

  // ── Styles ────────────────────────────────────────────────────────────────
  const cardStyle: React.CSSProperties = {
    background: 'var(--surface-low)', border: '1px solid rgba(99,102,241,0.12)',
    borderRadius: 12, padding: '16px', cursor: 'pointer', transition: 'all 0.15s',
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
        <div style={{ width: 36, height: 36, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ fontSize: 13 }}>Loading interface maps…</p>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--on-surface)', letterSpacing: '-0.03em', marginBottom: 4 }}>
              Interface Map
            </h1>
            <p style={{ fontSize: 13, color: 'var(--muted)', maxWidth: 540 }}>
              Navigate any page in your product, capture the DOM, then annotate elements with business context. The agent uses this knowledge automatically.
            </p>
          </div>
          {/* Inspector instruction */}
          <div style={{
            background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 10, padding: '12px 16px', maxWidth: 340,
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', marginBottom: 4 }}>HOW TO CAPTURE</p>
            <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
              Add <code style={{ background: 'rgba(99,102,241,0.15)', padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>?ahaget_inspect=1</code> to any URL in your product with the widget installed.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#ef4444', fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '300px 1fr' : '1fr', gap: 20 }}>
        {/* ── Snapshot list ── */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
            Captured Pages ({snapshots.length})
          </p>
          {snapshots.length === 0 ? (
            <div style={{ ...cardStyle, textAlign: 'center', padding: '32px 20px', cursor: 'default' }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>🔍</div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface)', marginBottom: 6 }}>No pages captured yet</p>
              <p style={{ fontSize: 12, color: 'var(--muted)' }}>Add <code style={{ fontSize: 11 }}>?ahaget_inspect=1</code> to any URL in your product to start.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {snapshots.map(s => {
                const isActive = selected?.id === s.id;
                const pct = s.elementCount > 0 ? Math.round((s.annotatedCount / s.elementCount) * 100) : 0;
                return (
                  <div
                    key={s.id}
                    onClick={() => openSnapshot(s)}
                    style={{
                      ...cardStyle,
                      borderColor: isActive ? 'rgba(99,102,241,0.5)' : 'rgba(99,102,241,0.12)',
                      background: isActive ? 'rgba(99,102,241,0.08)' : 'var(--surface-low)',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(99,102,241,0.04)'; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'var(--surface-low)'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{s.title}</p>
                      <button
                        onClick={e => archiveSnapshot(s.id, e)}
                        disabled={archiving === s.id}
                        style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 13, lineHeight: 1, flexShrink: 0, opacity: 0.6 }}
                        title="Archive"
                      >✕</button>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.url}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                      <span style={{ fontSize: 10, color: 'var(--muted)', background: 'rgba(99,102,241,0.1)', borderRadius: 4, padding: '2px 6px' }}>{s.framework}</span>
                      <span style={{ fontSize: 10, color: 'var(--muted)' }}>{s.stateLabel}</span>
                      <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 'auto' }}>{fmtDate(s.capturedAt)}</span>
                    </div>
                    {/* Progress bar */}
                    <div style={{ background: 'rgba(99,102,241,0.1)', borderRadius: 99, height: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#10b981' : 'linear-gradient(90deg,#6366f1,#8b5cf6)', borderRadius: 99, transition: 'width 0.3s' }} />
                    </div>
                    <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>
                      {s.annotatedCount}/{s.elementCount} annotated ({pct}%)
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Element grid ── */}
        {selected && (
          <div>
            {loadingDetail ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--muted)', fontSize: 13 }}>
                <div style={{ width: 24, height: 24, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginRight: 10 }} />
                Loading elements…
              </div>
            ) : (
              <>
                {/* Toolbar */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <input
                      value={search} onChange={e => setSearch(e.target.value)}
                      placeholder="Search elements…"
                      style={{
                        width: '100%', padding: '8px 12px', background: 'var(--surface-low)',
                        border: '1px solid rgba(99,102,241,0.15)', borderRadius: 9, color: 'var(--on-surface)',
                        fontSize: 13, outline: 'none', boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <select
                    value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                    style={{
                      padding: '8px 12px', background: 'var(--surface-low)',
                      border: '1px solid rgba(99,102,241,0.15)', borderRadius: 9, color: 'var(--on-surface)',
                      fontSize: 13, outline: 'none',
                    }}
                  >
                    <option value="">All types</option>
                    {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {/* Stats */}
                  <div style={{ display: 'flex', gap: 12, marginLeft: 'auto' }}>
                    {[
                      { label: 'Total', val: selected.elementCount, color: '#6366f1' },
                      { label: 'Annotated', val: selected.annotatedCount, color: '#10b981' },
                      { label: 'Remaining', val: selected.elementCount - selected.annotatedCount, color: '#f59e0b' },
                    ].map(({ label, val, color }) => (
                      <div key={label} style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: 18, fontWeight: 800, color, lineHeight: 1 }}>{val}</p>
                        <p style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column headers */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr auto', gap: 12, padding: '6px 16px', marginBottom: 6 }}>
                  {['Type', 'Element / Selector', 'Business Rule', ''].map(h => (
                    <p key={h} style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</p>
                  ))}
                </div>

                {/* Rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)', fontSize: 13 }}>
                      No elements match your filter.
                    </div>
                  ) : (
                    filtered.map(el => (
                      <ElementRow key={el.id} el={el} onAnnotate={setPanelEl} />
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Annotation slide-out panel */}
      {panelEl && (
        <>
          <div
            onClick={() => setPanelEl(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 199 }}
          />
          <AnnotationPanel element={panelEl} onClose={() => setPanelEl(null)} onSave={handleAnnotationSave} />
        </>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
