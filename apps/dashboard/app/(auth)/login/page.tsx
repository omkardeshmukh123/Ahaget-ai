'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

type Mode = 'password' | 'magic-link' | 'magic-sent';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [mode, setMode] = useState<Mode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError('');
    setLoading(true);
    try {
      const res = await api.auth.login(email, password);
      setAuth(res.token, res.user, res.organization);
      // Route to onboarding if not complete, else dashboard
      if (!res.organization.onboardingComplete) {
        const step = (res.organization as any).onboardingStep ?? 'workspace';
        router.push(`/getting-started/${step === 'done' ? 'workspace' : step}`);
      } else {
        router.push('/dashboard');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError('');
    setLoading(true);
    try {
      await api.auth.sendMagicLink(email);
      setMode('magic-sent');
    } catch {
      setError('Failed to send magic link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'magic-sent') {
    return (
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-5">
          <svg className="w-7 h-7 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Check your inbox</h2>
        <p className="text-slate-500 text-sm leading-relaxed mb-6">
          We sent a sign-in link to <strong className="text-slate-800">{email}</strong>.<br />
          The link expires in 15 minutes.
        </p>
        <button
          onClick={() => setMode('password')}
          className="text-sm text-brand-600 hover:text-brand-700 font-medium"
        >
          ← Back to sign in
        </button>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Sign in to Ahaget</h1>
      <p className="text-slate-500 text-sm mb-8">
        New here?{' '}
        <Link href="/register" className="text-brand-600 hover:text-brand-700 font-medium">
          Create a free account
        </Link>
      </p>

      {error && (
        <div className="mb-5 p-3.5 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6">
        <button
          id="tab-password"
          onClick={() => setMode('password')}
          className={`flex-1 text-sm font-medium py-2 rounded-lg transition-all ${mode === 'password' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Password
        </button>
        <button
          id="tab-magic-link"
          onClick={() => setMode('magic-link')}
          className={`flex-1 text-sm font-medium py-2 rounded-lg transition-all ${mode === 'magic-link' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Magic link
        </button>
      </div>

      {mode === 'password' ? (
        <form id="form-password-login" onSubmit={handlePasswordLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input
              id="input-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
            <input
              id="input-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
            />
          </div>
          <button
            id="btn-password-signin"
            type="submit"
            disabled={loading || !email || !password}
            className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold text-sm transition-all shadow-sm shadow-brand-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      ) : (
        <form id="form-magic-link" onSubmit={handleMagicLink} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input
              id="input-magic-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
            />
          </div>
          <button
            id="btn-send-magic-link"
            type="submit"
            disabled={loading || !email}
            className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold text-sm transition-all shadow-sm shadow-brand-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending…' : 'Send magic link'}
          </button>
        </form>
      )}
    </>
  );
}
