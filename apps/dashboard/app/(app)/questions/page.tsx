'use client';
import { useEffect, useState } from 'react';
import { api, IntentQuestion } from '@/lib/api';

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<IntentQuestion[]>([]);
  const [pages, setPages] = useState<{ url: string; questionCount: number }[]>([]);
  const [totalMessages, setTotalMessages] = useState(0);
  const [days, setDays] = useState(30);
  const [page, setPage] = useState('');
  const [loading, setLoading] = useState(true);
  const [openQuestion, setOpenQuestion] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    api.analytics.intents(days, page || undefined).then((res) => {
      const sorted = [...res.questions].sort((a, b) => b.count - a.count);
      setQuestions(sorted);
      setPages(res.pages);
      setTotalMessages(res.totalMessages);
      setOpenQuestion(sorted.length > 0 ? 0 : null);
    }).finally(() => setLoading(false));
  }, [days, page]);

  const topTen = questions.slice(0, 10);
  const selected = openQuestion !== null ? topTen[openQuestion] ?? null : null;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Questions</h1>
          <p className="text-slate-500 text-sm mt-1">
            Every question, clustered by intent. Gaps revealed in users' own words.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={page}
            onChange={(e) => setPage(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="">All pages</option>
            {pages.map((p) => (
              <option key={p.url} value={p.url}>{p.url}</option>
            ))}
          </select>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button
            onClick={() => {
              const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
              const params = new URLSearchParams({ days: String(days) });
              if (page) params.set('page', page);
              window.open(`${apiUrl}/api/v1/analytics/intents/export?${params}`, '_blank');
            }}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-50 flex items-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <PageSkeleton />
      ) : topTen.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex gap-6">
          <div className="w-72 flex-shrink-0 space-y-1">
            {topTen.map((q, i) => (
              <button
                key={i}
                onClick={() => setOpenQuestion(i)}
                className={`w-full text-left px-4 py-3.5 rounded-xl border transition-colors ${
                  openQuestion === i
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-800'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium truncate">{q.raw}</p>
                  <span className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${
                    openQuestion === i
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    ×{q.count}
                  </span>
                </div>
                {q.pageUrl && (
                  <p className="text-xs text-slate-400 mt-1 truncate">{q.pageUrl}</p>
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 min-w-0">
            {selected && (
              <div className="bg-white rounded-xl border border-slate-200">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h2 className="text-sm font-semibold text-slate-800">"{selected.raw}"</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Asked {selected.count} {selected.count === 1 ? 'time' : 'times'} · Last seen {fmtRelative(selected.lastSeen)}
                  </p>
                </div>
                <div className="px-6 py-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 font-medium w-20">Intent</span>
                    <span className="text-xs text-slate-700">{selected.intent}</span>
                  </div>
                  {selected.pageUrl && (
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 font-medium w-20">Page</span>
                      <span className="text-xs text-slate-700 truncate">{selected.pageUrl}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 font-medium w-20">Count</span>
                    <span className="text-xs font-semibold text-slate-800">×{selected.count}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 font-medium w-20">Last seen</span>
                    <span className="text-xs text-slate-700">{fmtRelative(selected.lastSeen)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!loading && totalMessages > 0 && (
        <p className="text-xs text-slate-400 mt-6 text-center">
          Analysed {totalMessages.toLocaleString()} messages over the last {days} days
        </p>
      )}
    </div>
  );
}

function fmtRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function EmptyState() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
      <p className="text-4xl mb-4">💬</p>
      <h2 className="text-base font-semibold text-slate-800 mb-2">No questions yet</h2>
      <p className="text-sm text-slate-500 max-w-sm mx-auto">
        Once users start chatting with your AI assistant, their questions will appear here, clustered by intent.
      </p>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="flex gap-6 animate-pulse">
      <div className="w-72 space-y-2">
        {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-slate-200 rounded-xl" />)}
      </div>
      <div className="flex-1 space-y-3">
        <div className="h-64 bg-slate-200 rounded-xl" />
      </div>
    </div>
  );
}
