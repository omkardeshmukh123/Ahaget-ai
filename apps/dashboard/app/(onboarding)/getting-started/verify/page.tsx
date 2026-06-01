'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

const POLL_INTERVAL_MS = 3000;
const TIMEOUT_MS = 5 * 60 * 1000;

export default function VerifyPage() {
  const router = useRouter();
  const [detected, setDetected] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [completing, setCompleting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    pollRef.current = setInterval(async () => {
      try {
        const { detected: found } = await api.analytics.hasFirstSession();
        if (found) {
          setDetected(true);
          if (pollRef.current) clearInterval(pollRef.current);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
        }
      } catch {
        // ignore transient errors
      }
    }, POLL_INTERVAL_MS);

    timeoutRef.current = setTimeout(() => {
      if (pollRef.current) clearInterval(pollRef.current);
      setTimedOut(true);
    }, TIMEOUT_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const goToDashboard = async () => {
    setCompleting(true);
    try {
      await api.onboarding.complete();
    } catch {}
    router.push('/dashboard');
  };

  if (detected) {
    return (
      <div>
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-6 shadow-lg shadow-emerald-200">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">Widget detected!</h1>
        <p className="text-slate-500 text-[15px] leading-relaxed mb-8">
          Ahaget received its first session. Your widget is live and working correctly.
        </p>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-800">First session received</p>
              <p className="text-xs text-emerald-600 mt-0.5">Your widget is installed and responding to users.</p>
            </div>
          </div>
        </div>

        <button
          id="btn-verify-go-to-dashboard"
          type="button"
          onClick={goToDashboard}
          disabled={completing}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all shadow-sm shadow-indigo-200 disabled:opacity-50"
        >
          {completing ? 'Loading…' : 'Go to Dashboard →'}
        </button>
      </div>
    );
  }

  if (timedOut) {
    return (
      <div>
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-6 shadow-lg shadow-amber-200">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">No session yet</h1>
        <p className="text-slate-500 text-[15px] leading-relaxed mb-7">
          We haven&apos;t received a session in the last 5 minutes. Check the troubleshooting steps below.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-7 space-y-3">
          <p className="text-sm font-semibold text-amber-800 mb-1">Troubleshooting checklist</p>
          {[
            'The snippet is placed before the closing </body> tag on every page',
            'You visited your website in the browser after saving the change',
            'Your website is publicly accessible (not localhost)',
            'No browser extensions are blocking third-party scripts',
            'The domain in your Ahaget settings matches where the snippet is installed',
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded border-2 border-amber-300 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-800 leading-relaxed">{item}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <button
            id="btn-verify-retry"
            type="button"
            onClick={() => {
              setTimedOut(false);
              pollRef.current = setInterval(async () => {
                try {
                  const { detected: found } = await api.analytics.hasFirstSession();
                  if (found) {
                    setDetected(true);
                    if (pollRef.current) clearInterval(pollRef.current);
                  }
                } catch {}
              }, POLL_INTERVAL_MS);
              timeoutRef.current = setTimeout(() => {
                if (pollRef.current) clearInterval(pollRef.current);
                setTimedOut(true);
              }, TIMEOUT_MS);
            }}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all shadow-sm shadow-indigo-200"
          >
            Try again
          </button>
          <button
            id="btn-verify-skip"
            type="button"
            onClick={goToDashboard}
            disabled={completing}
            className="w-full py-2.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            Skip for now — I&apos;ll fix it later
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mb-6 shadow-lg shadow-indigo-200">
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-slate-900 mb-2">Waiting for first session</h1>
      <p className="text-slate-500 text-[15px] leading-relaxed mb-8">
        Visit your website in a new tab to trigger the first session. We&apos;ll detect it automatically.
      </p>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <div className="w-4 h-4 rounded-full bg-indigo-400 animate-pulse" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">Listening for sessions…</p>
            <p className="text-xs text-slate-500 mt-0.5">Checking every 3 seconds</p>
          </div>
          <div className="ml-auto">
            <svg className="w-5 h-5 text-slate-300 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        </div>
      </div>

      <button
        id="btn-verify-skip-early"
        type="button"
        onClick={goToDashboard}
        disabled={completing}
        className="w-full py-2.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        Skip for now — I&apos;ll verify later
      </button>
    </div>
  );
}
