'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

type Status = 'loading' | 'ready' | 'submitting' | 'error' | 'invalid';

export default function AcceptInvitePage() {
  const router = useRouter();
  const { token } = useParams<{ token: string }>();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [status, setStatus] = useState<Status>('loading');
  const [inviteInfo, setInviteInfo] = useState<{ email: string; orgName: string; role: string } | null>(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { setStatus('invalid'); return; }
    api.team.getInvite(token)
      .then((info) => { setInviteInfo(info); setStatus('ready'); })
      .catch(() => setStatus('invalid'));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError('');
    setStatus('submitting');
    try {
      const res = await api.team.acceptInvite(token, name, password);
      setAuth(res.token, res.user, res.organization);
      router.replace('/dashboard');
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Failed to accept invitation');
      setStatus('ready');
    }
  };

  if (status === 'loading') {
    return (
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-5">
          <svg className="w-7 h-7 text-brand-600 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
        </div>
        <p className="text-slate-500 text-sm">Loading invitation…</p>
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
          <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Invitation not found</h2>
        <p className="text-slate-500 text-sm mb-6">
          This invitation link is invalid or has expired. Ask your team admin to send a new one.
        </p>
        <a href="/login" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
          ← Back to sign in
        </a>
      </div>
    );
  }

  return (
    <>
      <div className="mb-7 text-center">
        <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-900">Join {inviteInfo?.orgName}</h1>
        <p className="text-sm text-slate-500 mt-1">
          You were invited as <span className="font-medium">{inviteInfo?.email}</span>. Set up your account below.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Your name</label>
          <input
            id="input-invite-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Smith"
            required
            autoFocus
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Create a password</label>
          <input
            id="input-invite-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
            minLength={8}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{error}</p>
        )}

        <button
          id="btn-accept-invite"
          type="submit"
          disabled={status === 'submitting'}
          className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 mt-2"
        >
          {status === 'submitting' ? 'Creating account…' : 'Accept invitation'}
        </button>
      </form>

      <p className="text-center text-xs text-slate-400 mt-5">
        Already have an account?{' '}
        <a href="/login" className="text-brand-600 hover:text-brand-700 font-medium">Sign in</a>
      </p>
    </>
  );
}
