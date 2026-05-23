'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

export default function SnippetPage() {
  const router = useRouter();
  const org = useAuthStore((s) => s.org);
  const [snippet, setSnippet] = useState('');
  const [domain, setDomain] = useState('');
  const [copied, setCopied] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [polling, setPolling] = useState(true);
  const [completing, setCompleting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch snippet
  useEffect(() => {
    api.onboarding.getSnippet().then((data) => {
      setSnippet(data.snippet ?? '');
      setDomain(data.domain ?? '');
    }).catch(() => {});
  }, []);

  // Poll for installation every 3s
  useEffect(() => {
    if (!polling) return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await api.onboarding.installStatus();
        if (res.installed) {
          setInstalled(true);
          setPolling(false);
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        // silently ignore
      }
    }, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [polling]);

  const copySnippet = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleSkip = async () => {
    setPolling(false);
    setCompleting(true);
    try {
      await api.onboarding.complete();
    } catch {}
    router.push('/dashboard');
  };

  const handleGoToDashboard = async () => {
    setPolling(false);
    setCompleting(true);
    try {
      await api.onboarding.complete();
    } catch {}
    router.push('/dashboard');
  };

  const aiPrompt = `Add the Ahaget widget to my ${domain ? `${domain} ` : ''}web app.
Copy this snippet and paste it before the closing </body> tag in your HTML:

${snippet}

This script loads the Ahaget assistant widget asynchronously and initialises it with the app ID and current user context.`;

  return (
    <div>
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mb-6 shadow-lg shadow-indigo-200">
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-slate-900 mb-2">Add Ahaget to your website</h1>
      <p className="text-slate-500 text-[15px] leading-relaxed mb-7">
        Paste this snippet before the closing <code className="text-indigo-600 font-mono text-sm">&lt;/body&gt;</code> tag on every page of your app.
      </p>

      {/* Code block */}
      <div className="relative mb-4">
        <div className="bg-slate-900 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700/50">
            <span className="text-xs text-slate-400 font-mono">HTML</span>
            <button
              id="btn-copy-snippet"
              type="button"
              onClick={copySnippet}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-lg transition-all ${
                copied
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {copied ? (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy code
                </>
              )}
            </button>
          </div>
          <pre className="px-5 py-4 text-xs font-mono text-slate-300 leading-relaxed overflow-x-auto whitespace-pre-wrap">
            {snippet || 'Loading snippet…'}
          </pre>
        </div>
      </div>

      {/* Copy prompt for AI coding agent */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-7">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-indigo-800 mb-0.5">Using an AI coding agent?</p>
            <p className="text-xs text-indigo-600 leading-relaxed mb-2">Copy this prompt and paste it into Cursor, GitHub Copilot, or Claude.</p>
            <button
              id="btn-copy-ai-prompt"
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(aiPrompt).catch(() => {});
                setCopied(true);
                setTimeout(() => setCopied(false), 2500);
              }}
              className="text-xs font-medium text-indigo-700 hover:text-indigo-800 underline underline-offset-2"
            >
              Copy AI prompt →
            </button>
          </div>
        </div>
      </div>

      {/* Installation status */}
      <div className={`flex items-center gap-3 p-4 rounded-xl mb-6 transition-all ${
        installed
          ? 'bg-emerald-50 border border-emerald-200'
          : 'bg-slate-50 border border-slate-200'
      }`}>
        {installed ? (
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
          </div>
        )}
        <div>
          <p className={`text-sm font-semibold ${installed ? 'text-emerald-800' : 'text-slate-700'}`}>
            {installed
              ? '🎉 Ahaget detected!'
              : `Waiting for installation${domain ? ` on ${domain}` : ''}…`}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {installed
              ? 'Your snippet is live. Click below to open your dashboard.'
              : 'We\'ll detect it automatically once you paste the snippet and visit your site.'}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {installed ? (
          <button
            id="btn-go-to-dashboard"
            type="button"
            onClick={handleGoToDashboard}
            disabled={completing}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all shadow-sm shadow-indigo-200 disabled:opacity-50"
          >
            {completing ? 'Loading…' : 'Continue to Dashboard →'}
          </button>
        ) : (
          <button
            id="btn-skip-install"
            type="button"
            onClick={handleSkip}
            disabled={completing}
            className="w-full py-3 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            Skip for now — I'll install it later
          </button>
        )}
        <button
          type="button"
          onClick={() => router.push('/getting-started/workspace')}
          className="w-full py-2 text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          Install on a different domain
        </button>
      </div>
    </div>
  );
}
