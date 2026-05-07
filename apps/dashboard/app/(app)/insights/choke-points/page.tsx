'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, ChokePoint, PageSummary } from '@/lib/api';

const SEVERITY_CONFIG = {
  critical: { bar: 'bg-red-500',    badge: 'bg-red-100 text-red-700',      label: 'CRITICAL' },
  high:     { bar: 'bg-orange-400', badge: 'bg-orange-100 text-orange-700', label: 'HIGH'     },
  medium:   { bar: 'bg-amber-400',  badge: 'bg-amber-100 text-amber-700',   label: 'MEDIUM'   },
  low:      { bar: 'bg-slate-300',  badge: 'bg-slate-100 text-slate-600',   label: 'LOW'      },
} as const;

const TREND_CONFIG = {
  worsening: { icon: '↑', color: 'text-red-500',    label: 'worsening' },
  improving: { icon: '↓', color: 'text-green-600',  label: 'improving' },
  stable:    { icon: '→', color: 'text-slate-400',  label: 'stable'    },
  new:       { icon: '★', color: 'text-indigo-500', label: 'new'       },
} as const;

type SeverityFilter = 'all' | ChokePoint['severity_label'];

function fmtSecs(s: number): string {
  if (s === 0) return '—';
  if (s < 60) return `${s}s`;
  return `${Math.round((s / 60) * 10) / 10}m`;
}

export default function ChokePointsPage() {
  const router = useRouter();
  const [data, setData] = useState<{ choke_points: ChokePoint[]; page_summary: PageSummary[]; generated_at: string } | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<SeverityFilter>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async (d: number) => {
    setLoading(true);
    try {
      const res = await api.analytics.chokePoints(d);
      setData(res);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(days); }, [days, load]);

  useEffect(() => {
    const id = setInterval(() => load(days), 60_000);
    return () => clearInterval(id);
  }, [days, load]);

  const choke_points = data?.choke_points ?? [];
  const page_summary = data?.page_summary ?? [];

  const filtered = filter === 'all'
    ? choke_points
    : choke_points.filter((cp) => cp.severity_label === filter);

  const counts = {
    critical: choke_points.filter((cp) => cp.severity_label === 'critical').length,
    high:     choke_points.filter((cp) => cp.severity_label === 'high').length,
    medium:   choke_points.filter((cp) => cp.severity_label === 'medium').length,
    low:      choke_points.filter((cp) => cp.severity_label === 'low').length,
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Choke Point Detection</h1>
          <p className="text-slate-500 text-sm mt-1">
            Automatic ranking of where users struggle most — by frequency and severity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {data?.generated_at && (
            <span className="text-xs text-slate-400 mr-2">
              Updated {new Date(data.generated_at).toLocaleTimeString()}
            </span>
          )}
          {([7, 30, 90] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`text-xs px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                days === d ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {!loading && choke_points.length > 0 && (
        <div className="flex gap-2 mb-5 flex-wrap">
          {(['all', 'critical', 'high', 'medium', 'low'] as const).map((sv) => {
            const count = sv === 'all' ? choke_points.length : counts[sv];
            const isActive = filter === sv;
            return (
              <button
                key={sv}
                onClick={() => setFilter(sv)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                }`}
              >
                {sv === 'all' ? 'All' : sv.charAt(0).toUpperCase() + sv.slice(1)} ({count})
              </button>
            );
          })}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20 text-slate-400 text-sm animate-pulse">
          Analyzing sessions…
        </div>
      )}

      {!loading && choke_points.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
            </svg>
          </div>
          <p className="font-medium text-slate-800 mb-1">No choke points detected yet</p>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Need at least 3 sessions per step to surface patterns. Check back as traffic grows.
          </p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="space-y-2 mb-8">
          {filtered.map((cp) => {
            const sev = SEVERITY_CONFIG[cp.severity_label];
            const trend = TREND_CONFIG[cp.trend];
            const isExpanded = expanded === cp.step_id;

            return (
              <div key={cp.step_id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <button
                  className="w-full text-left p-4 hover:bg-slate-50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : cp.step_id)}
                >
                  <div className="flex items-start gap-4">
                    <span className="text-xs font-bold text-slate-400 w-5 pt-0.5 shrink-0">#{cp.rank}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-slate-900 text-sm">{cp.step_title}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${sev.badge}`}>{sev.label}</span>
                        {cp.field_choke && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">fill_form</span>
                        )}
                        <span className={`text-xs font-medium ${trend.color}`}>{trend.icon} {trend.label}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-400 flex-wrap">
                        <span
                          className="text-indigo-600 hover:underline cursor-pointer"
                          onClick={(e) => { e.stopPropagation(); router.push(`/flows/${cp.flow_id}?tab=analytics`); }}
                        >
                          {cp.flow_name}
                        </span>
                        <span>·</span>
                        <span>{cp.frequency} sessions</span>
                        <span>·</span>
                        <span>{cp.avg_attempts} avg attempts</span>
                        <span>·</span>
                        <span>{fmtSecs(cp.avg_time_stuck_secs)} avg stuck</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${sev.bar}`} style={{ width: `${cp.severity_score}%` }} />
                      </div>
                      <span className="text-xs font-bold text-slate-700 w-6 text-right">{cp.severity_score}</span>
                      <span className="text-slate-300 text-xs">{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 border-t border-slate-100">
                    <div className="grid grid-cols-4 gap-3 mt-3 mb-4">
                      {[
                        { label: 'Drop rate',      value: `${cp.drop_rate}%` },
                        { label: 'Avg attempts',   value: String(cp.avg_attempts) },
                        { label: 'Avg time stuck', value: fmtSecs(cp.avg_time_stuck_secs) },
                        { label: 'Neg feedback',   value: `${cp.neg_feedback_rate}%` },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-slate-50 rounded-lg p-3">
                          <p className="text-xs text-slate-500 mb-0.5">{label}</p>
                          <p className="text-base font-bold text-slate-900">{value}</p>
                        </div>
                      ))}
                    </div>
                    {cp.example_messages.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 mb-2">What users said when stuck:</p>
                        <ul className="space-y-1">
                          {cp.example_messages.map((msg, i) => (
                            <li key={i} className="text-xs text-slate-700 bg-slate-50 rounded px-3 py-2 italic">
                              "{msg}"
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <button
                      className="mt-3 text-xs text-indigo-600 hover:underline font-medium"
                      onClick={() => router.push(`/flows/${cp.flow_id}?tab=analytics`)}
                    >
                      Open flow analytics →
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && page_summary.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Top pages by session volume</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs font-semibold text-slate-500 border-b border-slate-100">
                <th className="text-left pb-2">URL</th>
                <th className="text-right pb-2">Sessions</th>
              </tr>
            </thead>
            <tbody>
              {page_summary.map((p) => (
                <tr key={p.url} className="border-b border-slate-50 last:border-0">
                  <td className="py-2 font-mono text-xs text-slate-700 truncate max-w-xs">{p.url}</td>
                  <td className="py-2 text-right text-slate-800 font-medium">{p.sessions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
