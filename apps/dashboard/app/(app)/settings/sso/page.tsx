'use client';
import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function apiFetch(path: string, opts?: RequestInit) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export default function SsoPage() {
  const [status, setStatus] = useState<{ configured: boolean; name?: string; stale?: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/api/v1/auth/sso/connection')
      .then(setStatus)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function openAdminPortal() {
    setActionLoading(true);
    setError(null);
    try {
      const { url } = await apiFetch('/api/v1/auth/sso/admin-portal', { method: 'POST' });
      window.open(url, '_blank');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to open admin portal');
    } finally {
      setActionLoading(false);
    }
  }

  async function disconnect() {
    if (!confirm('Remove SSO configuration? Users will need to log in with password.')) return;
    setActionLoading(true);
    setError(null);
    try {
      await apiFetch('/api/v1/auth/sso/connection', { method: 'DELETE' });
      setStatus({ configured: false });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to disconnect SSO');
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Single Sign-On (SSO)</h1>
        <p className="mt-1 text-sm text-slate-400">
          Connect your identity provider (Okta, Azure AD, Google Workspace) so your team can log in via SAML or OIDC.
          Available on the Scale plan.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-900/30 border border-red-700 px-4 py-3 text-sm text-red-300">{error}</div>
      )}

      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 space-y-4">
        {loading ? (
          <p className="text-sm text-slate-400">Loading SSO status…</p>
        ) : status?.configured ? (
          <>
            <div className="flex items-center gap-3">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-400" />
              <span className="text-sm font-medium text-white">SSO configured</span>
              {status.name && <span className="text-sm text-slate-400">— {status.name}</span>}
            </div>
            <p className="text-sm text-slate-400">
              Your team members can now sign in using your identity provider. New users who authenticate via SSO are
              automatically added as members of your workspace.
            </p>
            <div className="flex gap-3">
              <button
                onClick={openAdminPortal}
                disabled={actionLoading}
                className="rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-50 px-4 py-2 text-sm font-medium text-white transition"
              >
                {actionLoading ? 'Opening…' : 'Edit IdP Configuration'}
              </button>
              <button
                onClick={disconnect}
                disabled={actionLoading}
                className="rounded-lg border border-slate-600 hover:border-red-500 hover:text-red-400 disabled:opacity-50 px-4 py-2 text-sm font-medium text-slate-300 transition"
              >
                Disconnect SSO
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-slate-300">SSO is not configured for your workspace.</p>
            <p className="text-sm text-slate-400">
              Click below to open the WorkOS Admin Portal where you can connect your identity provider. The setup takes
              about 5 minutes and supports Okta, Azure AD, Google Workspace, and any SAML 2.0 / OIDC provider.
            </p>
            <button
              onClick={openAdminPortal}
              disabled={actionLoading}
              className="rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-50 px-4 py-2 text-sm font-medium text-white transition"
            >
              {actionLoading ? 'Opening…' : 'Configure SSO'}
            </button>
          </>
        )}
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-5 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">How it works</p>
        <ol className="space-y-1 text-sm text-slate-400 list-decimal list-inside">
          <li>Click <strong className="text-slate-300">Configure SSO</strong> to open the WorkOS setup portal</li>
          <li>Select your identity provider and follow the instructions</li>
          <li>Once active, users on your domain can sign in via SSO from the login page</li>
          <li>New users are auto-provisioned as workspace members on first login</li>
        </ol>
      </div>
    </div>
  );
}
