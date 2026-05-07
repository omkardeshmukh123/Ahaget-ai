'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, SessionListItem } from '@/lib/api';

const PAGE_SIZE = 25;

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  completed: { bg: '#ecfdf5', text: '#059669', dot: '#10b981' },
  active:    { bg: '#eff6ff', text: '#2563eb', dot: '#3b82f6' },
  abandoned: { bg: '#fef2f2', text: '#dc2626', dot: '#ef4444' },
};

const FLOW_TYPE_COLORS: Record<string, string> = {
  onboarding: '#6366f1', adoption: '#0ea5e9', upsell: '#f59e0b',
  retention: '#ef4444', support: '#10b981',
};

function fmt(ms: number) {
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m`;
  return `${(ms / 3_600_000).toFixed(1)}h`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [total, setTotal]       = useState(0);
  const [offset, setOffset]     = useState(0);
  const [loading, setLoading]   = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'abandoned'>('all');
  const [search, setSearch]     = useState('');

  useEffect(() => {
    setLoading(true);
    api.sessions.list({
      limit: PAGE_SIZE,
      offset,
      status: statusFilter === 'all' ? undefined : statusFilter,
    }).then((d) => {
      setSessions(d.sessions);
      setTotal(d.total);
    }).finally(() => setLoading(false));
  }, [offset, statusFilter]);

  const filtered = search
    ? sessions.filter((s) =>
        (s.endUser.externalId ?? '').toLowerCase().includes(search.toLowerCase()) ||
        s.flow.name.toLowerCase().includes(search.toLowerCase())
      )
    : sessions;

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>Sessions</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
            Every agent session — what happened, which steps completed, where users dropped off.
          </p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search user or flow…"
          style={{
            padding: '8px 12px', background: 'var(--surface-low)',
            border: '1px solid rgba(70,69,84,0.2)', borderRadius: 8,
            color: 'var(--on-surface)', fontSize: 13, width: 220,
          }}
        />
      </div>

      {/* Status filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['all', 'active', 'completed', 'abandoned'] as const).map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setOffset(0); }}
            style={{
              padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', border: '1px solid',
              background: statusFilter === s
                ? (s === 'all' ? 'var(--on-surface)' : STATUS_COLORS[s]?.bg)
                : 'transparent',
              color: statusFilter === s
                ? (s === 'all' ? 'var(--surface)' : STATUS_COLORS[s]?.text)
                : 'var(--muted)',
              borderColor: statusFilter === s
                ? (s === 'all' ? 'var(--on-surface)' : STATUS_COLORS[s]?.dot)
                : 'rgba(70,69,84,0.2)',
            }}
          >
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)', alignSelf: 'center' }}>
          {total} total
        </span>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid rgba(70,69,84,0.12)', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '64px', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>◎</div>
            <p style={{ fontWeight: 600, color: 'var(--on-surface)', margin: 0 }}>No sessions yet</p>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>
              Sessions appear once users start interacting with your agent flows.
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(70,69,84,0.1)' }}>
                {['User', 'Flow', 'Status', 'Steps done', 'Duration', 'Drop-off', 'Started'].map((h) => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '10px 16px',
                    fontSize: 11, fontWeight: 600, color: 'var(--muted)',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>
                    {h}
                  </th>
                ))}
                <th style={{ padding: '10px 16px' }} />
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const sc = STATUS_COLORS[s.status] ?? STATUS_COLORS.abandoned;
                const fc = FLOW_TYPE_COLORS[s.flow.flowType] ?? '#6366f1';
                return (
                  <tr key={s.id} style={{ borderBottom: '1px solid rgba(70,69,84,0.06)' }}>
                    {/* User */}
                    <td style={{ padding: '12px 16px', fontWeight: 500, color: 'var(--on-surface)' }}>
                      {s.endUser.externalId
                        ? <code style={{ fontSize: 12, background: 'var(--surface-low)', padding: '2px 6px', borderRadius: 4 }}>{s.endUser.externalId}</code>
                        : <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>anonymous</span>}
                    </td>
                    {/* Flow */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        background: `${fc}18`, color: fc,
                        border: `1px solid ${fc}30`, borderRadius: 6,
                        padding: '2px 8px', fontSize: 11, fontWeight: 600,
                      }}>
                        {s.flow.name}
                      </span>
                    </td>
                    {/* Status */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        background: sc.bg, color: sc.text,
                        border: `1px solid ${sc.dot}30`, borderRadius: 20,
                        padding: '2px 10px', fontSize: 11, fontWeight: 600,
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot, display: 'inline-block' }} />
                        {s.status}
                      </span>
                    </td>
                    {/* Steps */}
                    <td style={{ padding: '12px 16px', color: 'var(--on-surface)', fontWeight: 600 }}>
                      {s.stepsCompleted}
                      {s.firstValueAt && (
                        <span style={{ marginLeft: 6, fontSize: 11, color: '#f59e0b' }} title="Reached first value milestone">⭐</span>
                      )}
                    </td>
                    {/* Duration */}
                    <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>
                      {fmt(s.durationMs)}
                    </td>
                    {/* Drop-off */}
                    <td style={{ padding: '12px 16px' }}>
                      {s.dropReason ? (
                        <span style={{ fontSize: 11, color: '#dc2626', background: '#fef2f2', padding: '2px 6px', borderRadius: 4 }}>
                          {s.dropReason.replace(/_/g, ' ')}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--muted)', fontSize: 12 }}>—</span>
                      )}
                    </td>
                    {/* Date */}
                    <td style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: 12 }}>
                      {fmtDate(s.startedAt)}
                    </td>
                    {/* Action */}
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <Link
                        href={`/sessions/${s.id}`}
                        style={{ fontSize: 12, fontWeight: 600, color: '#FF857A', textDecoration: 'none' }}
                      >
                        Replay →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {!loading && total > PAGE_SIZE && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 20px', borderTop: '1px solid rgba(70,69,84,0.1)',
            fontSize: 12, color: 'var(--muted)',
          }}>
            <span>Showing {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                style={{
                  padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                  background: 'var(--surface-low)', border: '1px solid rgba(70,69,84,0.2)',
                  color: 'var(--muted)', cursor: offset === 0 ? 'not-allowed' : 'pointer',
                  opacity: offset === 0 ? 0.4 : 1,
                }}
              >
                ← Prev
              </button>
              <button
                disabled={offset + PAGE_SIZE >= total}
                onClick={() => setOffset(offset + PAGE_SIZE)}
                style={{
                  padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                  background: 'var(--surface-low)', border: '1px solid rgba(70,69,84,0.2)',
                  color: 'var(--muted)', cursor: offset + PAGE_SIZE >= total ? 'not-allowed' : 'pointer',
                  opacity: offset + PAGE_SIZE >= total ? 0.4 : 1,
                }}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
