'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, EscalationTicket } from '@/lib/api';

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  open:        { bg: '#fef2f2', text: '#dc2626', dot: '#ef4444' },
  in_progress: { bg: '#EBD9FF', text: '#6B1CAE', dot: '#8A2BE2' },
  resolved:    { bg: '#F5EEFF', text: '#7B22C9', dot: '#8A2BE2' },
};

const TRIGGER_META: Record<string, { label: string; bg: string; text: string }> = {
  agent_detected: { label: 'Auto',   bg: '#F5EEFF', text: '#7B22C9' },
  user_requested: { label: 'User',   bg: '#EBD9FF', text: '#6B1CAE' },
  manual:         { label: 'Manual', bg: '#fef3c7', text: '#92400e' },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

type StatusFilter = 'open' | 'in_progress' | 'resolved';

export default function EscalationsPage() {
  const [tickets, setTickets]   = useState<EscalationTicket[]>([]);
  const [counts, setCounts]     = useState({ open: 0, in_progress: 0, resolved: 0 });
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('open');
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.escalations.list(statusFilter)
      .then((d) => { setTickets(d.tickets); setCounts(d.counts); })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>Escalations</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
          Sessions handed off to your team — by the agent automatically or manually.
        </p>
      </div>

      {/* Status tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {([
          { key: 'open' as const,        label: 'Open',        count: counts.open },
          { key: 'in_progress' as const, label: 'In progress', count: counts.in_progress },
          { key: 'resolved' as const,    label: 'Resolved',    count: counts.resolved },
        ]).map(({ key, label, count }) => {
          const sc = STATUS_COLORS[key];
          const active = statusFilter === key;
          return (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              style={{
                padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', border: '1px solid',
                background: active ? sc.bg : 'transparent',
                color: active ? sc.text : 'var(--muted)',
                borderColor: active ? sc.dot : 'rgba(70,69,84,0.2)',
              }}
            >
              {label} · {count}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid rgba(70,69,84,0.12)', borderRadius: 12, overflow: 'hidden' }}>
        {error ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <p style={{ color: 'var(--error)', fontSize: 13, marginBottom: 12 }}>{error}</p>
            <button
              onClick={() => { setError(null); setLoading(true); }}
              style={{ fontSize: 12, padding: '6px 14px', borderRadius: 6, background: 'var(--surface-low)', border: '1px solid rgba(70,69,84,0.2)', color: 'var(--muted)', cursor: 'pointer' }}
            >
              Retry
            </button>
          </div>
        ) : loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Loading…</div>
        ) : tickets.length === 0 ? (
          <div style={{ padding: '72px 48px', textAlign: 'center' }}>
            {statusFilter === 'open' ? (
              <>
                <div style={{ fontSize: 40, marginBottom: 16, lineHeight: 1 }}>🎉</div>
                <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--on-surface)', margin: '0 0 8px' }}>Inbox zero</p>
                <p style={{ color: 'var(--muted)', fontSize: 13, margin: '0 0 24px', maxWidth: 360, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
                  No open escalations. Escalations are created when the agent can't resolve a user's issue on its own — a healthy inbox means your flows are working.
                </p>
                <a
                  href="/sessions"
                  style={{
                    display: 'inline-block', background: 'transparent', color: 'var(--muted)',
                    textDecoration: 'none', padding: '8px 20px', borderRadius: 8,
                    fontSize: 13, fontWeight: 600, border: '1px solid rgba(70,69,84,0.2)',
                  }}
                >
                  View sessions →
                </a>
              </>
            ) : (
              <>
                <div style={{ fontSize: 40, marginBottom: 16, lineHeight: 1 }}>✓</div>
                <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--on-surface)', margin: '0 0 8px' }}>
                  No {statusFilter.replace('_', ' ')} tickets
                </p>
                <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>
                  {statusFilter === 'resolved' ? 'Resolved tickets will appear here once your team closes them.' : 'Tickets being worked on will appear here.'}
                </p>
              </>
            )}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(70,69,84,0.1)' }}>
                {['Trigger', 'Reason', 'User', 'Status', 'Created'].map((h) => (
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
              {tickets.map((t) => {
                const sc = STATUS_COLORS[t.status] ?? STATUS_COLORS.open;
                const tm = TRIGGER_META[t.trigger] ?? TRIGGER_META.agent_detected;
                const externalId = (t.userMetadata as Record<string, unknown>)?.externalId as string | undefined;
                return (
                  <tr key={t.id} style={{ borderBottom: '1px solid rgba(70,69,84,0.06)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                        background: tm.bg, color: tm.text,
                      }}>
                        {tm.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--on-surface)', maxWidth: 300 }}>
                      <span style={{
                        display: '-webkit-box', overflow: 'hidden',
                        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      } as React.CSSProperties}>
                        {t.reason}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {externalId
                        ? <code style={{ fontSize: 11, background: 'var(--surface-low)', padding: '2px 6px', borderRadius: 4 }}>{externalId}</code>
                        : <span style={{ color: 'var(--muted)', fontStyle: 'italic', fontSize: 12 }}>anonymous</span>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        background: sc.bg, color: sc.text,
                        border: `1px solid ${sc.dot}30`, borderRadius: 20,
                        padding: '2px 10px', fontSize: 11, fontWeight: 600,
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot, display: 'inline-block' }} />
                        {t.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: 12 }}>
                      {fmtDate(t.createdAt)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <Link
                        href={`/escalations/${t.id}`}
                        style={{ fontSize: 12, fontWeight: 600, color: '#8A2BE2', textDecoration: 'none' }}
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
