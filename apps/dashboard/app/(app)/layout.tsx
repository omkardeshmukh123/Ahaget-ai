'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { useAuthStore } from '@/store/auth';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { token, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!localStorage.getItem('oai_token')) {
      router.push('/login');
    }
  }, [token, router]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8F5FE' }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: 220, padding: '36px 40px', minHeight: '100vh', background: '#F8F5FE' }}>
        {children}
      </main>
    </div>
  );
}
