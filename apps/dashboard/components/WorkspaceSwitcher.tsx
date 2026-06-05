'use client';
import { useState } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { apiFetch } from '@/lib/api';

export default function WorkspaceSwitcher() {
  const { workspaces, activeId, setActiveId, reload } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [err, setErr] = useState('');

  if (workspaces.length === 0) return null;
  const active = workspaces.find(w => w.id === activeId) ?? workspaces[0];

  async function create() {
    if (!newName.trim()) return;
    setErr('');
    try {
      await apiFetch('/api/v1/workspaces', { method: 'POST', body: JSON.stringify({ name: newName.trim() }) });
      setNewName(''); setCreating(false); reload();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to create');
    }
  }

  if (workspaces.length <= 1 && !creating) {
    return (
      <div style={{ padding: '4px 10px 8px', fontSize: 11, color: '#9B8AB0' }}>
        <span style={{ fontWeight: 600, color: '#5B4B7A' }}>{active?.name}</span>
      </div>
    );
  }

  return (
    <div style={{ padding: '4px 10px 8px', position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', textAlign: 'left', background: 'rgba(138,43,226,0.05)',
          border: '1px solid rgba(138,43,226,0.15)', borderRadius: 6,
          padding: '5px 8px', fontSize: 11, color: '#5B4B7A', fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
        }}
      >
        <span>{active?.name ?? 'Select workspace'}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', left: 10, right: 10, top: '100%', zIndex: 50,
          background: '#fff', border: '1px solid rgba(138,43,226,0.15)', borderRadius: 8,
          boxShadow: '0 4px 20px rgba(138,43,226,0.12)', padding: 6,
        }}>
          {workspaces.map(w => (
            <button key={w.id} onClick={() => { setActiveId(w.id); setOpen(false); }} style={{
              width: '100%', textAlign: 'left', background: w.id === activeId ? 'rgba(138,43,226,0.08)' : 'transparent',
              border: 'none', borderRadius: 5, padding: '5px 8px', fontSize: 11,
              color: w.id === activeId ? '#8A2BE2' : '#5B4B7A', fontWeight: w.id === activeId ? 700 : 500,
              cursor: 'pointer', display: 'block',
            }}>
              {w.name}{w.isDefault ? ' (default)' : ''}
            </button>
          ))}

          {creating ? (
            <div style={{ padding: '6px 4px 2px' }}>
              <input
                autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && create()}
                placeholder="Workspace name" style={{
                  width: '100%', border: '1px solid rgba(138,43,226,0.2)', borderRadius: 5,
                  padding: '4px 7px', fontSize: 11, outline: 'none',
                }} />
              {err && <p style={{ fontSize: 10, color: '#e53e3e', margin: '3px 0 0' }}>{err}</p>}
              <div style={{ display: 'flex', gap: 4, marginTop: 5 }}>
                <button onClick={create} style={{ flex: 1, background: '#8A2BE2', color: '#fff', border: 'none', borderRadius: 5, padding: '4px 0', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Create</button>
                <button onClick={() => { setCreating(false); setNewName(''); setErr(''); }} style={{ flex: 1, background: 'transparent', border: '1px solid rgba(138,43,226,0.2)', borderRadius: 5, padding: '4px 0', fontSize: 10, cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => { setCreating(true); setOpen(false); }} style={{
              width: '100%', textAlign: 'left', background: 'transparent', border: 'none',
              borderRadius: 5, padding: '5px 8px', fontSize: 10, color: '#8A2BE2',
              fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <span>+</span> New workspace
            </button>
          )}
        </div>
      )}
    </div>
  );
}
