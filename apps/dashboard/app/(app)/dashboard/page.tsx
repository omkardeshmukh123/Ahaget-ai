'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api, OverviewStats, TimelinePoint, EndUserSummary, Insight, OnboardingStatus } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

export default function DashboardPage() {
  const { org } = useAuthStore();
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const [users, setUsers] = useState<{ users: EndUserSummary[]; total: number } | null>(null);
  const [topInsight, setTopInsight] = useState<Insight | null>(null);
  const [onboarding, setOnboarding] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.analytics.overview(),
      api.analytics.timeline(30),
      api.users.list({ limit: 10 }),
      api.insights.list().catch(() => null),
      api.onboarding.status().catch(() => null),
    ]).then(([o, t, u, ins, ob]) => {
      setOverview(o);
      setTimeline(t);
      setUsers(u);
      if (ins && ins.insights.length > 0) setTopInsight(ins.insights[0]);
      if (ob) setOnboarding(ob);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSkeleton />;

  const totalMessages = overview
    ? Math.round((overview.avgMessagesPerConv ?? 0) * (overview.totalConversations ?? 0))
    : 0;

  const chartData = timeline.map((p) => ({
    date: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    Conversations: p.conversations,
  }));

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--on-surface)' }}>
          Dashboard
        </h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
          Overview of your platform performance
        </p>
      </div>

      {/* Onboarding checklist — only while incomplete */}
      {onboarding && !onboarding.allDone && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(255,133,122,0.14), rgba(128,131,255,0.09))',
          borderRadius: 14,
          padding: '18px 20px',
          marginBottom: 24,
          outline: '0.5px solid rgba(255,133,122,0.10)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF857A" strokeWidth={2} strokeLinecap="round">
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
          <div style={{ height: 4, background: 'rgba(255,133,122,0.12)', borderRadius: 9999, marginBottom: 14, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, #FF857A, #EBAEE6)',
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
                  background: step.done ? 'linear-gradient(135deg, #FF857A, #EBAEE6)' : 'rgba(255,133,122,0.10)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  outline: step.done ? 'none' : '1px solid rgba(255,133,122,0.18)',
                }}>
                  {step.done && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#07006c" strokeWidth={3.5} strokeLinecap="round"><path d="M5 13l4 4L19 7"/></svg>}
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
          { label: 'Total Users',    value: users?.total ?? overview?.activeUsers ?? 0,    icon: <UsersIcon />,   delta: '+16%' },
          { label: 'Conversations',  value: overview?.totalConversations ?? 0,              icon: <ChatIcon />,    delta: '+9%'  },
          { label: 'Messages',       value: totalMessages,                                   icon: <MsgIcon />,     delta: '+3%'  },
        ].map(({ label, value, icon, delta }) => (
          <div key={label} className="card" style={{ padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
            {/* Ambient glow spot */}
            <div style={{
              position: 'absolute', top: -20, right: -20,
              width: 80, height: 80, borderRadius: '50%',
              background: 'rgba(255,133,122,0.06)',
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
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--success)', background: 'rgba(173,235,179,0.14)', padding: '1px 6px', borderRadius: 999 }}>
                {delta}
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
                    <stop offset="0%" stopColor="#FF857A" />
                    <stop offset="100%" stopColor="#EBAEE6" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(70,69,84,0.25)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface-container-high)',
                    border: '1px solid rgba(70,69,84,0.3)',
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
                  activeDot={{ r: 4, fill: '#FF857A', strokeWidth: 0 }}
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
                        background: 'linear-gradient(135deg, rgba(255,133,122,0.2), rgba(235,174,230,0.2))',
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
                    <span className="badge badge-success" style={{ fontSize: 10 }}>Active</span>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>—</span>
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
