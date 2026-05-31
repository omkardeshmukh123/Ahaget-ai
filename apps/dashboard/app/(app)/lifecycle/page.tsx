'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

type StageInfo = { started: number; completed: number; completionRate: number };

type LifecycleData = {
  period: string;
  activeUsers: number;
  stages: Record<string, StageInfo>;
  proactive: { total: number; openRate: number; clickRate: number };
  expansion: { totalMrr: number; conversionRate: number; confirmedCount: number };
};

const STAGE_META: Record<string, { label: string; emoji: string; color: string; href: string; desc: string }> = {
  onboarding: { label: 'Onboarding',  emoji: '🚀', color: '#6366f1', href: '/flows?type=onboarding', desc: 'New users getting started' },
  adoption:   { label: 'Adoption',    emoji: '⚡', color: '#8b5cf6', href: '/flows?type=adoption',   desc: 'Users discovering features' },
  upsell:     { label: 'Expansion',   emoji: '📈', color: '#d946ef', href: '/expansion',              desc: 'AI-initiated upgrades' },
  retention:  { label: 'Retention',   emoji: '💡', color: '#f59e0b', href: '/flows?type=retention',   desc: 'Re-engaging inactive users' },
  support:    { label: 'Support',     emoji: '🤝', color: '#10b981', href: '/flows?type=support',     desc: 'Resolving user issues' },
};

const STAGE_ORDER = ['onboarding', 'adoption', 'upsell', 'retention', 'support'];

function StageCard({ stageKey, info, isLast }: { stageKey: string; info: StageInfo; isLast: boolean }) {
  const meta = STAGE_META[stageKey] ?? { label: stageKey, emoji: '◈', color: '#6366f1', href: '/flows', desc: '' };
  const rateColor = info.completionRate >= 70 ? '#10b981' : info.completionRate >= 40 ? '#f59e0b' : '#ef4444';

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
              <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--on-surface)' }}>{info.started}</p>
              <p style={{ margin: 0, fontSize: 10, color: 'var(--muted)' }}>sessions</p>
            </div>
          </div>

          {/* Completion rate bar */}
          <div style={{ background: 'var(--surface-low)', borderRadius: 999, height: 5, overflow: 'hidden', marginBottom: 6 }}>
            <div style={{ height: '100%', width: `${info.completionRate}%`, background: meta.color, borderRadius: 999, transition: 'width 0.5s ease' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
            <span style={{ color: 'var(--muted)' }}>{info.completed} completed</span>
            <span style={{ fontWeight: 700, color: rateColor }}>{info.completionRate}% rate</span>
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

  useEffect(() => { load(); }, [period]); // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    setLoading(true);
    try {
      const d = await api.lifecycleAnalytics.get();
      setData(d);
    } catch (e) {
      console.error('[lifecycle] load error:', e);
    } finally {
      setLoading(false);
    }
  }

  // Present stages in fixed order; fill zeros for missing stages
  const stageEntries = STAGE_ORDER.map((key) => ({
    key,
    info: data?.stages[key] ?? { started: 0, completed: 0, completionRate: 0 },
  }));

  // Derive proactive sent count from total (API returns total)
  const proactiveSent = data?.proactive.total ?? 0;
  // Derive expansion pitched/converted from confirmedCount + conversionRate
  const expConverted = data?.expansion.confirmedCount ?? 0;
  const expPitched = data?.expansion.conversionRate && data.expansion.conversionRate > 0
    ? Math.round(expConverted / (data.expansion.conversionRate / 100))
    : expConverted;

  return (
    <div style={{ padding: '28px 32px', maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>Lifecycle Engine</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
            Full-funnel view of your AI employee&apos;s work — from first touch to expansion revenue.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['7d', '30d', '90d'].map((p) => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: period === p ? 'linear-gradient(135deg, #8A2BE2, #6A0DAD)' : 'var(--surface-low)',
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
              <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--on-surface)', margin: 0 }}>{(data.activeUsers ?? 0).toLocaleString()}</p>
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Last {period}</p>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid rgba(70,69,84,0.12)', borderRadius: 12, padding: '16px 20px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 8px' }}>Proactive Reach</p>
              <p style={{ fontSize: 28, fontWeight: 800, color: '#f59e0b', margin: 0 }}>{proactiveSent}</p>
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{data.proactive.openRate}% open · {data.proactive.clickRate}% click</p>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid rgba(70,69,84,0.12)', borderRadius: 12, padding: '16px 20px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 8px' }}>Attributed MRR</p>
              <p style={{ fontSize: 28, fontWeight: 800, color: '#10b981', margin: 0 }}>${(data.expansion.totalMrr ?? 0).toLocaleString()}</p>
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{data.expansion.conversionRate}% conversion</p>
            </div>
          </div>

          {/* Stage funnel */}
          <div style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 16 }}>Lifecycle Funnel</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0, alignItems: 'stretch' }}>
              {stageEntries.map((s, i) => (
                <StageCard key={s.key} stageKey={s.key} info={s.info} isLast={i === stageEntries.length - 1} />
              ))}
            </div>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 12 }}>
              Click any stage to view its flows. Completion rate = sessions completed ÷ sessions started in this period.
            </p>
          </div>

          {/* Proactive + Expansion side-by-side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: 'var(--surface)', border: '1px solid rgba(70,69,84,0.12)', borderRadius: 12, padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 16 }}>💡</span>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--on-surface)' }}>Proactive Outreach</p>
                <Link href="/outreach" style={{ marginLeft: 'auto', fontSize: 11, color: '#6366f1', textDecoration: 'none' }}>View all →</Link>
              </div>
              {[
                { label: 'Sent',    value: proactiveSent,              color: 'var(--on-surface)' },
                { label: 'Open rate', value: `${data.proactive.openRate}%`,  color: '#f59e0b' },
                { label: 'Click rate', value: `${data.proactive.clickRate}%`, color: '#10b981' },
              ].map((row) => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(70,69,84,0.06)' }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{row.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: row.color }}>{row.value}</span>
                </div>
              ))}
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid rgba(70,69,84,0.12)', borderRadius: 12, padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 16 }}>📈</span>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--on-surface)' }}>Expansion Revenue</p>
                <Link href="/expansion" style={{ marginLeft: 'auto', fontSize: 11, color: '#d946ef', textDecoration: 'none' }}>View all →</Link>
              </div>
              {[
                { label: 'Pitches sent',   value: expPitched,                                           color: 'var(--on-surface)' },
                { label: 'Converted',      value: `${expConverted} (${data.expansion.conversionRate}%)`, color: '#d946ef' },
                { label: 'Attributed MRR', value: `$${(data.expansion.totalMrr ?? 0).toLocaleString()}`, color: '#10b981' },
              ].map((row) => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(70,69,84,0.06)' }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{row.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: row.color }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
