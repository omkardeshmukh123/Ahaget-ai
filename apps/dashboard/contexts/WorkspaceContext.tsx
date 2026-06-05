'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiFetch } from '@/lib/api';

interface Workspace { id: string; name: string; isDefault: boolean; createdAt: string; _count?: { onboardingFlows: number }; }

interface WorkspaceCtx {
  workspaces: Workspace[];
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  reload: () => void;
}

const Ctx = createContext<WorkspaceCtx>({ workspaces: [], activeId: null, setActiveId: () => {}, reload: () => {} });

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeId, setActiveIdState] = useState<string | null>(null);

  function load() {
    apiFetch<{ workspaces: Workspace[] }>('/api/v1/workspaces')
      .then(({ workspaces: ws }) => {
        setWorkspaces(ws);
        const stored = typeof window !== 'undefined' ? localStorage.getItem('ahaget_workspace_id') : null;
        const valid = stored && ws.find(w => w.id === stored);
        if (!valid) {
          const def = ws.find(w => w.isDefault);
          setActiveIdState(def?.id ?? ws[0]?.id ?? null);
        } else {
          setActiveIdState(stored);
        }
      })
      .catch(() => {});
  }

  useEffect(() => { load(); }, []);

  function setActiveId(id: string | null) {
    setActiveIdState(id);
    if (id) localStorage.setItem('ahaget_workspace_id', id);
    else localStorage.removeItem('ahaget_workspace_id');
  }

  return <Ctx.Provider value={{ workspaces, activeId, setActiveId, reload: load }}>{children}</Ctx.Provider>;
}

export function useWorkspace() { return useContext(Ctx); }
export function getActiveWorkspaceId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('ahaget_workspace_id');
}
