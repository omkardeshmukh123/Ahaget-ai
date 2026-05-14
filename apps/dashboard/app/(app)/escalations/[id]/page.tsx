'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api, EscalationTicketDetail } from '@/lib/api';

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  open:        { bg: '#fef2f2', text: '#dc2626', dot: '#ef4444' },
  in_progress: { bg: '#eff6ff', text: '#2563eb', dot: '#3b82f6' },
  resolved:    { bg: '#ecfdf5', text: '#059669', dot: '#10b981' },
};

const TRIGGER_META: Record<string, { label: string; bg: string; text: string }> = {
  agent_detected: { label: 'Auto-escalated',   bg: '#fef3c7', text: '#92400e' },
  user_requested: { label: 'User requested',   bg: '#f3e8ff', text: '#6d28d9' },
  manual:         { label: 'Manual hand-off',  bg: '#e0f2fe', text: '#0369a1' },
};

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function EscalationDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const [ticket, setTicket]   = useState<EscalationTicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [updating, setUpdating] = useState(false);
  const [notes, setNotes]     = useState('');
  const [saved, setSaved]     = useState(false);

  useEffect(() => {
    api.escalations.get(id)
      .then((d) => {
        setTicket(d.ticket);
        setNotes(d.ticket.notes ?? '');
      })
      .catch(() => setError('Ticket not found'))
      .finally(() => setLoading(false));
  }, [id]);

  async function updateStatus(status: string) {
    if (!ticket) return;
    setUpdating(true);
    try {
      const { ticket: updated } = await api.escalations.update(id, { status });
      setTicket((t) => t ? { ...t, status: updated.status as EscalationTicketDetail['status'] } : t);
    } finally {
      setUpdating(false);
    }
  }

  async function saveNotes() {
    if (!ticket) return;
    setUpdating(true);
    try {
      await api.escalations.update(id, { notes });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setUpdating(false);
    }
  }

  if (loading) return (
    <div style={{ padding: 48, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Loading…</div>
  );
  if (error || !ticket) return (
    <div style={{ padding: 48, textAlign: 'center', color: '#ef4444', fontSize: 13 }}>{error || 'Not found'}</div>
  );

  const sc = STATUS_COLORS[ticket.status] ?? STATUS_COLORS.open;
  const tm = TRIGGER_META[ticket.trigger] ?? TRIGGER_META.agent_detected;

  return (
    <div style={{ padding: '24px 32px', maxWidth: 900 }}>
      {/* Back */}
      <button
        onClick={() => router.push('/escalations')}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 13, marginBottom: 16, padding: 0 }}
      >
        ← Back to escalations
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>Escalation Ticket</h1>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, fontFamily: 'monospace' }}>{ticket.id}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: tm.bg, color: tm.text }}>
            {tm.label}
          </span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: sc.bg, color: sc.text,
            border: `1px solid ${sc.dot}40`, borderRadius: 20,
            padding: '4px 12px', fontSize: 12, fontWeight: 600,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: sc.dot, display: 'inline-block' }} />
            {ticket.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Session link — the key bidirectional link */}
      {ticket.sessionId && (
        <div style={{
          background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10,
          padding: '12px 16px', marginBottom: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: 13,
        }}>
          <span style={{ color: '#1e40af' }}>This ticket was created from a session replay.</span>
          <Link
            href={`/sessions/${ticket.sessionId}`}
            style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', textDecoration: 'none' }}
          >
            View session →
          </Link>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Context */}
        <div style={{ background: 'var(--surface)', border: '1px solid rgba(70,69,84,0.12)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(70,69,84,0.1)' }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--on-surface)' }}>Context</p>
          </div>
          <div style={{ padding: '14px 20px', display: 'grid', gap: 10 }}>
            {[
              { label: 'Flow',       value: ticket.context.flowName },
              { label: 'Step',       value: ticket.context.stepTitle },
              { label: 'Created',    value: fmtDate(ticket.createdAt) },
              { label: 'Resolved',   value: fmtDate(ticket.resolvedAt) },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, gap: 12 }}>
                <span style={{ color: 'var(--muted)', fontWeight: 600, flexShrink: 0 }}>{label}</span>
                <span style={{ color: 'var(--on-surface)', textAlign: 'right' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status actions */}
        <div style={{ background: 'var(--surface)', border: '1px solid rgba(70,69,84,0.12)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(70,69,84,0.1)' }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--on-surface)' }}>Update Status</p>
          </div>
          <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(['open', 'in_progress', 'resolved'] as const).map((s) => {
              const ssc = STATUS_COLORS[s];
              const active = ticket.status === s;
              return (
                <button
                  key={s}
                  disabled={active || updating}
                  onClick={() => updateStatus(s)}
                  style={{
                    padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    border: `1px solid ${active ? ssc.dot : 'rgba(70,69,84,0.2)'}`,
                    background: active ? ssc.bg : 'transparent',
                    color: active ? ssc.text : 'var(--muted)',
                    cursor: active || updating ? 'default' : 'pointer',
                    opacity: updating && !active ? 0.5 : 1,
                    textAlign: 'left',
                  }}
                >
                  {active ? '● ' : '○ '}{s.replace('_', ' ')}
                  {active && ' (current)'}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Reason */}
      <div style={{ background: 'var(--surface)', border: '1px solid rgba(70,69,84,0.12)', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(70,69,84,0.1)' }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--on-surface)' }}>Reason</p>
        </div>
        <div style={{ padding: '14px 20px' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--on-surface)', lineHeight: 1.6 }}>{ticket.reason}</p>
          {ticket.agentMessage && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--surface-low)', borderRadius: 8, borderLeft: '3px solid #6366f1' }}>
              <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 600, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Last agent message
              </p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--on-surface)', lineHeight: 1.6 }}>{ticket.agentMessage}</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent messages */}
      {ticket.context.recentMessages.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid rgba(70,69,84,0.12)', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(70,69,84,0.1)' }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--on-surface)' }}>Recent Messages</p>
          </div>
          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 320, overflowY: 'auto' }}>
            {ticket.context.recentMessages.map((m, i) => {
              const isUser = m.role === 'user';
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '82%',
                    background: isUser ? 'linear-gradient(135deg, #FF857A22, #EBAEE622)' : 'var(--surface-low)',
                    border: `1px solid ${isUser ? 'rgba(255,133,122,0.25)' : 'rgba(70,69,84,0.12)'}`,
                    borderRadius: isUser ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                    padding: '8px 12px',
                  }}>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--on-surface)', lineHeight: 1.5 }}>{m.content}</p>
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3 }}>{m.role}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Notes */}
      <div style={{ background: 'var(--surface)', border: '1px solid rgba(70,69,84,0.12)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(70,69,84,0.1)' }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--on-surface)' }}>Notes</p>
        </div>
        <div style={{ padding: '14px 20px' }}>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add internal notes for your team…"
            rows={4}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '10px 12px', borderRadius: 8, fontSize: 13,
              background: 'var(--surface-low)', border: '1px solid rgba(70,69,84,0.2)',
              color: 'var(--on-surface)', resize: 'vertical', outline: 'none',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
            <button
              onClick={saveNotes}
              disabled={updating}
              style={{
                padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                background: saved ? '#ecfdf5' : 'var(--surface-low)',
                border: `1px solid ${saved ? '#10b981' : 'rgba(70,69,84,0.2)'}`,
                color: saved ? '#059669' : 'var(--muted)',
                cursor: updating ? 'not-allowed' : 'pointer',
              }}
            >
              {saved ? '✓ Saved' : 'Save notes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
