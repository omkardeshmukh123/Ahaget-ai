'use client';
import Link from 'next/link';

export default function InPageAssistantPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">In-Page Assistant</h1>
        <p className="text-slate-500 text-sm">
          Configure the AI assistant that appears inside your application to guide users.
        </p>
      </div>

      {/* Empty state */}
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'linear-gradient(135deg, rgba(138,43,226,0.10), rgba(160,80,240,0.15))' }}>
          <svg className="w-8 h-8" style={{ color: '#8A2BE2' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Open the Ahaget Editor in your app</h2>
        <p className="text-slate-500 text-sm leading-relaxed mb-7 max-w-sm mx-auto">
          To create your first AI agent, open your app with the Ahaget widget installed and click the Ahaget badge to launch the editor.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            id="btn-open-ahaget-editor"
            style={{ background: 'linear-gradient(135deg, #8A2BE2, #A050F0)', boxShadow: '0 2px 12px rgba(138,43,226,0.3)' }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-white text-sm font-semibold rounded-xl transition-opacity hover:opacity-90"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open in your app
          </button>
          <a
            href="/getting-started/snippet"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
          >
            View install guide →
          </a>
        </div>

        {/* Checklist */}
        <div className="mt-10 pt-8 border-t border-slate-100 text-left space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Getting started</p>
          {[
            { done: true,  label: 'Create your account' },
            { done: false, label: 'Install the Ahaget snippet on your site' },
            { done: false, label: 'Open your app and launch the Ahaget editor' },
            { done: false, label: 'Configure your first AI flow' },
          ].map(({ done, label }) => (
            <div key={label} className="flex items-center gap-3">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: done ? 'linear-gradient(135deg, #8A2BE2, #A050F0)' : 'rgba(138,43,226,0.08)', border: done ? 'none' : '1px solid rgba(138,43,226,0.18)' }}
              >
                {done && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className={`text-sm ${done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
