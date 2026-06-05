'use client';
import { useState, useEffect } from 'react';
import { api, TeamMember, PendingInvite } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

type Tab = 'general' | 'hosts' | 'members' | 'advanced';

export default function SettingsGeneralPage() {
  const { org, user } = useAuthStore();
  const [tab, setTab] = useState<Tab>('general');
  const [name, setName] = useState(org?.name ?? '');
  const [description, setDescription] = useState('');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  // Team tab state
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'admin'>('member');
  const [inviteSending, setInviteSending] = useState(false);

  useEffect(() => {
    api.config.get().then((r) => {
      setDescription(r.customInstructions ?? '');
      setName(r.name ?? '');
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (tab !== 'members') return;
    setTeamLoading(true);
    api.team.list()
      .then((r) => { setMembers(r.members); setPendingInvites(r.pendingInvites); })
      .catch(() => {})
      .finally(() => setTeamLoading(false));
  }, [tab]);

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setInviteSending(true);
    try {
      await api.team.invite(inviteEmail, inviteRole);
      showToast(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      setShowInviteModal(false);
      // refresh pending invites
      api.team.list().then((r) => { setMembers(r.members); setPendingInvites(r.pendingInvites); }).catch(() => {});
    } catch (e: unknown) {
      showToast((e as Error).message ?? 'Failed to send invitation');
    } finally {
      setInviteSending(false);
    }
  };

  const handleRemoveMember = async (userId: string, email: string) => {
    if (!confirm(`Remove ${email} from the workspace?`)) return;
    try {
      await api.team.removeUser(userId);
      setMembers((prev) => prev.filter((m) => m.id !== userId));
      showToast('Member removed');
    } catch (e: unknown) {
      showToast((e as Error).message ?? 'Failed to remove member');
    }
  };

  const handleRevokeInvite = async (inviteId: string, email: string) => {
    if (!confirm(`Revoke invitation for ${email}?`)) return;
    try {
      await api.team.revokeInvite(inviteId);
      setPendingInvites((prev) => prev.filter((i) => i.id !== inviteId));
      showToast('Invitation revoked');
    } catch (e: unknown) {
      showToast((e as Error).message ?? 'Failed to revoke invitation');
    }
  };

  const isOwnerOrAdmin = user?.role === 'owner' || user?.role === 'admin';

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
    <div className="max-w-2xl mx-auto">
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
                ? 'border-brand-600 text-brand-700'
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
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
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
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all resize-none"
              />
            </div>

            <button
              id="btn-settings-save"
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      )}

      {tab === 'hosts' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-sm font-semibold text-slate-700 mb-1">Allowed hosts</p>
          <p className="text-sm text-slate-500 mb-4">Restrict which domains can load the Ahaget widget using your App ID.</p>
          <input
            id="input-allowed-hosts"
            placeholder="acme.com, app.acme.com"
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400"
          />
          <p className="mt-1.5 text-xs text-slate-400">Comma-separated list of domains. Leave empty to allow all.</p>
        </div>
      )}

      {tab === 'members' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-slate-700">Team members</p>
              {isOwnerOrAdmin && (
                <button
                  id="btn-invite-member"
                  onClick={() => setShowInviteModal(true)}
                  className="text-xs text-brand-600 hover:text-brand-700 font-semibold"
                >
                  + Invite member
                </button>
              )}
            </div>

            {teamLoading ? (
              <p className="text-sm text-slate-400 py-4 text-center">Loading…</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-bold select-none">
                        {(m.name ?? m.email)[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{m.name ?? m.email}</p>
                        {m.name && <p className="text-xs text-slate-400">{m.email}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        m.role === 'owner' ? 'bg-brand-50 text-brand-700' :
                        m.role === 'admin' ? 'bg-amber-50 text-amber-700' :
                        'bg-slate-100 text-slate-500'
                      }`}>{m.role}</span>
                      {isOwnerOrAdmin && m.id !== user?.id && m.role !== 'owner' && (
                        <button
                          onClick={() => handleRemoveMember(m.id, m.email)}
                          className="text-xs text-red-400 hover:text-red-600 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {pendingInvites.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <p className="text-sm font-semibold text-slate-700 mb-3">Pending invitations</p>
              <div className="divide-y divide-slate-100">
                {pendingInvites.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-sm font-bold select-none">
                        {inv.email[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600">{inv.email}</p>
                        <p className="text-xs text-slate-400">
                          Expires {new Date(inv.expiresAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-yellow-50 text-yellow-700 px-2.5 py-1 rounded-full font-medium">Pending</span>
                      {isOwnerOrAdmin && (
                        <button
                          onClick={() => handleRevokeInvite(inv.id, inv.email)}
                          className="text-xs text-red-400 hover:text-red-600 transition-colors"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Invite modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Invite a teammate</h2>
            <p className="text-sm text-slate-500 mb-5">They'll receive an email with a link to set up their account.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email address</label>
                <input
                  id="input-invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                  placeholder="teammate@company.com"
                  autoFocus
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Role</label>
                <select
                  id="select-invite-role"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'member' | 'admin')}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 bg-white"
                >
                  <option value="member">Member — view & use dashboard</option>
                  <option value="admin">Admin — can also manage settings & invite</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                id="btn-send-invite"
                onClick={handleInvite}
                disabled={inviteSending || !inviteEmail}
                className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                {inviteSending ? 'Sending…' : 'Send invitation'}
              </button>
              <button
                onClick={() => { setShowInviteModal(false); setInviteEmail(''); }}
                className="px-5 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
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
