'use client';
import { useState, useEffect } from 'react';
import { api, McpConnector } from '@/lib/api';

export default function McpPage() {
  const [connectors, setConnectors] = useState<McpConnector[]>([]);
  const [fetching, setFetching] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', serverUrl: '', authType: 'none' as 'none' | 'bearer' | 'api_key', authValue: '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    api.mcp.list().then((r) => {
      setConnectors(r.connectors);
      setFetching(false);
    }).catch(() => setFetching(false));
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.mcp.create({
        name: form.name,
        serverUrl: form.serverUrl,
        authType: form.authType,
        authValue: form.authValue || undefined,
        enabled: true,
      });
      setConnectors((prev) => [res.connector, ...prev]);
      setShowModal(false);
      setForm({ name: '', serverUrl: '', authType: 'none', authValue: '' });
      showToast('MCP connector created!');
    } catch {
      showToast('Failed to create connector.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.mcp.delete(id);
      setConnectors((prev) => prev.filter((c) => c.id !== id));
      showToast('Connector removed.');
    } catch {
      showToast('Failed to remove connector.');
    }
  };

  const handleToggle = async (connector: McpConnector) => {
    try {
      const res = await api.mcp.update(connector.id, { enabled: !connector.enabled });
      setConnectors((prev) => prev.map((c) => c.id === connector.id ? res.connector : c));
    } catch {}
  };

  return (
    <div className="max-w-4xl">
      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-xl z-50">
          {toast}
        </div>
      )}

      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">MCP Integrations</h1>
          <p className="text-slate-500 text-sm">Connect Model Context Protocol servers to give the AI agent access to your tools and data.</p>
        </div>
        <button
          id="btn-mcp-create"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-indigo-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          + Create new
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-700">Connectors</p>
        </div>

        {fetching ? (
          <div className="px-5 py-12 text-center text-slate-400 text-sm">Loading…</div>
        ) : connectors.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064" />
              </svg>
            </div>
            <p className="text-sm text-slate-500">No MCP connectors yet</p>
            <p className="text-xs text-slate-400 mt-1">Create one to give the AI agent access to your tools</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Server</th>
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Connection</th>
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {connectors.map((c) => (
                <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-slate-800">{c.name}</p>
                    <p className="text-xs text-slate-400 capitalize">{c.authType}</p>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-500 font-mono max-w-[200px] truncate">{c.serverUrl}</td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => handleToggle(c)}
                      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                        c.enabled
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${c.enabled ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {c.enabled ? 'Connected' : 'Disabled'}
                    </button>
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => handleDelete(c.id)}
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

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">New MCP Connector</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
                <input
                  id="input-mcp-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Production DB"
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Server URL</label>
                <input
                  id="input-mcp-server"
                  value={form.serverUrl}
                  onChange={(e) => setForm({ ...form, serverUrl: e.target.value })}
                  placeholder="https://mcp.yourapp.com"
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Auth type</label>
                <select
                  id="select-mcp-auth"
                  value={form.authType}
                  onChange={(e) => setForm({ ...form, authType: e.target.value as 'none' | 'bearer' | 'api_key' })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                >
                  <option value="none">None</option>
                  <option value="bearer">Bearer token</option>
                  <option value="api_key">API key</option>
                </select>
              </div>
              {form.authType !== 'none' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {form.authType === 'bearer' ? 'Bearer token' : 'API key'}
                  </label>
                  <input
                    id="input-mcp-auth-value"
                    type="password"
                    value={form.authValue}
                    onChange={(e) => setForm({ ...form, authValue: e.target.value })}
                    placeholder="••••••••••••"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                  />
                </div>
              )}
              <button
                id="btn-mcp-save"
                type="submit"
                disabled={saving || !form.name || !form.serverUrl}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                {saving ? 'Creating…' : 'Create connector'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
