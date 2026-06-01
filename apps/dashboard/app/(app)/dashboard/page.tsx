'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api, OverviewStats, TimelinePoint, EndUserSummary, Insight, OnboardingStatus, AgentHealth } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

export default function DashboardPage() {
  const { org } = useAuthStore();
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const [users, setUsers] = useState<{ users: EndUserSummary[]; total: number } | null>(null);
  const [topInsight, setTopInsight] = useState<Insight | null>(null);
  const [onboarding, setOnboarding] = useState<OnboardingStatus | null>(null);
  const [agentHealth, setAgentHealth] = useState<AgentHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setLoadError(false);

    // Fix #11: timeout guard — raised to 30s for single-connection Supabase deployments
    const timeout = setTimeout(() => {
      setLoading(false);
      setLoadError(true);
    }, 30_000);

    // Fix #11b: serialize requests to avoid exhausting connection_limit=1 Prisma pool.
    // allSettled in parallel causes all 5 queries to compete for 1 connection -> timeouts.
    try {
      const o = await api.analytics.overview().catch(() => null);
      if (o) setOverview(o);

      const t = await api.analytics.timeline(30).catch(() => null);
      if (t) setTimeline(t);

      const u = await api.users.list({ limit: 10 }).catch(() => null);
      if (u) setUsers(u);

      const ins = await api.insights.list().catch(() => null);
      if (ins && ins.insights.length > 0) setTopInsight(ins.insights[0]);

      const ob = await api.onboarding.status().catch(() => null);
      if (ob) setOnboarding(ob);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }

    // Fix #8: agent health is optional (Starter+ plan gate) — fetch after main data
    api.analytics.health().then(setAgentHealth).catch(() => {});
  };

  useEffect(() => { loadData(); }, []);

  if (loading) return <PageSkeleton />;

  // Fix #11: show error/retry state
  if (loadError) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--error)" strokeWidth={1.5}><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
      <p style={{ fontSize: 14, color: 'var(--on-surface-variant)', textAlign: 'center' }}>Dashboard took too long to load.</p>
      <button onClick={loadData} style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)', background: 'none', border: '1px solid var(--primary)', borderRadius: 8, padding: '8px 20px', cursor: 'pointer' }}>Retry</button>
    </div>
  );

  // New orgs have nothing to show — send them to the activation flow instead
  if (overview && overview.totalConversations === 0 && (users?.total ?? 0) === 0) {
    return <NewOrgWelcome />;
  }

  // Fix #1: use exact totalMessages from backend instead of lossy client-side computation
  const totalMessages = overview?.totalMessages ?? 0;

  const chartData = timeline.map((p) => ({
    date: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    Conversations: p.conversations,
  }));

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--on-surface)' }}>
            Dashboard
          </h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
            Overview of your platform performance
          </p>
        </div>
        {/* Fix #8: Agent health status pill */}
        {agentHealth && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 999,
            background: agentHealth.status === 'green' ? 'rgba(52,211,153,0.10)'
              : agentHealth.status === 'yellow' ? 'rgba(251,191,36,0.10)'
              : agentHealth.status === 'red'    ? 'rgba(248,113,113,0.10)'
              : 'var(--surface-container)',
            border: `1px solid ${
              agentHealth.status === 'green' ? 'rgba(52,211,153,0.25)'
              : agentHealth.status === 'yellow' ? 'rgba(251,191,36,0.25)'
              : agentHealth.status === 'red' ? 'rgba(248,113,113,0.25)'
              : 'rgba(70,69,84,0.2)'
            }`,
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
              background: agentHealth.status === 'green' ? '#34d399'
                : agentHealth.status === 'yellow' ? '#fbbf24'
                : agentHealth.status === 'red' ? '#f87171'
                : '#94a3b8',
              boxShadow: agentHealth.status === 'green' ? '0 0 6px #34d399'
                : agentHealth.status === 'yellow' ? '0 0 6px #fbbf24'
                : agentHealth.status === 'red' ? '0 0 6px #f87171' : 'none',
            }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--on-surface-variant)' }}>
              Agent {agentHealth.status === 'unknown' ? 'No data' : `${agentHealth.successRate ?? '—'}% success`}
            </span>
          </div>
        )}
      </div>

      {/* Onboarding checklist — only while incomplete */}
      {onboarding && !onboarding.allDone && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(138,43,226,0.08), rgba(160,80,240,0.05))',
          borderRadius: 14,
          padding: '18px 20px',
          marginBottom: 24,
          border: '1px solid rgba(138,43,226,0.12)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8A2BE2" strokeWidth={2} strokeLinecap="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>Complete Setup</span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>
              {Math.round((onboarding.completedCount / onboarding.totalCount) * 100)}% Completed
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginBottom: 10 }}>
            You're almost ready to go live. Complete these steps.
          </p>
          {/* Progress bar */}
          <div style={{ height: 4, background: 'rgba(138,43,226,0.10)', borderRadius: 9999, marginBottom: 14, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, #8A2BE2, #A050F0)',
              borderRadius: 9999,
              width: `${(onboarding.completedCount / onboarding.totalCount) * 100}%`,
              transition: 'width 0.6s ease',
            }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {onboarding.steps.map((step) => (
              <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%',
                  background: step.done ? 'linear-gradient(135deg, #8A2BE2, #A050F0)' : 'rgba(138,43,226,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  outline: step.done ? 'none' : '1px solid rgba(138,43,226,0.18)',
                }}>
                  {step.done && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.5} strokeLinecap="round"><path d="M5 13l4 4L19 7"/></svg>}
                </div>
                <span style={{ fontSize: 12, color: step.done ? 'var(--muted)' : 'var(--on-surface-variant)', textDecoration: step.done ? 'line-through' : 'none' }}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Users',    value: users?.total ?? overview?.activeUsers ?? 0,    icon: <UsersIcon /> },
          { label: 'Conversations',  value: overview?.totalConversations ?? 0,              icon: <ChatIcon />   },
          { label: 'Messages',       value: totalMessages,                                   icon: <MsgIcon />    },
        ].map(({ label, value, icon }) => (
          <div key={label} className="card" style={{ padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
            {/* Ambient glow spot */}
            <div style={{
              position: 'absolute', top: -20, right: -20,
              width: 80, height: 80, borderRadius: '50%',
              background: 'rgba(138,43,226,0.06)',
              filter: 'blur(20px)',
              pointerEvents: 'none',
            }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>{label}</span>
              <span style={{ color: 'var(--on-surface-variant)', opacity: 0.5 }}>{icon}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--on-surface)' }}>
                {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Recent Users (two-column) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
        {/* Chart */}
        <div className="card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface)' }}>Usage over time</span>
            <span style={{ fontSize: 11, color: 'var(--muted)', background: 'var(--surface-container-high)', padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(70,69,84,0.2)' }}>
              Last 30 Days ▾
            </span>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#8A2BE2" />
                    <stop offset="100%" stopColor="#A050F0" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(138,43,226,0.12)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#9B8AB0' }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 10, fill: '#9B8AB0' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface-container-high)',
                    border: '1px solid rgba(138,43,226,0.15)',
                    borderRadius: 8,
                    fontSize: 12,
                    color: 'var(--on-surface)',
                  }}
                  labelStyle={{ color: 'var(--on-surface-variant)', fontWeight: 600 }}
                />
                <Line
                  type="monotone"
                  dataKey="Conversations"
                  stroke="url(#lineGrad)"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4, fill: '#8A2BE2', strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>No data yet — install the snippet to start tracking</p>
            </div>
          )}
        </div>

        {/* Recent Users */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface)' }}>Recent Users</span>
            <Link href="/users" style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 500 }}>View All</Link>
          </div>

          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '8px 12px', marginBottom: 8 }}>
            {['NAME', 'STATUS', 'ACTIVITY'].map((h) => (
              <span key={h} style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.06em' }}>{h}</span>
            ))}
          </div>

          {(users?.users.length ?? 0) === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--muted)', paddingTop: 16 }}>No users yet. Install the widget to start tracking.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {users?.users.slice(0, 5).map((u) => {
                const displayId = u.externalId ?? u.id.slice(0, 8);
                return (
                  <div
                    key={u.id}
                    style={{
                      display: 'grid', gridTemplateColumns: '1fr auto auto',
                      alignItems: 'center', gap: '8px 12px',
                      padding: '9px 8px',
                      borderRadius: 8,
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-container-high)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgba(138,43,226,0.15), rgba(160,80,240,0.15))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 700, color: 'var(--primary)',
                        flexShrink: 0,
                      }}>
                        {displayId[0]?.toUpperCase() ?? '?'}
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {displayId}
                      </span>
                    </div>
                    {/* Fix #7: real user status derived from lastSeenAt */}
                    {(() => {
                      const lastSeen = new Date(u.lastSeenAt).getTime();
                      const now = Date.now();
                      const diffDays = (now - lastSeen) / (1000 * 60 * 60 * 24);
                      const statusLabel = diffDays < 7 ? 'Active' : diffDays < 30 ? 'At Risk' : 'Inactive';
                      const statusClass = diffDays < 7 ? 'badge-success' : diffDays < 30 ? 'badge-warning' : 'badge-error';
                      return <span className={`badge ${statusClass}`} style={{ fontSize: 10 }}>{statusLabel}</span>;
                    })()}
                    {/* Fix #7: show relative time instead of dash */}
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                      {(() => {
                        const diffMs = Date.now() - new Date(u.lastSeenAt).getTime();
                        const diffMins = Math.floor(diffMs / 60_000);
                        const diffHrs  = Math.floor(diffMs / 3_600_000);
                        const diffDays = Math.floor(diffMs / 86_400_000);
                        if (diffMins < 60)  return `${diffMins}m ago`;
                        if (diffHrs < 24)   return `${diffHrs}h ago`;
                        return `${diffDays}d ago`;
                      })()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top insight card */}
      {topInsight && (
        <div style={{
          marginTop: 16,
          padding: '14px 18px',
          borderRadius: 12,
          background: topInsight.severity === 'high'
            ? 'rgba(255,180,171,0.08)' : topInsight.severity === 'medium'
            ? 'rgba(255,183,131,0.08)' : 'var(--surface-container)',
          outline: '0.5px solid rgba(255,133,122,0.07)',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, letterSpacing: '0.06em', textTransform: 'uppercase',
            background: topInsight.severity === 'high' ? 'rgba(255,180,171,0.15)' : topInsight.severity === 'medium' ? 'rgba(255,183,131,0.15)' : 'rgba(255,133,122,0.10)',
            color: topInsight.severity === 'high' ? 'var(--error)' : topInsight.severity === 'medium' ? 'var(--warning)' : 'var(--primary)',
          }}>
            {topInsight.severity}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface)', marginBottom: 2 }}>{topInsight.title}</p>
            <p style={{ fontSize: 12, color: 'var(--muted)' }}>{topInsight.description}</p>
          </div>
          <Link href="/insights" style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, flexShrink: 0 }}>View all →</Link>
        </div>
      )}
    </div>
  );
}

