'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, EscalationTicket } from '@/lib/api';

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  open:        { bg: '#fef2f2', text: '#dc2626', dot: '#ef4444' },
  in_progress: { bg: '#eff6ff', text: '#2563eb', dot: '#3b82f6' },
  resolved:    { bg: '#ecfdf5', text: '#059669', dot: '#10b981' },
};

const TRIGGER_META: Record<string, { label: string; bg: string; text: string }> = {
  agent_detected: { label: 'Auto',   bg: '#fef3c7', text: '#92400e' },
  user_requested: { label: 'User',   bg: '#f3e8ff', text: '#6d28d9' },
  manual:         { label: 'Manual', bg: '#e0f2fe', text: '#0369a1' },
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

  useEffect(() => {
    setLoading(true);
    api.escalations.list(statusFilter)
      .then((d) => { setTickets(d.tickets); setCounts(d.counts); })
      .finally(() => setLoading(false));
  }, [statusFilter]);

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100 }}>
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
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Loading…</div>
        ) : tickets.length === 0 ? (
          <div style={{ padding: 64, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
            <p style={{ fontWeight: 600, color: 'var(--on-surface)', margin: 0 }}>No {statusFilter.replace('_', ' ')} tickets</p>
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
                        style={{ fontSize: 12, fontWeight: 600, color: '#FF857A', textDecoration: 'none' }}
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
