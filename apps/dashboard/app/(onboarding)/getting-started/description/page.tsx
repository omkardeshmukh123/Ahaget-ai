'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function DescriptionPage() {
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    setError('');
    setLoading(true);
    try {
      await api.onboarding.createWorkspace(description.trim());
      router.push('/getting-started/install');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => router.push('/getting-started/attribution');

  return (
    <div>
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-6 shadow-lg shadow-emerald-200">
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-slate-900 mb-2">What does your product do?</h1>
      <p className="text-slate-500 text-[15px] leading-relaxed mb-8">
        Give Ahaget's AI a brief description of your product. This becomes the assistant's system instructions so it can answer your users' questions accurately.
      </p>

      {error && (
        <div className="mb-5 p-3.5 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleCreate} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Product description</label>
          <textarea
            id="input-product-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="We're a B2B SaaS that helps engineering teams track deployment metrics. Our main features are a CI/CD dashboard, rollback tools, and incident management…"
            rows={5}
            autoFocus
            className="w-full px-4 py-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all text-slate-900 resize-none leading-relaxed"
          />
          <p className="mt-1.5 text-xs text-slate-400 text-right">{description.length} chars</p>
        </div>

        <div className="flex gap-3">
          <button
            id="btn-description-back"
            type="button"
            onClick={handleBack}
            className="px-5 py-3.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            ← Back
          </button>
          <button
            id="btn-create-workspace"
            type="submit"
            disabled={!description.trim() || loading}
            className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all shadow-sm shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating workspace…' : 'Create workspace'}
          </button>
        </div>
      </form>
    </div>
  );
}
