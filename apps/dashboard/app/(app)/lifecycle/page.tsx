'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface StageData {
  stage: string;
  started: number;
  completed: number;
  completionRate: number;
}

interface LifecycleData {
  period: string;
  uniqueUsers: number;
  stages: StageData[];
  proactive: { sent: number; opened: number; clicked: number; openRate: number; clickRate: number };
  expansion: { pitched: number; converted: number; attributedMrr: number; conversionRate: number };
}

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function apiFetch<T>(path: string): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('_ahaget_token') : null;
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as T;
}

const STAGE_META: Record<string, { label: string; emoji: string; color: string; href: string; desc: string }> = {
  onboarding: { label: 'Onboarding',  emoji: '🚀', color: '#6366f1', href: '/flows?type=onboarding', desc: 'New users getting started' },
  adoption:   { label: 'Adoption',    emoji: '⚡', color: '#8b5cf6', href: '/flows?type=adoption',   desc: 'Users discovering features' },
  upsell:     { label: 'Expansion',   emoji: '📈', color: '#d946ef', href: '/expansion',              desc: 'AI-initiated upgrades' },
  retention:  { label: 'Retention',   emoji: '💡', color: '#f59e0b', href: '/flows?type=retention',   desc: 'Re-engaging inactive users' },
  support:    { label: 'Support',     emoji: '🤝', color: '#10b981', href: '/flows?type=support',     desc: 'Resolving user issues' },
};

