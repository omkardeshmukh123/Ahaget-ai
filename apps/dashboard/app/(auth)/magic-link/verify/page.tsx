'use client';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

function MagicLinkVerifyInner() {
  const router = useRouter();
  const params = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [status, setStatus] = useState<'verifying' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your magic link…');

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setStatus('error');
      setMessage('No token provided. Please request a new magic link.');
      return;
    }

    api.auth.verifyMagicLink(token)
      .then((res) => {
        setAuth(res.token, res.user, res.organization);
        const org = res.organization as any;
        if (!org.onboardingComplete) {
          const step = org.onboardingStep ?? 'workspace';
          router.replace(`/getting-started/${step === 'done' ? 'workspace' : step}`);
        } else {
          router.replace('/dashboard');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('This link has expired or is invalid. Please request a new one.');
      });
  }, [params, router, setAuth]);

  return (
    <div className="text-center">
      {status === 'verifying' ? (
        <>
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-indigo-600 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Signing you in…</h2>
          <p className="text-slate-500 text-sm">{message}</p>
        </>
      ) : (
        <>
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Link expired</h2>
          <p className="text-slate-500 text-sm mb-6">{message}</p>
          <a href="/login" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            ← Back to sign in
          </a>
        </>
      )}
    </div>
  );
}

export default function MagicLinkVerifyPage() {
  return (
    <Suspense fallback={
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-5">
          <svg className="w-7 h-7 text-indigo-600 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
        </div>
        <p className="text-slate-500 text-sm">Verifying your magic link…</p>
      </div>
    }>
      <MagicLinkVerifyInner />
    </Suspense>
  );
}