/* ─── New-org welcome screen ─────────────────────────────────────────────────
   Shown when an org has zero conversations + zero users (widget not yet wired).
   Activation is the #1 metric — this replaces a dashboard of empty zeros.    */
function NewOrgWelcome() {
  const steps = [
    {
      n: 1,
      label: 'Install the widget snippet',
      sub: 'Copy your unique script tag and paste it before </body> in your app.',
      href: '/settings/widget',
      cta: 'Get snippet →',
    },
    {
      n: 2,
      label: 'Build your first agent flow',
      sub: 'Define the steps your AI employee follows when a user asks for help.',
      href: '/flows',
      cta: 'Create flow →',
    },
    {
      n: 3,
      label: 'Test in the live preview',
      sub: 'See exactly how Ahaget appears inside your product before going live.',
      href: '/in-page-assistant',
      cta: 'Open preview →',
    },
  ];

  return (
    <div style={{ maxWidth: 560, margin: '60px auto 0', textAlign: 'center' }}>
      <div style={{
        width: 56, height: 56, borderRadius: 16, margin: '0 auto 20px',
        background: 'linear-gradient(135deg, #8A2BE2, #A050F0)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--on-surface)', letterSpacing: '-0.03em', marginBottom: 8 }}>
        Welcome! Let&apos;s get your first customer session.
      </h1>
      <p style={{ fontSize: 13.5, color: 'var(--muted)', marginBottom: 36, lineHeight: 1.6 }}>
        Your dashboard is empty because no users have seen the widget yet.
        Three steps to your first live AI session:
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left' }}>
        {steps.map(({ n, label, sub, href, cta }) => (
          <div key={n} style={{
            display: 'flex', alignItems: 'flex-start', gap: 16,
            background: 'var(--surface-low)', borderRadius: 14,
            padding: '18px 20px', border: '1px solid rgba(138,43,226,0.12)',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #8A2BE2, #A050F0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 800, color: '#fff',
            }}>{n}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 3 }}>{label}</p>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>{sub}</p>
              <Link href={href} style={{
                fontSize: 12.5, fontWeight: 700, color: 'var(--primary)',
                textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4,
              }}>{cta}</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Micro icons ───────────────────────────────────────────────────────────── */
function UsersIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>;
}
function ChatIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>;
}
function MsgIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M8 9h8M8 13h6"/><path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z"/></svg>;
}

function PageSkeleton() {
  return (
    <div style={{ animation: 'pulse 1.5s infinite' }}>
      <div style={{ height: 28, width: 160, background: 'var(--surface-container)', borderRadius: 8, marginBottom: 24 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[...Array(3)].map((_, i) => (
          <div key={i} style={{ height: 96, background: 'var(--surface-container)', borderRadius: 12 }} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
        <div style={{ height: 280, background: 'var(--surface-container)', borderRadius: 12 }} />
        <div style={{ height: 280, background: 'var(--surface-container)', borderRadius: 12 }} />
      </div>
    </div>
  );
}
