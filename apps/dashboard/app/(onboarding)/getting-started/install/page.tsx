'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

type Method = 'script' | 'extension';

export default function InstallPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Method>('script');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    setLoading(true);
    try {
      await api.onboarding.updateWizard({ step: 'snippet' });
    } catch {
      // non-critical
    } finally {
      setLoading(false);
      router.push('/getting-started/snippet');
    }
  };

  const handleBack = () => router.push('/getting-started/description');

  const OPTIONS = [
    {
      value: 'script' as Method,
      title: 'Script tag',
      description: 'Paste a small JS snippet before </body>. Works with any website or framework — React, Vue, plain HTML.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      badge: 'Recommended',
    },
    {
      value: 'extension' as Method,
      title: 'Chrome Extension',
      description: 'Install our Chrome extension to test Prism on any website without touching code.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
        </svg>
      ),
      badge: 'Coming soon',
    },
  ];

  return (
    <div>
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center mb-6 shadow-lg shadow-orange-200">
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-slate-900 mb-2">How would you like to install Prism?</h1>
      <p className="text-slate-500 text-[15px] leading-relaxed mb-8">
        Choose the installation method that works best for your team.
      </p>

      <div className="space-y-4 mb-8">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            id={`option-install-${opt.value}`}
            type="button"
            onClick={() => opt.value === 'script' && setSelected(opt.value)}
            disabled={opt.value === 'extension'}
            className={`w-full flex items-start gap-4 px-5 py-4 rounded-xl border-2 text-left transition-all disabled:cursor-not-allowed ${
              selected === opt.value
                ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                : opt.value === 'extension'
                ? 'border-slate-100 bg-slate-50 opacity-60'
                : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/40'
            }`}
          >
            <div className={`mt-0.5 flex-shrink-0 ${selected === opt.value ? 'text-indigo-600' : 'text-slate-400'}`}>
              {opt.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-sm font-semibold ${selected === opt.value ? 'text-indigo-800' : 'text-slate-800'}`}>
                  {opt.title}
                </span>
                {opt.badge && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    opt.badge === 'Recommended'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {opt.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{opt.description}</p>
            </div>
            {selected === opt.value && (
              <div className="mt-0.5 w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
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
          id="btn-install-back"
          type="button"
          onClick={handleBack}
          className="px-5 py-3.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          ← Back
        </button>
        <button
          id="btn-install-continue"
          type="button"
          onClick={handleContinue}
          disabled={loading}
          className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all shadow-sm shadow-indigo-200 disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
