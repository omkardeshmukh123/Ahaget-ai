'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, SessionDetail, SessionMessage } from '@/lib/api';

function fmt(ms: number) {
  if (!ms) return '—';
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m`;
  return `${(ms / 3_600_000).toFixed(1)}h`;
}

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

const ACTION_BADGE: Record<string, { label: string; color: string }> = {
  ask_clarification:   { label: 'question',   color: '#6366f1' },
  execute_page_action: { label: 'action',      color: '#0ea5e9' },
  complete_step:       { label: 'step done',   color: '#10b981' },
  celebrate_milestone: { label: 'milestone',   color: '#f59e0b' },
  escalate_to_human:   { label: 'escalated',   color: '#ef4444' },
  chat:                { label: 'chat',         color: '#94a3b8' },
  goal_complete:       { label: 'goal done',   color: '#10b981' },
  degrade_to_manual:   { label: 'manual step', color: '#f97316' },
};

function ChatTranscript({
  messages,
  activeStepId,
}: {
  messages: SessionMessage[];
  activeStepId: string | null;
}) {
  const visible = activeStepId
    ? messages.filter((m) => m.stepId === activeStepId || m.stepId === null)
    : messages;

  if (visible.length === 0) return null;

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid rgba(70,69,84,0.12)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(70,69,84,0.1)' }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--on-surface)' }}>Chat Transcript</p>
        <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--muted)' }}>
          {activeStepId ? 'Showing messages for selected step' : 'Full session transcript'}
        </p>
      </div>
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 420, overflowY: 'auto' }}>
        {visible.map((m) => {
          const isUser = m.role === 'user';
          const badge = m.actionType ? ACTION_BADGE[m.actionType] : null;
          return (
            <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '82%',
                background: isUser ? 'linear-gradient(135deg, #FF857A22, #EBAEE622)' : 'var(--surface-low)',
                border: `1px solid ${isUser ? 'rgba(255,133,122,0.25)' : 'rgba(70,69,84,0.12)'}`,
                borderRadius: isUser ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                padding: '8px 12px',
              }}>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--on-surface)', lineHeight: 1.5 }}>{m.content}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                {badge && (
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
                    background: `${badge.color}18`, color: badge.color, border: `1px solid ${badge.color}30`,
                  }}>
                    {badge.label}
                  </span>
                )}
                {m.feedback === 1 && <span style={{ fontSize: 10, color: '#10b981' }}>👍</span>}
                {m.feedback === -1 && <span style={{ fontSize: 10, color: '#ef4444' }}>👎</span>}
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>
                  {new Date(m.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const STATUS_ICON: Record<string, { icon: string; color: string; label: string }> = {
  completed:   { icon: '✓', color: '#10b981', label: 'Completed' },
  in_progress: { icon: '●', color: '#3b82f6', label: 'In progress' },
  dropped:     { icon: '✗', color: '#ef4444', label: 'Dropped' },
  skipped:     { icon: '→', color: '#f59e0b', label: 'Skipped' },
  not_started: { icon: '○', color: '#94a3b8', label: 'Not started' },
};

const SESSION_STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  completed: { bg: '#ecfdf5', text: '#059669', dot: '#10b981' },
  active:    { bg: '#eff6ff', text: '#2563eb', dot: '#3b82f6' },
  abandoned: { bg: '#fef2f2', text: '#dc2626', dot: '#ef4444' },
};

export default function SessionReplayPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [activeStep, setActiveStep] = useState<string | null>(null);

  useEffect(() => {
    api.sessions.get(id)
      .then((d) => {
        setSession(d.session);
        // Auto-select first non-completed or dropped step for focus
        const focus = d.session.steps.find((s) =>
          s.outcome === 'dropped' || s.status === 'in_progress'
        ) ?? d.session.steps[0];
        if (focus) setActiveStep(focus.stepId);
      })
      .catch(() => setError('Session not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={{ padding: 48, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
      Loading session…
    </div>
  );
  if (error || !session) return (
    <div style={{ padding: 48, textAlign: 'center', color: '#ef4444', fontSize: 13 }}>
      {error || 'Session not found'}
    </div>
  );

  const sc = SESSION_STATUS_COLORS[session.status] ?? SESSION_STATUS_COLORS.abandoned;
  const totalSteps = session.steps.length;
  const doneSteps  = session.steps.filter((s) => s.status === 'completed').length;
  const dropStep   = session.steps.find((s) => s.outcome === 'dropped');
  const totalMs    = session.steps.reduce((acc, s) => acc + (s.timeSpentMs ?? 0), 0);
  const collectedEntries = Object.entries(
    (session.collectedData ?? {}) as Record<string, unknown>
  );
  const selectedStep = session.steps.find((s) => s.stepId === activeStep);

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1080 }}>
      {/* Back + header */}
      <button
        onClick={() => router.push('/sessions')}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 13, marginBottom: 16, padding: 0 }}
      >
        ← Back to sessions
      </button>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>
            Session Replay
          </h1>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, fontFamily: 'monospace' }}>
            {session.id}
          </p>
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: sc.bg, color: sc.text,
          border: `1px solid ${sc.dot}40`, borderRadius: 20,
          padding: '4px 12px', fontSize: 12, fontWeight: 600,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: sc.dot, display: 'inline-block' }} />
          {session.status}
        </span>
      </div>

      {/* Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Flow',          value: session.flow.name },
          { label: 'User',          value: session.endUser.externalId ?? 'anonymous' },
          { label: 'Steps',         value: `${doneSteps} / ${totalSteps}` },
          { label: 'Time spent',    value: fmt(totalMs) },
          { label: 'Started',       value: fmtDate(session.startedAt) },
        ].map(({ label, value }) => (
          <div key={label} style={{
            background: 'var(--surface)', border: '1px solid rgba(70,69,84,0.12)',
            borderRadius: 10, padding: '14px 16px',
          }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
              {label}
            </p>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--on-surface)', margin: '4px 0 0', wordBreak: 'break-all' }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Drop-off banner */}
      {dropStep && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
          padding: '12px 16px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 10, fontSize: 13,
        }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div>
            <strong style={{ color: '#dc2626' }}>Drop-off detected</strong>
            <span style={{ color: '#7f1d1d', marginLeft: 8 }}>
              at step {dropStep.order + 1}: <em>{dropStep.title}</em>
              {dropStep.dropReason && ` — ${dropStep.dropReason.replace(/_/g, ' ')}`}
            </span>
          </div>
        </div>
      )}

      {/* Milestone banner */}
      {session.firstValueAt && (
        <div style={{
          background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 10,
          padding: '12px 16px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 10, fontSize: 13,
        }}>
          <span style={{ fontSize: 18 }}>⭐</span>
          <span style={{ color: '#92400e' }}>
            <strong>First value reached</strong> at {fmtDate(session.firstValueAt)}
          </span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, alignItems: 'start' }}>
        {/* ── Left: step timeline ────────────────────────────────────── */}
        <div style={{ background: 'var(--surface)', border: '1px solid rgba(70,69,84,0.12)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(70,69,84,0.1)' }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--on-surface)' }}>Step Timeline</p>
          </div>
          <div style={{ padding: '8px 0' }}>
            {session.steps.map((step, idx) => {
              const meta = STATUS_ICON[step.status] ?? STATUS_ICON.not_started;
              const isSelected = activeStep === step.stepId;
              return (
                <button
                  key={step.stepId}
                  onClick={() => setActiveStep(step.stepId)}
                  style={{
                    width: '100%', textAlign: 'left', background: isSelected ? `${meta.color}10` : 'none',
                    border: 'none', borderLeft: isSelected ? `3px solid ${meta.color}` : '3px solid transparent',
                    padding: '10px 16px', cursor: 'pointer', display: 'block',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: '50%', border: `2px solid ${meta.color}`,
                      background: step.status === 'completed' ? meta.color : 'transparent',
                      color: step.status === 'completed' ? '#fff' : meta.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, flexShrink: 0,
                    }}>
                      {meta.icon}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        margin: 0, fontSize: 12, fontWeight: 600,
                        color: 'var(--on-surface)', overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {idx + 1}. {step.title}
                      </p>
                      <p style={{ margin: 0, fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>
                        {meta.label}{step.timeSpentMs > 0 ? ` · ${fmt(step.timeSpentMs)}` : ''}
                        {step.isMilestone && ' ⭐'}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Right: step detail + data ──────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Step detail card */}
          {selectedStep ? (
            <div style={{ background: 'var(--surface)', border: '1px solid rgba(70,69,84,0.12)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(70,69,84,0.1)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--on-surface)' }}>
                  Step {selectedStep.order + 1}: {selectedStep.title}
                </p>
                {selectedStep.isMilestone && (
                  <span style={{ fontSize: 11, background: '#fffbeb', color: '#92400e', border: '1px solid #fcd34d', borderRadius: 4, padding: '1px 6px', fontWeight: 600 }}>
                    First value
                  </span>
                )}
              </div>
              <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div style={{ display: 'grid', gap: 12 }}>
                  {[
                    { label: 'Status',        value: STATUS_ICON[selectedStep.status]?.label ?? selectedStep.status },
                    { label: 'Time spent',    value: fmt(selectedStep.timeSpentMs) },
                    { label: 'AI-assisted',   value: selectedStep.aiAssisted ? 'Yes' : 'No' },
                    { label: 'Attempts',      value: String(selectedStep.attempts) },
                    { label: 'Messages',      value: String(selectedStep.messagesCount) },
                    { label: 'Action type',   value: selectedStep.actionType ?? '—' },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 500, color: 'var(--on-surface)' }}>{value}</p>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gap: 12 }}>
                  {[
                    { label: 'Started at',    value: fmtDate(selectedStep.startedAt) },
                    { label: 'Completed at',  value: fmtDate(selectedStep.completedAt) },
                    { label: 'Outcome',       value: selectedStep.outcome ?? '—' },
                    { label: 'Drop reason',   value: selectedStep.dropReason?.replace(/_/g, ' ') ?? '—' },
                    { label: 'Intent',        value: selectedStep.intent || '—' },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 500, color: 'var(--on-surface)', wordBreak: 'break-all' }}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {/* Chat transcript */}
          {session.messages && session.messages.length > 0 && (
            <ChatTranscript
              messages={session.messages}
              activeStepId={activeStep}
            />
          )}

          {/* Collected data */}
          {collectedEntries.length > 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid rgba(70,69,84,0.12)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(70,69,84,0.1)' }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--on-surface)' }}>Collected Data</p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--muted)' }}>Answers the user gave during the session</p>
              </div>
              <div style={{ padding: '14px 20px', display: 'grid', gap: 10 }}>
                {collectedEntries.map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, flexShrink: 0 }}>{k}</span>
                    <span style={{ fontSize: 12, color: 'var(--on-surface)', fontWeight: 500, textAlign: 'right', wordBreak: 'break-all' }}>
                      {String(v)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User metadata */}
          {session.endUser && Object.keys(session.endUser.metadata ?? {}).length > 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid rgba(70,69,84,0.12)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(70,69,84,0.1)' }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--on-surface)' }}>User Metadata</p>
              </div>
              <div style={{ padding: '14px 20px', display: 'grid', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--muted)', fontWeight: 600 }}>User ID</span>
                  <span style={{ color: 'var(--on-surface)', fontFamily: 'monospace' }}>{session.endUser.externalId ?? 'anonymous'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--muted)', fontWeight: 600 }}>First seen</span>
                  <span style={{ color: 'var(--on-surface)' }}>{fmtDate(session.endUser.firstSeenAt)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--muted)', fontWeight: 600 }}>Last seen</span>
                  <span style={{ color: 'var(--on-surface)' }}>{fmtDate(session.endUser.lastSeenAt)}</span>
                </div>
                {Object.entries(session.endUser.metadata as Record<string, unknown>).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--muted)', fontWeight: 600 }}>{k}</span>
                    <span style={{ color: 'var(--on-surface)', wordBreak: 'break-all', textAlign: 'right' }}>{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
