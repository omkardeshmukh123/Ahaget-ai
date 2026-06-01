'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';

function SsoCompleteInner() {
  const router = useRouter();

  useEffect(() => {
    // Token arrives via hash fragment (#token=...) so it never appears in server logs
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('token', token);
      router.replace('/dashboard');
    } else {
      router.replace('/login?error=sso_no_token');
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900">
      <p className="text-slate-400 text-sm">Completing sign-in…</p>
    </div>
  );
}

export default function SsoCompletePage() {
  return (
    <Suspense>
      <SsoCompleteInner />
    </Suspense>
  );
}
