'use client';
import { useState, useEffect } from 'react';
import { api, BrandingConfig } from '@/lib/api';

const PRESETS = [
  { name: 'Indigo', primary: '#6366f1', gradFrom: '#6366f1', gradTo: '#8b5cf6' },
  { name: 'Violet', primary: '#8b5cf6', gradFrom: '#8b5cf6', gradTo: '#a78bfa' },
  { name: 'Blue',   primary: '#3b82f6', gradFrom: '#3b82f6', gradTo: '#6366f1' },
  { name: 'Teal',   primary: '#14b8a6', gradFrom: '#14b8a6', gradTo: '#3b82f6' },
  { name: 'Rose',   primary: '#f43f5e', gradFrom: '#f43f5e', gradTo: '#a855f7' },
  { name: 'Amber',  primary: '#f59e0b', gradFrom: '#f59e0b', gradTo: '#ef4444' },
];

const DEFAULTS: BrandingConfig = {
  primaryColor: '#6366f1',
  gradFrom:     '#6366f1',
  gradTo:       '#8b5cf6',
  position:     'bottom-right',
  idleThreshold: 30000,
};

export default function BrandingPage() {
  const [config, setConfig]     = useState<BrandingConfig>(DEFAULTS);
  const [original, setOriginal] = useState<BrandingConfig>(DEFAULTS);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState('');
  const [activeTab, setActiveTab] = useState<'theme' | 'entry' | 'sidebar'>('theme');

  useEffect(() => {
    api.branding.get()
      .then((data) => { setConfig(data); setOriginal(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isDirty = JSON.stringify(config) !== JSON.stringify(original);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await api.branding.update(config);
      setConfig(updated);
      setOriginal(updated);
      showToast('Branding saved!');
    } catch {
      showToast('Failed to save — please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-40 bg-slate-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-xl z-50">
          {toast}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Branding</h1>
        <p className="text-slate-500 text-sm">Customise how the Ahaget assistant looks inside your app.</p>
      </div>

      <div className="flex gap-6">
        {/* Settings panel */}
        <div className="flex-1 space-y-5">
          {/* Tabs */}
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
            {(['theme', 'entry', 'sidebar'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`text-sm font-medium px-4 py-1.5 rounded-lg capitalize transition-all ${
                  activeTab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t === 'entry' ? 'Entry points' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {activeTab === 'theme' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-6">
              {/* Presets */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Quick presets</label>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => setConfig((c) => ({ ...c, primaryColor: p.primary, gradFrom: p.gradFrom, gradTo: p.gradTo }))}
                      title={p.name}
                      className={`w-8 h-8 rounded-full transition-all hover:scale-110 ring-2 ring-offset-2 ${
                        config.primaryColor === p.primary ? 'ring-slate-900' : 'ring-transparent'
                      }`}
                      style={{ backgroundColor: p.primary }}
                    />
                  ))}
                </div>
              </div>

              {/* Primary color */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Primary color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={config.primaryColor}
                    onChange={(e) => setConfig((c) => ({ ...c, primaryColor: e.target.value }))}
                    className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-1 bg-white"
                  />
                  <input
                    type="text"
                    value={config.primaryColor}
                    onChange={(e) => setConfig((c) => ({ ...c, primaryColor: e.target.value }))}
                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                  />
                </div>
              </div>

              {/* Gradient */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Header gradient</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={config.gradFrom}
                    onChange={(e) => setConfig((c) => ({ ...c, gradFrom: e.target.value }))}
                    className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-1 bg-white"
                  />
                  <div className="flex-1 h-10 rounded-xl" style={{ background: `linear-gradient(to right, ${config.gradFrom}, ${config.gradTo})` }} />
                  <input
                    type="color"
                    value={config.gradTo}
                    onChange={(e) => setConfig((c) => ({ ...c, gradTo: e.target.value }))}
                    className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-1 bg-white"
                  />
                </div>
              </div>

              {/* Position */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Widget position</label>
                <div className="flex gap-2">
                  {(['bottom-right', 'bottom-left'] as const).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => setConfig((c) => ({ ...c, position: pos }))}
                      className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        config.position === pos
                          ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {pos === 'bottom-right' ? '→ Bottom right' : '← Bottom left'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Idle threshold */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Idle threshold
                  <span className="ml-2 text-xs font-normal text-slate-400">(ms before widget appears)</span>
                </label>
                <input
                  type="number"
                  min={0}
                  max={300000}
                  step={1000}
                  value={config.idleThreshold}
                  onChange={(e) => setConfig((c) => ({ ...c, idleThreshold: Number(e.target.value) }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                />
                <p className="text-xs text-slate-400 mt-1">{(config.idleThreshold / 1000).toFixed(0)} seconds</p>
              </div>
            </div>
          )}

          {activeTab === 'entry' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <p className="text-sm text-slate-500">Entry point configuration coming soon — control how the widget badge appears on your site.</p>
            </div>
          )}

          {activeTab === 'sidebar' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <p className="text-sm text-slate-500">Sidebar customisation coming soon — control the layout and sections of the in-app assistant panel.</p>
            </div>
          )}

          <div className="flex items-center gap-3 pb-8">
            <button
              onClick={handleSave}
              disabled={saving || !isDirty}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            {isDirty && (
              <button
                onClick={() => setConfig(original)}
                className="px-4 py-2.5 text-slate-500 hover:text-slate-800 text-sm"
              >
                Discard
              </button>
            )}
          </div>
        </div>

        {/* Live preview */}
        <div className="w-64 flex-shrink-0">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Live preview</p>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4" style={{ background: `linear-gradient(135deg, ${config.gradFrom}, ${config.gradTo})` }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <span className="text-white text-xs font-semibold">Ahaget Assistant</span>
              </div>
              <div className="bg-white/10 rounded-lg px-3 py-2">
                <p className="text-white/90 text-xs">Hi! How can I help you today?</p>
              </div>
            </div>
            <div className="p-3 border-t border-slate-100">
              <div className="h-8 rounded-lg" style={{ backgroundColor: config.primaryColor + '20' }}>
                <div className="flex items-center h-full px-3">
                  <span className="text-xs font-medium" style={{ color: config.primaryColor }}>Type a message…</span>
                </div>
              </div>
            </div>
          </div>
          <div className={`mt-3 flex ${config.position === 'bottom-left' ? 'justify-start' : 'justify-end'}`}>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg cursor-pointer"
              style={{ background: `linear-gradient(135deg, ${config.gradFrom}, ${config.gradTo})` }}
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
