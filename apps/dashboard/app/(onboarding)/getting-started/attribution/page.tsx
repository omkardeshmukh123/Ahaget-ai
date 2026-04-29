'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

const OPTIONS = [
  { value: 'ai_search', label: 'AI search (ChatGPT, Perplexity…)', icon: '🤖' },
  { value: 'google',    label: 'Google search',                    icon: '🔍' },
  { value: 'linkedin',  label: 'LinkedIn',                         icon: '💼' },
  { value: 'word_of_mouth', label: 'Word of mouth / colleague',   icon: '💬' },
  { value: 'other',     label: 'Other',                            icon: '✨' },
] as const;

type Attribution = typeof OPTIONS[number]['value'];

export default function AttributionPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Attribution | null>(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await api.onboarding.updateWizard({ attribution: selected, step: 'description' });
      router.push('/getting-started/description');
    } catch {
      // noop — not critical
      router.push('/getting-started/description');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => router.push('/getting-started/workspace');

  return (
    <div>
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg shadow-violet-200">
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-slate-900 mb-2">Where did you hear about us?</h1>
      <p className="text-slate-500 text-[15px] leading-relaxed mb-8">
        This helps us understand how people discover Ahaget so we can build the right things.
      </p>

      <div className="space-y-3 mb-8">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            id={`option-${opt.value}`}
            type="button"
            onClick={() => setSelected(opt.value)}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border-2 text-left transition-all ${
              selected === opt.value
                ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/40'
            }`}
          >
            <span className="text-xl">{opt.icon}</span>
            <span className={`text-sm font-medium ${selected === opt.value ? 'text-indigo-800' : 'text-slate-700'}`}>
              {opt.label}
            </span>
            {selected === opt.value && (
              <div className="ml-auto w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          id="btn-attribution-back"
          type="button"
          onClick={handleBack}
          className="px-5 py-3.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          ← Back
        </button>
        <button
          id="btn-attribution-continue"
          type="button"
          onClick={handleContinue}
          disabled={!selected || loading}
          className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all shadow-sm shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving…' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
