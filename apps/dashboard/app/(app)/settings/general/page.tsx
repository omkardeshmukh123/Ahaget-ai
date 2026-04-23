'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

type Tab = 'general' | 'hosts' | 'members' | 'advanced';

export default function SettingsGeneralPage() {
  const { org } = useAuthStore();
  const [tab, setTab] = useState<Tab>('general');
  const [name, setName] = useState(org?.name ?? '');
  const [description, setDescription] = useState('');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    api.config.get().then((r) => {
      setDescription(r.customInstructions ?? '');
      setName(r.name ?? '');
    }).catch(() => {});
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const copyAppId = async () => {
    if (!org?.apiKey) return;
    await navigator.clipboard.writeText(org.apiKey).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.config.updateAI(description);
      showToast('Settings saved!');
    } catch {
      showToast('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: 'general',  label: 'General' },
    { key: 'hosts',    label: 'Hosts' },
    { key: 'members',  label: 'Members' },
    { key: 'advanced', label: 'Advanced' },
  ];

  return (
    <div className="max-w-2xl">
      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-xl z-50">
          {toast}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Settings</h1>
        <p className="text-slate-500 text-sm">Manage your workspace configuration.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 mb-6">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            id={`tab-settings-${key}`}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${
              tab === key
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'general' && (
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5">
            {/* Account Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Account name</label>
              <input
                id="input-account-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My SaaS Company"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
              />
            </div>

            {/* App ID */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">App ID</label>
              <div className="flex gap-2">
                <input
                  id="input-app-id"
                  value={org?.apiKey ?? ''}
                  readOnly
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-mono bg-slate-50 text-slate-500 select-all"
                />
                <button
                  id="btn-copy-app-id"
                  onClick={copyAppId}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                    copied
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-slate-400">This is your unique App ID. Use it in the embed snippet.</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">AI instructions / description</label>
              <textarea
                id="input-ai-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Describe your product so the AI knows how to help your users…"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all resize-none"
              />
            </div>

            <button
              id="btn-settings-save"
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      )}

      {tab === 'hosts' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-sm font-semibold text-slate-700 mb-1">Allowed hosts</p>
          <p className="text-sm text-slate-500 mb-4">Restrict which domains can load the Prism widget using your App ID.</p>
          <input
            id="input-allowed-hosts"
            placeholder="acme.com, app.acme.com"
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
          />
          <p className="mt-1.5 text-xs text-slate-400">Comma-separated list of domains. Leave empty to allow all.</p>
        </div>
      )}

      {tab === 'members' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-slate-700">Team members</p>
            <button className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">+ Invite member</button>
          </div>
          <div className="divide-y divide-slate-100">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-sm font-bold">
                  {org?.name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{org?.name}</p>
                  <p className="text-xs text-slate-400">Owner</p>
                </div>
              </div>
              <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">Owner</span>
            </div>
          </div>
        </div>
      )}

      {tab === 'advanced' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-1">Danger zone</p>
            <p className="text-sm text-slate-500">These actions are irreversible. Proceed with caution.</p>
          </div>
          <div className="border border-red-100 bg-red-50 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-red-800">Delete workspace</p>
              <p className="text-xs text-red-600 mt-0.5">Permanently deletes all data and cancels your subscription.</p>
            </div>
            <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors">
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
