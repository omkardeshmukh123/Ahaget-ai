'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function WorkspacePage() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isValidUrl = (val: string) => {
    if (!val.trim()) return false;
    try {
      const full = val.startsWith('http') ? val : `https://${val}`;
      const u = new URL(full);
      return u.hostname.includes('.');
    } catch {
      return false;
    }
  };

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidUrl(url)) {
      setError('Please enter a valid domain, e.g. acme.com');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.onboarding.updateWizard({ websiteUrl: url, step: 'attribution' });
      router.push('/getting-started/attribution');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Icon */}
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mb-6 shadow-lg shadow-indigo-200">
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-slate-900 mb-2">Let's start with a link</h1>
      <p className="text-slate-500 text-[15px] leading-relaxed mb-8">
        Enter your product's website. Prism will use this to personalise the AI assistant embed snippet for your domain.
      </p>

      <form onSubmit={handleContinue} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Your website URL</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <span className="text-slate-400 text-sm">https://</span>
            </div>
            <input
              id="input-website-url"
              type="text"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setError(''); }}
              placeholder="acme.com"
              className="w-full pl-[74px] pr-4 py-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all text-slate-900"
              autoFocus
            />
          </div>
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        </div>

        <button
          id="btn-workspace-continue"
          type="submit"
          disabled={loading || !url.trim()}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all shadow-sm shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? 'Saving…' : 'Continue'}
          {!loading && (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}
