'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

const PRESETS = [
  { name: 'Indigo', primary: '#6366f1' },
  { name: 'Violet', primary: '#8b5cf6' },
  { name: 'Blue',   primary: '#3b82f6' },
  { name: 'Teal',   primary: '#14b8a6' },
  { name: 'Rose',   primary: '#f43f5e' },
  { name: 'Amber',  primary: '#f59e0b' },
];

export default function BrandingPage() {
  const org = useAuthStore((s) => s.org);
  const [primary, setPrimary] = useState('#6366f1');
  const [gradFrom, setGradFrom] = useState('#6366f1');
  const [gradTo, setGradTo] = useState('#8b5cf6');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [activeTab, setActiveTab] = useState<'theme' | 'entry' | 'sidebar'>('theme');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // In a real implementation this would call a branding endpoint
      await new Promise((r) => setTimeout(r, 800));
      showToast('Branding saved!');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl">
      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-xl z-50">
          {toast}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Branding</h1>
        <p className="text-slate-500 text-sm">Customise how the Prism assistant looks inside your app.</p>
      </div>

      <div className="flex gap-6">
        {/* Settings panel */}
        <div className="flex-1 space-y-5">
          {/* Tabs */}
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
            {(['theme', 'entry', 'sidebar'] as const).map((t) => (
              <button
                key={t}
                id={`tab-branding-${t}`}
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
                      id={`preset-${p.name.toLowerCase()}`}
                      onClick={() => { setPrimary(p.primary); setGradFrom(p.primary); }}
                      title={p.name}
                      className={`w-8 h-8 rounded-full transition-all hover:scale-110 ring-2 ring-offset-2 ${
                        primary === p.primary ? 'ring-slate-900' : 'ring-transparent'
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
                    id="input-primary-color"
                    type="color"
                    value={primary}
                    onChange={(e) => setPrimary(e.target.value)}
                    className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-1 bg-white"
                  />
                  <input
                    type="text"
                    value={primary}
                    onChange={(e) => setPrimary(e.target.value)}
                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                  />
                </div>
              </div>

              {/* Gradient */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Gradient colors</label>
                <div className="flex items-center gap-3">
                  <input
                    id="input-grad-from"
                    type="color"
                    value={gradFrom}
                    onChange={(e) => setGradFrom(e.target.value)}
                    className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-1 bg-white"
                  />
                  <div className="flex-1 h-10 rounded-xl" style={{ background: `linear-gradient(to right, ${gradFrom}, ${gradTo})` }} />
                  <input
                    id="input-grad-to"
                    type="color"
                    value={gradTo}
                    onChange={(e) => setGradTo(e.target.value)}
                    className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-1 bg-white"
                  />
                </div>
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

          <button
            id="btn-branding-save"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>

        {/* Live preview widget */}
        <div className="w-64 flex-shrink-0">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Live preview</p>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4" style={{ background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})` }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <span className="text-white text-xs font-semibold">Prism Assistant</span>
              </div>
              <div className="bg-white/10 rounded-lg px-3 py-2">
                <p className="text-white/90 text-xs">👋 Hi! How can I help you today?</p>
              </div>
            </div>
            <div className="p-3 border-t border-slate-100">
              <div className="h-8 rounded-lg" style={{ backgroundColor: primary + '20' }}>
                <div className="flex items-center h-full px-3">
                  <span className="text-xs font-medium" style={{ color: primary }}>Type a message…</span>
                </div>
              </div>
            </div>
          </div>
          {/* Widget badge */}
          <div className="mt-3 flex justify-end">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg cursor-pointer"
              style={{ background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})` }}
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
