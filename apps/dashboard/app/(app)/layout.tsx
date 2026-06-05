'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import UpgradeModal from '@/components/UpgradeModal';
import CrispChat from '@/components/CrispChat';
import { useAuthStore } from '@/store/auth';
import { WorkspaceProvider } from '@/contexts/WorkspaceContext';

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
    <WorkspaceProvider>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F8F5FE' }}>
        <Sidebar />
        <main style={{ flex: 1, marginLeft: 220, padding: '36px 56px', minHeight: '100vh', background: '#F8F5FE', borderLeft: '1px solid rgba(138,43,226,0.08)' }}>
          {children}
        </main>
        <UpgradeModal />
        <CrispChat />
      </div>
    </WorkspaceProvider>
  );
}

