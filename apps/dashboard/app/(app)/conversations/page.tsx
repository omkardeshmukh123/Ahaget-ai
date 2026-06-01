'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, Conversation } from '@/lib/api';

const PAGE_SIZE = 20;

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    api.conversations.list({ limit: PAGE_SIZE, offset }).then((res) => {
      setConversations(res.conversations);
      setTotal(res.total);
    }).catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [offset]);

  const filtered = search
    ? conversations.filter((c) =>
        c.endUser.externalId?.toLowerCase().includes(search.toLowerCase()) ||
        c.triggeredBy?.includes(search.toLowerCase())
      )
    : conversations;

  const triggerBadge = (t: string | null) => {
    const map: Record<string, string> = {
      idle: 'bg-brand-50 text-brand-700',
      exit_intent: 'bg-amber-50 text-amber-700',
      manual: 'bg-emerald-50 text-emerald-700',
    };
    return map[t ?? 'manual'] ?? 'bg-slate-100 text-slate-600';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Conversations</h1>
          <p className="text-slate-500 text-sm mt-1">{total} total</p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by user ID or trigger…"
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {error ? (
          <div className="p-10 text-center">
            <p className="text-sm text-red-500 mb-3">{error}</p>
            <button onClick={() => { setError(null); setLoading(true); setOffset(0); }} className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50">Retry</button>
          </div>
        ) : loading ? (
          <div className="p-8 text-center text-slate-400 text-sm animate-pulse">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 px-12 text-center">
            <div className="text-4xl mb-4 leading-none">💬</div>
            <p className="font-bold text-base text-slate-800 mb-2">No conversations yet</p>
            <p className="text-sm text-slate-400 mb-6 max-w-sm mx-auto leading-relaxed">
              {search
                ? 'No conversations match your search. Try a different user ID or trigger.'
                : 'Conversations appear here when the in-page assistant engages a user. Install the widget to start capturing sessions.'}
            </p>
            {!search && (
              <a
                href="/getting-started/install"
                className="inline-block text-sm font-semibold px-5 py-2.5 rounded-lg no-underline transition-colors"
                style={{ background: '#8A2BE2', color: '#fff' }}
              >
                Install the widget →
              </a>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">User</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Triggered by</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Messages</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Started</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-slate-800">
                    {c.endUser.externalId ?? <span className="text-slate-400 italic">anonymous</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${triggerBadge(c.triggeredBy)}`}>
                      {(c.triggeredBy ?? 'manual').replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">{c.messageCount}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.status === 'active' ? 'bg-brand-100 text-brand-600' : 'bg-slate-100 text-slate-500'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">
                    {new Date(c.startedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link href={`/conversations/${c.id}`} className="text-brand-600 hover:underline text-xs font-medium">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 text-sm text-slate-500">
            <span>Showing {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}</span>
            <div className="flex gap-2">
              <button
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                className="px-3 py-1 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50"
              >
                ← Prev
              </button>
              <button
                disabled={offset + PAGE_SIZE >= total}
                onClick={() => setOffset(offset + PAGE_SIZE)}
                className="px-3 py-1 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
