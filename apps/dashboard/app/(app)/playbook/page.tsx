'use client';
import { useEffect, useState } from 'react';
import { api, PlaybookConfig } from '@/lib/api';

const TONE_OPTIONS = [
  { value: 'friendly', label: 'Friendly', desc: 'Warm, encouraging, approachable' },
  { value: 'formal',   label: 'Formal',   desc: 'Professional and precise' },
  { value: 'concise',  label: 'Concise',  desc: 'Brief, direct, no filler' },
  { value: 'custom',   label: 'Custom',   desc: 'Defined by your instructions' },
] as const;

const LANGUAGE_OPTIONS = [
  { value: 'en',    label: 'English' },
  { value: 'hi',    label: 'Hindi' },
  { value: 'hinglish', label: 'Hinglish' },
  { value: 'es',    label: 'Spanish' },
  { value: 'fr',    label: 'French' },
  { value: 'de',    label: 'German' },
  { value: 'pt',    label: 'Portuguese' },
  { value: 'ja',    label: 'Japanese' },
];

const DEFAULT_CONFIG: PlaybookConfig = {
  agentName: 'AI Assistant',
  tone: 'friendly',
  language: 'en',
  mustAlwaysDo: [],
  mustNeverDo: [],
  escalateOnUserRequest: true,
  escalateOnRepeatedFail: true,
  escalateOnBillingTopics: false,
  escalationWebhook: null,
};

export default function PlaybookPage() {
  const [config, setConfig]   = useState<PlaybookConfig>(DEFAULT_CONFIG);
  const [original, setOriginal] = useState<PlaybookConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  // Rule input state
  const [newAlways, setNewAlways] = useState('');
  const [newNever,  setNewNever]  = useState('');

  useEffect(() => {
    api.playbook.get().then(({ config: c }) => {
      setConfig(c);
      setOriginal(c);
    }).finally(() => setLoading(false));
  }, []);

  const isDirty = JSON.stringify(config) !== JSON.stringify(original);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      const { config: updated } = await api.playbook.update(config);
      setConfig(updated);
      setOriginal(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  function addRule(field: 'mustAlwaysDo' | 'mustNeverDo', value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    setConfig((c) => ({ ...c, [field]: [...c[field], trimmed] }));
    if (field === 'mustAlwaysDo') setNewAlways('');
    else setNewNever('');
  }

  function removeRule(field: 'mustAlwaysDo' | 'mustNeverDo', idx: number) {
    setConfig((c) => ({ ...c, [field]: c[field].filter((_, i) => i !== idx) }));
  }

  if (loading) {
    return (
      <div className="max-w-2xl space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Playbook</h1>
        <p className="text-slate-500 text-sm mt-1">
          Define how your agent behaves — its name, voice, rules, and when it hands off to a human.
        </p>
      </div>

      <div className="space-y-4">

        {/* ── Persona ─────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Persona</p>

          <div className="space-y-4">
            {/* Agent name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Agent name</label>
              <input
                value={config.agentName}
                onChange={(e) => setConfig((c) => ({ ...c, agentName: e.target.value }))}
                placeholder="AI Assistant"
                maxLength={60}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <p className="text-xs text-slate-400 mt-1">Shown in the widget header and used in agent messages.</p>
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Language</label>
              <select
                value={config.language}
                onChange={(e) => setConfig((c) => ({ ...c, language: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
              >
                {LANGUAGE_OPTIONS.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>

            {/* Tone */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Tone</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {TONE_OPTIONS.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setConfig((c) => ({ ...c, tone: t.value }))}
                    className={`text-left px-3 py-2.5 rounded-lg border text-xs transition-all ${
                      config.tone === t.value
                        ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <p className="font-semibold">{t.label}</p>
                    <p className="text-slate-400 mt-0.5">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Guardrails ──────────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Guardrails</p>

          {/* Must always do */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-700 mb-2">Must always do</label>
            <div className="space-y-2 mb-2">
              {config.mustAlwaysDo.length === 0 && (
                <p className="text-xs text-slate-400 italic">No rules yet.</p>
              )}
              {config.mustAlwaysDo.map((rule, i) => (
                <div key={i} className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-sm text-emerald-800">
                  <span className="flex-1">{rule}</span>
                  <button
                    onClick={() => removeRule('mustAlwaysDo', i)}
                    className="text-emerald-400 hover:text-emerald-700 text-xs font-bold"
                  >✕</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newAlways}
                onChange={(e) => setNewAlways(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addRule('mustAlwaysDo', newAlways)}
                placeholder="e.g. Confirm before submitting any form"
                maxLength={200}
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <button
                onClick={() => addRule('mustAlwaysDo', newAlways)}
                disabled={!newAlways.trim()}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg disabled:opacity-40"
              >Add</button>
            </div>
          </div>

          {/* Must never do */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Must never do</label>
            <div className="space-y-2 mb-2">
              {config.mustNeverDo.length === 0 && (
                <p className="text-xs text-slate-400 italic">No rules yet.</p>
              )}
              {config.mustNeverDo.map((rule, i) => (
                <div key={i} className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-800">
                  <span className="flex-1">{rule}</span>
                  <button
                    onClick={() => removeRule('mustNeverDo', i)}
                    className="text-red-400 hover:text-red-700 text-xs font-bold"
                  >✕</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newNever}
                onChange={(e) => setNewNever(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addRule('mustNeverDo', newNever)}
                placeholder="e.g. Never share pricing without asking for their role"
                maxLength={200}
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <button
                onClick={() => addRule('mustNeverDo', newNever)}
                disabled={!newNever.trim()}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg disabled:opacity-40"
              >Add</button>
            </div>
          </div>
        </div>

        {/* ── Escalation ──────────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Escalation rules</p>
          <p className="text-xs text-slate-400 mb-4">Configure when the agent hands off to your team.</p>

          <div className="space-y-3 mb-5">
            {([
              { key: 'escalateOnUserRequest',   label: 'User explicitly asks for a human' },
              { key: 'escalateOnRepeatedFail',  label: 'Agent fails to help 3+ times in a row' },
              { key: 'escalateOnBillingTopics', label: 'Billing, refund, or account issues' },
            ] as const).map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer select-none">
                <button
                  role="switch"
                  aria-checked={config[key]}
                  onClick={() => setConfig((c) => ({ ...c, [key]: !c[key] }))}
                  className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
                    config[key] ? 'bg-indigo-600' : 'bg-slate-200'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    config[key] ? 'translate-x-4' : ''
                  }`} />
                </button>
                <span className="text-sm text-slate-700">{label}</span>
              </label>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notify via webhook <span className="text-xs font-normal text-slate-400">(optional)</span>
            </label>
            <input
              type="url"
              value={config.escalationWebhook ?? ''}
              onChange={(e) => setConfig((c) => ({ ...c, escalationWebhook: e.target.value || null }))}
              placeholder="https://hooks.slack.com/... or your endpoint"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <p className="text-xs text-slate-400 mt-1">
              Ahaget will POST a JSON payload with the session context when escalation fires.
            </p>
          </div>
        </div>

        {/* ── Save bar ────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 pb-8">
          <button
            onClick={save}
            disabled={saving || !isDirty}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save playbook'}
          </button>
          {isDirty && (
            <button
              onClick={() => { setConfig(original); setNewAlways(''); setNewNever(''); }}
              className="px-4 py-2.5 text-slate-500 hover:text-slate-800 text-sm"
            >
              Discard
            </button>
          )}
          {saved && <span className="text-emerald-600 text-sm font-medium">✓ Saved</span>}
        </div>
      </div>
    </div>
  );
}