function StageCard({ stage, stageData, isLast }: { stage: string; stageData: StageData; isLast: boolean }) {
  const meta = STAGE_META[stage];
  const barWidth = `${stageData.completionRate}%`;
  const rateColor = stageData.completionRate >= 70 ? '#10b981' : stageData.completionRate >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      <Link href={meta.href} style={{ textDecoration: 'none', flex: 1 }}>
        <div style={{
          background: 'var(--surface)', border: '1px solid rgba(70,69,84,0.12)',
          borderRadius: 12, padding: '18px 20px', cursor: 'pointer',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = meta.color; (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 3px ${meta.color}20`; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(70,69,84,0.12)'; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 20 }}>{meta.emoji}</span>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--on-surface)' }}>{meta.label}</p>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)' }}>{meta.desc}</p>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--on-surface)' }}>{stageData.started}</p>
              <p style={{ margin: 0, fontSize: 10, color: 'var(--muted)' }}>sessions</p>
            </div>
          </div>

          {/* Completion rate bar */}
          <div style={{ background: 'var(--surface-low)', borderRadius: 999, height: 5, overflow: 'hidden', marginBottom: 6 }}>
            <div style={{ height: '100%', width: barWidth, background: meta.color, borderRadius: 999, transition: 'width 0.5s ease' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
            <span style={{ color: 'var(--muted)' }}>{stageData.completed} completed</span>
            <span style={{ fontWeight: 700, color: rateColor }}>{stageData.completionRate}% rate</span>
          </div>
        </div>
      </Link>

      {/* Arrow connector */}
      {!isLast && (
        <div style={{ width: 32, textAlign: 'center', fontSize: 16, color: 'var(--muted)', flexShrink: 0 }}>→</div>
      )}
    </div>
  );
}

export default function LifecyclePage() {
  const [data, setData] = useState<LifecycleData | null>(null);
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [period]);

  async function load() {
    setLoading(true);
    try {
      const d = await apiFetch<LifecycleData>(`/api/v1/analytics/lifecycle?period=${period}`);
      setData(d);
    } finally {
      setLoading(false);
    }
  }

  const stages = ['onboarding', 'adoption', 'upsell', 'retention', 'support'];

  return (
    <div style={{ padding: '28px 32px', maxWidth: 960 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>Lifecycle Engine</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
            Full-funnel view of your AI employee's work — from first touch to expansion revenue.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['7d', '30d', '90d'].map((p) => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: period === p ? 'linear-gradient(135deg,#FF857A,#EBAEE6)' : 'var(--surface-low)',
              color: period === p ? '#3d1008' : 'var(--muted)',
              border: `1px solid ${period === p ? 'transparent' : 'rgba(70,69,84,0.2)'}`,
            }}>{p}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>Loading…</p>
      ) : data && (
        <>
          {/* Quick stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
            <div style={{ background: 'var(--surface)', border: '1px solid rgba(70,69,84,0.12)', borderRadius: 12, padding: '16px 20px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 8px' }}>Active Users</p>
              <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--on-surface)', margin: 0 }}>{data.uniqueUsers.toLocaleString()}</p>
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Last {period}</p>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid rgba(70,69,84,0.12)', borderRadius: 12, padding: '16px 20px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 8px' }}>Proactive Reach</p>
              <p style={{ fontSize: 28, fontWeight: 800, color: '#f59e0b', margin: 0 }}>{data.proactive.sent}</p>
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{data.proactive.openRate}% open · {data.proactive.clickRate}% click</p>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid rgba(70,69,84,0.12)', borderRadius: 12, padding: '16px 20px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 8px' }}>Attributed MRR</p>
              <p style={{ fontSize: 28, fontWeight: 800, color: '#10b981', margin: 0 }}>${data.expansion.attributedMrr.toLocaleString()}</p>
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{data.expansion.conversionRate}% conversion</p>
            </div>
          </div>

          {/* Stage funnel */}
          <div style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 16 }}>Lifecycle Funnel</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr) 32px repeat(0, 1fr)', gap: 0, alignItems: 'stretch' }}>
              {data.stages.map((s, i) => (
                <StageCard key={s.stage} stage={s.stage} stageData={s} isLast={i === data.stages.length - 1} />
              ))}
            </div>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 12 }}>
              Click any stage to view its flows. Completion rate = sessions completed ÷ sessions started in this period.
            </p>
          </div>

          {/* Proactive + Expansion side-by-side detail */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Proactive */}
            <div style={{ background: 'var(--surface)', border: '1px solid rgba(70,69,84,0.12)', borderRadius: 12, padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 16 }}>💡</span>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--on-surface)' }}>Proactive Outreach</p>
                <Link href="/outreach" style={{ marginLeft: 'auto', fontSize: 11, color: '#6366f1', textDecoration: 'none' }}>View all →</Link>
              </div>
              {[
                { label: 'Sent',   value: data.proactive.sent,   color: 'var(--on-surface)' },
                { label: 'Opened', value: data.proactive.opened, color: '#f59e0b', rate: data.proactive.openRate },
                { label: 'Clicked',value: data.proactive.clicked,color: '#10b981', rate: data.proactive.clickRate },
              ].map((row) => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(70,69,84,0.06)' }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{row.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {row.rate !== undefined && <span style={{ fontSize: 11, color: row.color, fontWeight: 600 }}>{row.rate}%</span>}
                    <span style={{ fontSize: 14, fontWeight: 700, color: row.color }}>{row.value}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Expansion */}
            <div style={{ background: 'var(--surface)', border: '1px solid rgba(70,69,84,0.12)', borderRadius: 12, padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 16 }}>📈</span>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--on-surface)' }}>Expansion Revenue</p>
                <Link href="/expansion" style={{ marginLeft: 'auto', fontSize: 11, color: '#d946ef', textDecoration: 'none' }}>View all →</Link>
              </div>
              {[
                { label: 'Pitches sent',  value: data.expansion.pitched,   color: 'var(--on-surface)' },
                { label: 'Converted',     value: data.expansion.converted, color: '#d946ef', rate: data.expansion.conversionRate },
                { label: 'Attributed MRR',value: `$${data.expansion.attributedMrr.toLocaleString()}`, color: '#10b981' },
              ].map((row) => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(70,69,84,0.06)' }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{row.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {(row as {rate?:number}).rate !== undefined && <span style={{ fontSize: 11, color: row.color, fontWeight: 600 }}>{(row as {rate:number}).rate}%</span>}
                    <span style={{ fontSize: 14, fontWeight: 700, color: row.color }}>{row.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
