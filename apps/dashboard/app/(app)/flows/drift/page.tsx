'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface HealStats {
  summary: { totalActions: number; healedCount: number; failedCount: number; healRate: number };
  topDriftingSelectors: { selector: string; failures: number; lastPage: string; lastSeen: string }[];
  strategyDistribution: Record<string, number>;
  trend: { date: string; healed: number; failed: number }[];
}

const STRATEGY_LABELS: Record<string, string> = {
  primary: 'Direct match', 'data-testid': 'data-testid', name: 'name attr',
  'aria-label': 'aria-label', placeholder: 'placeholder', 'exact-text': 'Exact text',
  'fuzzy-class': 'Fuzzy class', 'fuzzy-text': 'Fuzzy text', failed: 'Failed',
};

export default function SelectorDriftPage() {
  const [data, setData] = useState<HealStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<HealStats>('/api/v1/analytics/heal-stats')
      .then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const th: React.CSSProperties = { padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9B8AB0', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgba(138,43,226,0.08)', whiteSpace: 'nowrap' };
  const td: React.CSSProperties = { padding: '11px 14px', fontSize: 13, color: '#1A0530', borderBottom: '1px solid rgba(138,43,226,0.05)' };

  const chips = data ? [
    { label: 'Heal rate', value: `${data.summary.healRate}%`, color: data.summary.healRate >= 90 ? '#10B981' : data.summary.healRate >= 70 ? '#F59E0B' : '#EF4444' },
    { label: 'Auto-healed', value: data.summary.healedCount, color: '#8A2BE2' },
    { label: 'Failed (no match)', value: data.summary.failedCount, color: '#EF4444' },
    { label: 'Total actions', value: data.summary.totalActions, color: '#6B7280' },
  ] : [];

  const strategies = data ? Object.entries(data.strategyDistribution).sort((a, b) => b[1] - a[1]) : [];

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1A0530', marginBottom: 4 }}>Selector Drift</h1>
      <p style={{ fontSize: 13, color: '#9B8AB0', marginBottom: 24 }}>
        Self-healing telemetry — when host app UI changes break CSS selectors, the resolver silently recovers.
      </p>

      {loading ? (
        <p style={{ color: '#9B8AB0', fontSize: 13 }}>Loading…</p>
      ) : !data ? (
        <p style={{ color: '#9B8AB0', fontSize: 13 }}>No data yet.</p>
      ) : (
        <>
          {/* Summary chips */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
            {chips.map(c => (
              <div key={c.label} style={{ background: '#fff', border: '1px solid rgba(138,43,226,0.1)', borderRadius: 10, padding: '12px 20px', minWidth: 130 }}>
                <p style={{ fontSize: 24, fontWeight: 700, color: c.color, margin: 0 }}>{c.value}</p>
                <p style={{ fontSize: 11, color: '#9B8AB0', margin: '2px 0 0' }}>{c.label}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            {/* Strategy distribution */}
            <div style={{ background: '#fff', border: '1px solid rgba(138,43,226,0.1)', borderRadius: 12, padding: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1A0530', marginBottom: 14 }}>Heal Strategy Breakdown</p>
              {strategies.map(([key, count]) => {
                const pct = data.summary.totalActions > 0 ? Math.round((count / data.summary.totalActions) * 100) : 0;
                const isFailed = key === 'failed';
                const isPrimary = key === 'primary';
                const barColor = isFailed ? '#EF4444' : isPrimary ? '#E5E7EB' : '#8A2BE2';
                return (
                  <div key={key} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 12, color: isFailed ? '#EF4444' : '#5B4B7A' }}>{STRATEGY_LABELS[key] ?? key}</span>
                      <span style={{ fontSize: 11, color: '#9B8AB0' }}>{count} ({pct}%)</span>
                    </div>
                    <div style={{ height: 5, background: 'rgba(138,43,226,0.08)', borderRadius: 3 }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 3 }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 7-day trend */}
            <div style={{ background: '#fff', border: '1px solid rgba(138,43,226,0.1)', borderRadius: 12, padding: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1A0530', marginBottom: 14 }}>7-Day Trend</p>
              {data.trend.length === 0 ? (
                <p style={{ fontSize: 12, color: '#9B8AB0' }}>No data in last 7 days.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>
                    <th style={{ ...th, padding: '6px 8px' }}>Date</th>
                    <th style={{ ...th, padding: '6px 8px' }}>Healed</th>
                    <th style={{ ...th, padding: '6px 8px' }}>Failed</th>
                  </tr></thead>
                  <tbody>
                    {data.trend.map(row => (
                      <tr key={row.date}>
                        <td style={{ ...td, padding: '8px 8px', fontSize: 12 }}>{row.date}</td>
                        <td style={{ ...td, padding: '8px 8px', color: '#8A2BE2', fontWeight: 600 }}>{row.healed}</td>
                        <td style={{ ...td, padding: '8px 8px', color: row.failed > 0 ? '#EF4444' : '#9B8AB0', fontWeight: row.failed > 0 ? 600 : 400 }}>{row.failed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Top drifting selectors */}
          <div style={{ background: '#fff', border: '1px solid rgba(138,43,226,0.1)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(138,43,226,0.08)' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1A0530', margin: 0 }}>Top Drifting Selectors</p>
              <p style={{ fontSize: 11, color: '#9B8AB0', margin: '2px 0 0' }}>Selectors that needed healing or failed — update actionConfig to fix permanently.</p>
            </div>
            {data.topDriftingSelectors.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                <p style={{ fontSize: 28, marginBottom: 8 }}>✅</p>
                <p style={{ fontWeight: 700, color: '#1A0530' }}>No selector drift detected</p>
                <p style={{ fontSize: 13, color: '#9B8AB0' }}>All configured selectors matched the live DOM directly.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  <th style={th}>Selector</th><th style={th}>Last page</th><th style={th}>Events</th><th style={th}>Last seen</th>
                </tr></thead>
                <tbody>
                  {data.topDriftingSelectors.map(s => (
                    <tr key={s.selector}>
                      <td style={{ ...td, fontFamily: 'monospace', fontSize: 12, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.selector}</td>
                      <td style={{ ...td, fontSize: 12, color: '#5B4B7A' }}>{s.lastPage}</td>
                      <td style={td}><span style={{ background: s.failures >= 5 ? 'rgba(239,68,68,0.1)' : 'rgba(138,43,226,0.08)', color: s.failures >= 5 ? '#EF4444' : '#8A2BE2', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{s.failures}</span></td>
                      <td style={{ ...td, fontSize: 12, color: '#9B8AB0' }}>{new Date(s.lastSeen).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
