'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface FailureRow {
  sessionId: string;
  userId: string | null;
  flowName: string;
  completedSteps: number;
  totalSteps: number;
  progressPct: number;
  lastActiveMinutesAgo: number;
  type: 'dropped_off';
}

interface EscalationRow {
  ticketId: string;
  userId: string | null;
  sessionId: string;
  flowName: string;
  reason: string;
  createdAt: string;
  status: string;
}

interface FailuresData {
  failures: FailureRow[];
  escalations: EscalationRow[];
  summary: { droppedOff: number; openEscalations: number };
}

export default function FailuresPage() {
  const [data, setData] = useState<FailuresData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'dropped' | 'escalations'>('dropped');

  useEffect(() => {
    apiFetch<FailuresData>('/api/v1/failures')
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const th: React.CSSProperties = { padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9B8AB0', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgba(138,43,226,0.08)', whiteSpace: 'nowrap' };
  const td: React.CSSProperties = { padding: '12px 14px', fontSize: 13, color: '#1A0530', borderBottom: '1px solid rgba(138,43,226,0.05)' };

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1A0530', marginBottom: 4 }}>Failure Inbox</h1>
      <p style={{ fontSize: 13, color: '#9B8AB0', marginBottom: 24 }}>Sessions where users dropped off or needed human help.</p>

      {/* Summary chips */}
      {data && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Dropped off', value: data.summary.droppedOff, color: '#F59E0B' },
            { label: 'Open escalations', value: data.summary.openEscalations, color: '#EF4444' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: '#fff', border: '1px solid rgba(138,43,226,0.1)', borderRadius: 10, padding: '12px 20px', minWidth: 140 }}>
              <p style={{ fontSize: 24, fontWeight: 700, color, margin: 0 }}>{value}</p>
              <p style={{ fontSize: 11, color: '#9B8AB0', margin: '2px 0 0' }}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['dropped', 'escalations'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            background: tab === t ? '#8A2BE2' : 'transparent',
            color: tab === t ? '#fff' : '#9B8AB0',
            border: tab === t ? 'none' : '1px solid rgba(138,43,226,0.2)',
          }}>
            {t === 'dropped' ? 'Dropped Off' : 'Escalations'}
          </button>
        ))}
      </div>

      <div style={{ background: '#fff', border: '1px solid rgba(138,43,226,0.1)', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <p style={{ padding: 24, color: '#9B8AB0', fontSize: 13 }}>Loading…</p>
        ) : tab === 'dropped' ? (
          !data?.failures.length ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>✅</p>
              <p style={{ fontWeight: 700, fontSize: 16, color: '#1A0530', marginBottom: 4 }}>No failures detected</p>
              <p style={{ color: '#9B8AB0', fontSize: 13 }}>Sessions where users go quiet for 30+ minutes appear here.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                <th style={th}>User</th><th style={th}>Flow</th><th style={th}>Progress</th><th style={th}>Idle for</th>
              </tr></thead>
              <tbody>
                {data.failures.map(f => (
                  <tr key={f.sessionId}>
                    <td style={td}>{f.userId ?? <span style={{ color: '#C4B5D8' }}>anonymous</span>}</td>
                    <td style={td}>{f.flowName}</td>
                    <td style={td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: 'rgba(138,43,226,0.1)', borderRadius: 3, maxWidth: 100 }}>
                          <div style={{ width: `${f.progressPct}%`, height: '100%', background: f.progressPct < 30 ? '#EF4444' : f.progressPct < 70 ? '#F59E0B' : '#10B981', borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 11, color: '#9B8AB0' }}>{f.completedSteps}/{f.totalSteps}</span>
                      </div>
                    </td>
                    <td style={td}>{f.lastActiveMinutesAgo < 60 ? `${f.lastActiveMinutesAgo}m` : `${Math.floor(f.lastActiveMinutesAgo / 60)}h`} ago</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : (
          !data?.escalations.length ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>🎉</p>
              <p style={{ fontWeight: 700, fontSize: 16, color: '#1A0530', marginBottom: 4 }}>No open escalations</p>
              <p style={{ color: '#9B8AB0', fontSize: 13 }}>When users ask for human help, tickets appear here.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                <th style={th}>User</th><th style={th}>Flow</th><th style={th}>Reason</th><th style={th}>Time</th><th style={th}>Status</th>
              </tr></thead>
              <tbody>
                {data.escalations.map(e => (
                  <tr key={e.ticketId}>
                    <td style={td}>{e.userId ?? <span style={{ color: '#C4B5D8' }}>anonymous</span>}</td>
                    <td style={td}>{e.flowName}</td>
                    <td style={{ ...td, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.reason}</td>
                    <td style={td}>{new Date(e.createdAt).toLocaleDateString()}</td>
                    <td style={td}><span style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{e.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>
    </div>
  );
}
