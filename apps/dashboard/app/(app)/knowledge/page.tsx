'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface KbSource {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
}

export default function KnowledgePage() {
  const [sources, setSources] = useState<KbSource[]>([]);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [toast, setToast] = useState('');

  useEffect(() => {
    api.kb.list().then((r) => {
      setSources(r.articles ?? []);
      setFetching(false);
    }).catch(() => setFetching(false));
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    try {
      const res = await api.kb.create({ title: url.trim(), content: `URL: ${url.trim()}` });
      setSources((prev) => [res.article, ...prev]);
      setUrl('');
      showToast('Knowledge source added!');
    } catch {
      showToast('Failed to add source. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.kb.delete(id);
      setSources((prev) => prev.filter((s) => s.id !== id));
      showToast('Source removed.');
    } catch {
      showToast('Failed to remove source.');
    }
  };

  return (
    <div className="max-w-3xl">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-xl z-50 animate-in fade-in">
          {toast}
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Knowledge Sources</h1>
        <p className="text-slate-500 text-sm">
          Add URLs or documents that Tesseract's AI will use to answer user questions accurately.
        </p>
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} className="bg-white border border-slate-200 rounded-2xl p-5 mb-6">
        <p className="text-sm font-semibold text-slate-700 mb-3">Add a source</p>
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              id="input-kb-url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://docs.yourapp.com or paste content URL"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
            />
          </div>
          <button
            id="btn-kb-add"
            type="submit"
            disabled={loading || !url.trim()}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            )}
            Add
          </button>
        </div>
      </form>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">Sources</p>
          <span className="text-xs text-slate-400">{sources.length} total</span>
        </div>

        {fetching ? (
          <div className="px-5 py-12 text-center text-slate-400 text-sm">Loading…</div>
        ) : sources.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <p className="text-sm text-slate-500">No sources yet</p>
            <p className="text-xs text-slate-400 mt-1">Add your first URL above to get started</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Source</th>
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Added</th>
                <th className="px-5 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {sources.map((src) => (
                <tr key={src.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-slate-800 truncate max-w-xs">{src.title}</p>
                    {src.tags.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {src.tags.map((t) => (
                          <span key={t} className="text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-md">{t}</span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-400">
                    {new Date(src.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => handleDelete(src.id)}
                      className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
