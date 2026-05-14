'use client';
import { useState, useEffect, useCallback } from 'react';
import { api, McpConnector, McpCallLog, RestApiEndpoint, ContextSource } from '@/lib/api';

// ─── Small helpers ────────────────────────────────────────────────────────────
const s = (obj: React.CSSProperties): React.CSSProperties => obj;
const inp = s({ width:'100%', padding:'8px 12px', background:'var(--surface)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:8, color:'var(--on-surface)', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'inherit' });
const btn = (variant: 'primary'|'ghost'|'danger' = 'primary'): React.CSSProperties => ({
  padding:'9px 18px', borderRadius:9, fontSize:13, fontWeight:700, cursor:'pointer', border:'none',
  ...(variant==='primary' ? { background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff' }
    : variant==='ghost'   ? { background:'rgba(99,102,241,0.08)', color:'var(--muted)', border:'1px solid rgba(99,102,241,0.18)' }
    : { background:'rgba(239,68,68,0.1)', color:'#ef4444', border:'1px solid rgba(239,68,68,0.2)' }),
});
function Label({ t }: { t: string }) {
  return <p style={{ fontSize:10, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:5 }}>{t}</p>;
}
function Toast({ msg }: { msg: string }) {
  if (!msg) return null;
  return <div style={{ position:'fixed', bottom:24, right:24, background:'#1e1b4b', color:'#fff', padding:'10px 18px', borderRadius:10, fontSize:13, zIndex:300, boxShadow:'0 8px 24px rgba(0,0,0,0.3)' }}>{msg}</div>;
}

// ─── Tool list preview ────────────────────────────────────────────────────────
function ToolPreview({ connectorId, allowedTools, onToggle }: { connectorId: string; allowedTools: string[]; onToggle:(tool:string,allowed:boolean)=>void }) {
  const [tools, setTools] = useState<Array<{name:string;description:string}>>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const test = useCallback(async () => {
    setLoading(true); setErr('');
    try {
      const r = await api.mcp.test(connectorId);
      if (r.ok) setTools(r.tools); else setErr(r.error ?? 'Connection failed');
    } catch(e) { setErr((e as Error).message); }
    finally { setLoading(false); }
  }, [connectorId]);

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
        <Label t="Live Tool List" />
        <button onClick={test} disabled={loading} style={{ ...btn('ghost'), padding:'5px 12px', fontSize:11 }}>
          {loading ? 'Connecting…' : 'Test Connection'}
        </button>
      </div>
      {err && <p style={{ fontSize:12, color:'#ef4444', marginBottom:8 }}>{err}</p>}
      {tools.length > 0 ? (
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {tools.map(t => {
            const allowed = allowedTools.length===0 || allowedTools.includes(t.name);
            return (
              <div key={t.name} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', background:'var(--surface)', borderRadius:8, border:'1px solid rgba(99,102,241,0.1)' }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:allowed?'#10b981':'rgba(107,114,128,0.3)', flexShrink:0 }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:12, fontWeight:600, color:'var(--on-surface)' }}>{t.name}</p>
                  {t.description && <p style={{ fontSize:11, color:'var(--muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.description}</p>}
                </div>
                <button onClick={() => onToggle(t.name, !allowed)} style={{ fontSize:11, color: allowed?'#6366f1':'var(--muted)', cursor:'pointer', background:'none', border:'none' }}>
                  {allowed ? 'Block' : 'Allow'}
                </button>
              </div>
            );
          })}
        </div>
      ) : !loading && <p style={{ fontSize:12, color:'var(--muted)', textAlign:'center', padding:'16px 0' }}>Click "Test Connection" to preview available tools.</p>}
    </div>
  );
}

// ─── REST Endpoints manager ───────────────────────────────────────────────────
function EndpointManager({ connectorId }: { connectorId: string }) {
  const [endpoints, setEndpoints] = useState<RestApiEndpoint[]>([]);
  const [form, setForm] = useState({ method:'GET', urlPattern:'', description:'' });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    api.mcp.listEndpoints(connectorId).then(r => setEndpoints(r.endpoints)).catch(()=>{});
  }, [connectorId]);

  const add = async () => {
    if (!form.urlPattern) return;
    setAdding(true);
    try {
      const r = await api.mcp.addEndpoint(connectorId, form);
      setEndpoints(p => [...p, r.endpoint]);
      setForm({ method:'GET', urlPattern:'', description:'' });
    } catch(e) { alert((e as Error).message); }
    finally { setAdding(false); }
  };

  const remove = async (id: string) => {
    await api.mcp.deleteEndpoint(connectorId, id);
    setEndpoints(p => p.filter(e => e.id !== id));
  };

  return (
    <div>
      <Label t="Allowed REST Endpoints" />
      <div style={{ display:'flex', gap:6, marginBottom:8 }}>
        <select value={form.method} onChange={e=>setForm({...form,method:e.target.value})} style={{ ...inp, width:90 }}>
          {['GET','POST','PUT','PATCH','DELETE'].map(m=><option key={m}>{m}</option>)}
        </select>
        <input value={form.urlPattern} onChange={e=>setForm({...form,urlPattern:e.target.value})} placeholder="https://api.example.com/v1/" style={{ ...inp, flex:1 }} />
        <button onClick={add} disabled={adding||!form.urlPattern} style={btn('primary')}>Add</button>
      </div>
      {endpoints.map(ep => (
        <div key={ep.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 10px', background:'var(--surface)', borderRadius:7, marginBottom:4, border:'1px solid rgba(99,102,241,0.1)' }}>
          <span style={{ fontSize:10, fontWeight:700, color:'#6366f1', background:'rgba(99,102,241,0.1)', padding:'2px 6px', borderRadius:4 }}>{ep.method}</span>
          <span style={{ fontSize:11, fontFamily:'monospace', color:'var(--on-surface)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ep.urlPattern}</span>
          <button onClick={()=>remove(ep.id)} style={{ background:'none', border:'none', color:'var(--muted)', cursor:'pointer', fontSize:12 }}>✕</button>
        </div>
      ))}
      {endpoints.length===0 && <p style={{ fontSize:12, color:'var(--muted)' }}>No approved endpoints yet. The agent will be unable to call any REST URLs.</p>}
    </div>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────
function DetailPanel({ connector, onClose, onSave }: { connector: McpConnector; onClose:()=>void; onSave:(c:McpConnector)=>void }) {
  const [form, setForm] = useState({ name:connector.name, description:connector.description, serverUrl:connector.serverUrl, authType:connector.authType as 'none'|'bearer'|'api_key', authValue:'', readOnly:connector.readOnly, connectorType:connector.connectorType });
  const [allowedTools, setAllowedTools] = useState<string[]>(connector.allowedTools);
  const [saving, setSaving] = useState(false);

  const toggleTool = (tool: string, allow: boolean) => {
    setAllowedTools(prev => allow ? prev.filter(t=>t!==tool) : [...prev, tool].filter((v,i,a)=>a.indexOf(v)===i));
  };

  const save = async () => {
    setSaving(true);
    try {
      const r = await api.mcp.update(connector.id, { ...form, allowedTools, authValue: form.authValue || undefined });
      onSave(r.connector);
      onClose();
    } catch(e) { alert((e as Error).message); }
    finally { setSaving(false); }
  };

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:199 }} />
      <div style={{ position:'fixed', top:0, right:0, width:420, height:'100vh', background:'var(--surface-low)', borderLeft:'1px solid rgba(99,102,241,0.2)', zIndex:200, display:'flex', flexDirection:'column', boxShadow:'-12px 0 40px rgba(0,0,0,0.3)' }}>
        {/* Header */}
        <div style={{ padding:'18px 20px', borderBottom:'1px solid rgba(99,102,241,0.12)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <p style={{ fontWeight:700, fontSize:15, color:'var(--on-surface)' }}>Configure Connector</p>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--muted)', fontSize:20, cursor:'pointer' }}>✕</button>
        </div>
        {/* Body */}
        <div style={{ flex:1, overflowY:'auto', padding:20, display:'flex', flexDirection:'column', gap:16 }}>
          <div><Label t="Name" /><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} style={inp} /></div>
          <div><Label t="Description" /><input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="What does this connector do?" style={inp} /></div>
          <div>
            <Label t="Type" />
            <select value={form.connectorType} onChange={e=>setForm({...form,connectorType:e.target.value as 'mcp'|'rest'})} style={inp}>
              <option value="mcp">MCP Server (JSON-RPC)</option>
              <option value="rest">REST API (direct HTTP)</option>
            </select>
          </div>
          <div><Label t={form.connectorType==='mcp'?'MCP Server URL':'REST Base URL'} /><input value={form.serverUrl} onChange={e=>setForm({...form,serverUrl:e.target.value})} style={inp} /></div>
          <div>
            <Label t="Auth" />
            <select value={form.authType} onChange={e=>setForm({...form,authType:e.target.value as 'none'|'bearer'|'api_key'})} style={{ ...inp, marginBottom:6 }}>
              <option value="none">None</option>
              <option value="bearer">Bearer Token</option>
              <option value="api_key">API Key</option>
            </select>
            {form.authType!=='none' && <input type="password" value={form.authValue} onChange={e=>setForm({...form,authValue:e.target.value})} placeholder="Leave blank to keep existing" style={inp} />}
          </div>
          <label style={{ display:'flex', alignItems:'center', gap:10, fontSize:13, color:'var(--muted)', cursor:'pointer' }}>
            <input type="checkbox" checked={form.readOnly} onChange={e=>setForm({...form,readOnly:e.target.checked})} />
            Read-only — block any write-verb tool calls (create, update, delete…)
          </label>

          <div style={{ borderTop:'1px solid rgba(99,102,241,0.1)', paddingTop:16 }}>
            {form.connectorType==='mcp'
              ? <ToolPreview connectorId={connector.id} allowedTools={allowedTools} onToggle={toggleTool} />
              : <EndpointManager connectorId={connector.id} />
            }
          </div>
        </div>
        {/* Footer */}
        <div style={{ padding:'16px 20px', borderTop:'1px solid rgba(99,102,241,0.12)', display:'flex', gap:10 }}>
          <button onClick={save} disabled={saving} style={{ ...btn('primary'), flex:1, opacity:saving?0.6:1 }}>{saving?'Saving…':'Save Changes'}</button>
          <button onClick={onClose} style={btn('ghost')}>Cancel</button>
        </div>
      </div>
    </>
  );
}

// ─── Connector Card ───────────────────────────────────────────────────────────
function ConnectorCard({ c, onEdit, onToggle, onDelete }: { c:McpConnector; onEdit:()=>void; onToggle:()=>void; onDelete:()=>void }) {
  const typeColor = c.connectorType==='rest' ? '#f59e0b' : '#6366f1';
  return (
    <div style={{ background:'var(--surface-low)', border:'1px solid rgba(99,102,241,0.12)', borderRadius:14, padding:20, display:'flex', flexDirection:'column', gap:12, transition:'box-shadow 0.15s' }}
      onMouseEnter={e=>(e.currentTarget.style.boxShadow='0 4px 20px rgba(99,102,241,0.12)')}
      onMouseLeave={e=>(e.currentTarget.style.boxShadow='none')}
    >
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
            <span style={{ fontSize:10, fontWeight:700, color:typeColor, background:`${typeColor}18`, border:`1px solid ${typeColor}30`, padding:'2px 7px', borderRadius:5, textTransform:'uppercase', letterSpacing:'0.06em' }}>{c.connectorType}</span>
            {c.readOnly && <span style={{ fontSize:10, color:'#f59e0b', background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.25)', padding:'2px 7px', borderRadius:5 }}>Read-only</span>}
          </div>
          <p style={{ fontWeight:700, fontSize:14, color:'var(--on-surface)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name}</p>
          {c.description && <p style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>{c.description}</p>}
        </div>
        <button onClick={onToggle} style={{
          padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:700, cursor:'pointer', border:'none',
          background: c.enabled ? 'rgba(16,185,129,0.12)' : 'rgba(107,114,128,0.1)',
          color: c.enabled ? '#10b981' : 'var(--muted)',
        }}>{c.enabled ? '● Active' : '○ Disabled'}</button>
      </div>

      <p style={{ fontSize:11, fontFamily:'monospace', color:'var(--muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', background:'rgba(99,102,241,0.05)', padding:'5px 8px', borderRadius:6 }}>{c.serverUrl}</p>

      {c.allowedTools.length > 0 && (
        <p style={{ fontSize:11, color:'var(--muted)' }}>
          <span style={{ color:'#6366f1', fontWeight:700 }}>{c.allowedTools.length}</span> allowed tools
        </p>
      )}

      <div style={{ display:'flex', gap:8, marginTop:'auto' }}>
        <button onClick={onEdit} style={{ ...btn('ghost'), flex:1, padding:'7px' }}>Configure</button>
        <button onClick={onDelete} style={{ ...btn('danger'), padding:'7px 14px' }}>Remove</button>
      </div>
    </div>
  );
}

// ─── Create Modal ─────────────────────────────────────────────────────────────
function CreateModal({ onClose, onCreate }: { onClose:()=>void; onCreate:(c:McpConnector)=>void }) {
  const [form, setForm] = useState({ name:'', description:'', connectorType:'mcp' as 'mcp'|'rest', serverUrl:'', authType:'none' as 'none'|'bearer'|'api_key', authValue:'' });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const r = await api.mcp.create({ ...form, enabled:true });
      onCreate(r.connector); onClose();
    } catch(err) { alert((err as Error).message); }
    finally { setSaving(false); }
  };

  const overlay: React.CSSProperties = { position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:20 };
  const modal: React.CSSProperties  = { background:'var(--surface-low)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:16, width:'100%', maxWidth:460, boxShadow:'0 20px 60px rgba(0,0,0,0.4)' };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e=>e.stopPropagation()}>
        <div style={{ padding:'20px 24px', borderBottom:'1px solid rgba(99,102,241,0.1)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <p style={{ fontWeight:800, fontSize:16, color:'var(--on-surface)' }}>New Connector</p>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--muted)', fontSize:20, cursor:'pointer' }}>✕</button>
        </div>
        <form onSubmit={submit} style={{ padding:24, display:'flex', flexDirection:'column', gap:14 }}>
          <div><Label t="Name" /><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Production DB" style={inp} /></div>
          <div><Label t="Description" /><input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="What does this connector do?" style={inp} /></div>
          <div>
            <Label t="Type" />
            <select value={form.connectorType} onChange={e=>setForm({...form,connectorType:e.target.value as 'mcp'|'rest'})} style={inp}>
              <option value="mcp">MCP Server (JSON-RPC)</option>
              <option value="rest">REST API (direct HTTP)</option>
            </select>
          </div>
          <div><Label t={form.connectorType==='mcp'?'MCP Server URL':'REST Base URL'} /><input required value={form.serverUrl} onChange={e=>setForm({...form,serverUrl:e.target.value})} placeholder="https://mcp.yourapp.com" style={inp} /></div>
          <div>
            <Label t="Auth" />
            <select value={form.authType} onChange={e=>setForm({...form,authType:e.target.value as 'none'|'bearer'|'api_key'})} style={{ ...inp, marginBottom:6 }}>
              <option value="none">None</option>
              <option value="bearer">Bearer Token</option>
              <option value="api_key">API Key</option>
            </select>
            {form.authType!=='none' && <input type="password" value={form.authValue} onChange={e=>setForm({...form,authValue:e.target.value})} placeholder={form.authType==='bearer'?'Bearer token':'API key'} style={inp} />}
          </div>
          <button type="submit" disabled={saving||!form.name||!form.serverUrl} style={{ ...btn('primary'), width:'100%', padding:12, opacity:(saving||!form.name||!form.serverUrl)?0.5:1 }}>
            {saving ? 'Creating…' : 'Create Connector'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Context Sources Section ──────────────────────────────────────────────────
function ContextSourcesSection({ connectors }: { connectors: McpConnector[] }) {
  const [sources, setSources]     = useState<ContextSource[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showAdd, setShowAdd]     = useState(false);
  const [testResult, setTestResult] = useState<{ id: string; raw: unknown; filtered: unknown; error?: string } | null>(null);
  const [testing, setTesting]     = useState<string | null>(null);
  const [toast, setToast]         = useState('');

  const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    api.contextSources.list().then(r => setSources(r.sources)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleToggle = async (s: ContextSource) => {
    try {
      const r = await api.contextSources.update(s.id, { enabled: !s.enabled });
      setSources(p => p.map(x => x.id === s.id ? r.source : x));
    } catch { notify('Failed to update source.'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this context source?')) return;
    await api.contextSources.delete(id);
    setSources(p => p.filter(x => x.id !== id));
    notify('Deleted.');
  };

  const handleTest = async (id: string) => {
    setTesting(id);
    try {
      const r = await api.contextSources.test(id);
      setTestResult({ id, ...r });
    } catch (e) { setTestResult({ id, raw: null, filtered: null, error: (e as Error).message }); }
    finally { setTesting(null); }
  };

  return (
    <div style={{ marginTop: 48 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--on-surface)', margin: 0 }}>Context Sources</h2>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, maxWidth: 500 }}>
            Data fetched automatically at session start and injected into the agent's system prompt — account status, feature flags, usage metrics.
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} style={{ ...btn('primary'), display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Add Source
        </button>
      </div>

      {loading ? (
        <p style={{ fontSize: 12, color: 'var(--muted)' }}>Loading…</p>
      ) : sources.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--surface-low)', border: '1px dashed rgba(99,102,241,0.2)', borderRadius: 14, color: 'var(--muted)' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📡</div>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 4 }}>No context sources yet</p>
          <p style={{ fontSize: 12 }}>Add a source to give the agent live account data before every session.</p>
          <button onClick={() => setShowAdd(true)} style={{ ...btn('primary'), marginTop: 14 }}>+ Add Source</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sources.map(s => (
            <div key={s.id} style={{ background: 'var(--surface-low)', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: s.mcpToolName ? '#6366f1' : '#f59e0b', background: s.mcpToolName ? 'rgba(99,102,241,0.1)' : 'rgba(245,158,11,0.1)', border: `1px solid ${s.mcpToolName ? 'rgba(99,102,241,0.25)' : 'rgba(245,158,11,0.25)'}`, padding: '2px 7px', borderRadius: 5, textTransform: 'uppercase' as const }}>
                  {s.mcpToolName ? 'MCP' : 'REST'}
                </span>
                <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--on-surface)', flex: 1, margin: 0 }}>{s.name}</p>
                <span style={{ fontSize: 11, color: 'var(--muted)', background: 'rgba(99,102,241,0.06)', padding: '2px 8px', borderRadius: 4, fontFamily: 'monospace' }}>{s.contextKey}</span>
                <button onClick={() => handleToggle(s)} style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none', background: s.enabled ? 'rgba(16,185,129,0.12)' : 'rgba(107,114,128,0.1)', color: s.enabled ? '#10b981' : 'var(--muted)' }}>
                  {s.enabled ? '● Active' : '○ Off'}
                </button>
                <button onClick={() => handleTest(s.id)} disabled={testing === s.id} style={{ ...btn('ghost'), padding: '5px 12px', fontSize: 11, opacity: testing === s.id ? 0.5 : 1 }}>
                  {testing === s.id ? 'Testing…' : 'Test'}
                </button>
                <button onClick={() => handleDelete(s.id)} style={{ ...btn('danger'), padding: '5px 10px', fontSize: 11 }}>✕</button>
              </div>
              {s.description && <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6, marginBottom: 0 }}>{s.description}</p>}
              {s.mcpToolName && <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, marginBottom: 0, fontFamily: 'monospace' }}>tool: {s.mcpToolName}{s.allowedFields.length > 0 ? ` · fields: ${s.allowedFields.join(', ')}` : ''}</p>}
              {s.restUrl && <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, marginBottom: 0, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.restMethod} {s.restUrl}{s.allowedFields.length > 0 ? ` · fields: ${s.allowedFields.join(', ')}` : ''}</p>}

              {/* Test result inline */}
              {testResult?.id === s.id && (
                <div style={{ marginTop: 10, padding: '10px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 8, fontSize: 11 }}>
                  {testResult.error ? (
                    <p style={{ color: '#ef4444', margin: 0 }}>Error: {testResult.error}</p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 4 }}>Raw response</p>
                        <pre style={{ margin: 0, color: '#a5b4fc', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{JSON.stringify(testResult.raw, null, 2)}</pre>
                      </div>
                      <div>
                        <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 4 }}>Filtered (what agent sees)</p>
                        <pre style={{ margin: 0, color: '#6ee7b7', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{JSON.stringify(testResult.filtered, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                  <button onClick={() => setTestResult(null)} style={{ marginTop: 8, background: 'none', border: 'none', color: 'var(--muted)', fontSize: 11, cursor: 'pointer' }}>Dismiss</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <AddSourceModal
          connectors={connectors}
          onClose={() => setShowAdd(false)}
          onCreate={s => { setSources(p => [...p, s]); notify('Context source added!'); }}
        />
      )}

      {toast && <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#1e1b4b', color: '#fff', padding: '10px 18px', borderRadius: 10, fontSize: 13, zIndex: 400 }}>{toast}</div>}
    </div>
  );
}

// ─── Add Source Modal ─────────────────────────────────────────────────────────
function AddSourceModal({ connectors, onClose, onCreate }: { connectors: McpConnector[]; onClose: () => void; onCreate: (s: ContextSource) => void }) {
  const mcpConnectors = connectors.filter(c => c.connectorType === 'mcp' && c.enabled);
  const [form, setForm] = useState({
    name: '', description: '', contextKey: '', sourceType: 'rest' as 'mcp' | 'rest',
    connectorId: '', mcpToolName: '', mcpToolArgs: '{}',
    restUrl: '', restMethod: 'GET', allowedFields: '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setErr('');
    try {
      let mcpToolArgs: Record<string, unknown> = {};
      try { mcpToolArgs = JSON.parse(form.mcpToolArgs || '{}'); } catch { setErr('Tool args must be valid JSON'); setSaving(false); return; }

      const r = await api.contextSources.create({
        name: form.name,
        description: form.description,
        contextKey: form.contextKey,
        connectorId: form.connectorId || null,
        mcpToolName: form.sourceType === 'mcp' ? form.mcpToolName || null : null,
        mcpToolArgs: form.sourceType === 'mcp' ? mcpToolArgs : {},
        restUrl: form.sourceType === 'rest' ? form.restUrl || null : null,
        restMethod: form.restMethod,
        allowedFields: form.allowedFields ? form.allowedFields.split(',').map(f => f.trim()).filter(Boolean) : [],
      });
      onCreate(r.source);
      onClose();
    } catch (e) { setErr((e as Error).message); }
    finally { setSaving(false); }
  };

  const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 };
  const modal: React.CSSProperties  = { background: 'var(--surface-low)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 16, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(99,102,241,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontWeight: 800, fontSize: 15, color: 'var(--on-surface)', margin: 0 }}>New Context Source</p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <form onSubmit={submit} style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><Label t="Name" /><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Account Status" style={inp} /></div>
          <div><Label t="Context Key (label in agent prompt)" /><input required value={form.contextKey} onChange={e => setForm({ ...form, contextKey: e.target.value })} placeholder="Account Status" style={inp} /></div>
          <div><Label t="Description (optional)" /><input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What does this source provide?" style={inp} /></div>

          <div>
            <Label t="Source Type" />
            <div style={{ display: 'flex', gap: 8 }}>
              {(['mcp', 'rest'] as const).map(t => (
                <button key={t} type="button" onClick={() => setForm({ ...form, sourceType: t })}
                  style={{ flex: 1, padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: `2px solid ${form.sourceType === t ? '#6366f1' : 'rgba(99,102,241,0.15)'}`, background: form.sourceType === t ? 'rgba(99,102,241,0.12)' : 'var(--surface)', color: form.sourceType === t ? '#6366f1' : 'var(--muted)' }}>
                  {t === 'mcp' ? 'MCP Tool' : 'REST Endpoint'}
                </button>
              ))}
            </div>
          </div>

          {form.sourceType === 'mcp' ? (
            <>
              <div>
                <Label t="MCP Connector" />
                <select value={form.connectorId} onChange={e => setForm({ ...form, connectorId: e.target.value })} style={inp}>
                  <option value="">— select connector —</option>
                  {mcpConnectors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div><Label t="Tool Name" /><input required={form.sourceType === 'mcp'} value={form.mcpToolName} onChange={e => setForm({ ...form, mcpToolName: e.target.value })} placeholder="get_account_status" style={inp} /></div>
              <div><Label t='Tool Args (JSON, use {"{{"userId"}}"}  for interpolation)' /><input value={form.mcpToolArgs} onChange={e => setForm({ ...form, mcpToolArgs: e.target.value })} placeholder='{"userId": "{{userId}}"}' style={inp} /></div>
            </>
          ) : (
            <>
              <div>
                <Label t="Connector (for auth headers, optional)" />
                <select value={form.connectorId} onChange={e => setForm({ ...form, connectorId: e.target.value })} style={inp}>
                  <option value="">— none —</option>
                  {connectors.filter(c => c.enabled).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ width: 90 }}>
                  <Label t="Method" />
                  <select value={form.restMethod} onChange={e => setForm({ ...form, restMethod: e.target.value })} style={inp}>
                    {['GET', 'POST'].map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <Label t='URL (use {"{{"userId"}}"}  etc.)' />
                  <input required={form.sourceType === 'rest'} value={form.restUrl} onChange={e => setForm({ ...form, restUrl: e.target.value })} placeholder="https://api.example.com/users/{{userId}}/account" style={inp} />
                </div>
              </div>
            </>
          )}

          <div>
            <Label t="Allowed Fields (comma-separated, empty = all)" />
            <input value={form.allowedFields} onChange={e => setForm({ ...form, allowedFields: e.target.value })} placeholder="plan, status, seats_used" style={inp} />
          </div>

          {err && <p style={{ fontSize: 12, color: '#ef4444', margin: 0 }}>{err}</p>}

          <button type="submit" disabled={saving || !form.name || !form.contextKey} style={{ ...btn('primary'), width: '100%', padding: 12, opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Adding…' : 'Add Context Source'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Recent Activity ──────────────────────────────────────────────────────────
function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  if (diffSecs < 60) return `${diffSecs}s ago`;
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${Math.floor(diffHrs / 24)}d ago`;
}

function formatLatency(ms: number | null): string {
  if (ms === null) return '—';
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

function RecentActivity() {
  const [calls, setCalls]     = useState<McpCallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState('');

  const fetchCalls = useCallback(async () => {
    try {
      const r = await api.mcp.listCalls({ limit: 20 });
      setCalls(r.calls);
      setErr('');
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCalls();
    const pollInterval = setInterval(fetchCalls, 30_000);
    return () => { clearInterval(pollInterval); };
  }, [fetchCalls]);

  const thStyle = s({ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', padding: '0 12px 10px', textAlign: 'left' as const, whiteSpace: 'nowrap' as const });
  const tdStyle = s({ fontSize: 12, color: 'var(--on-surface)', padding: '10px 12px', borderBottom: '1px solid rgba(99,102,241,0.07)', whiteSpace: 'nowrap' as const });
  const tdMuted = s({ ...tdStyle, color: 'var(--muted)' });

  return (
    <div style={{ marginTop: 48 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--on-surface)', margin: 0 }}>Recent Activity</h2>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
            Live log of MCP and REST calls made by the agent. Auto-refreshes every 30 seconds.
          </p>
        </div>
        <button
          onClick={() => { setLoading(true); fetchCalls(); }}
          style={{ ...btn('ghost'), padding: '7px 14px', fontSize: 12 }}
        >
          Refresh
        </button>
      </div>

      <div style={{ background: 'var(--surface-low)', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 14, overflow: 'hidden' }}>
        {loading ? (
          <p style={{ fontSize: 12, color: 'var(--muted)', padding: '28px 20px', textAlign: 'center' }}>Loading…</p>
        ) : err ? (
          <p style={{ fontSize: 12, color: '#ef4444', padding: '28px 20px', textAlign: 'center' }}>
            Could not load activity log: {err}
          </p>
        ) : calls.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--muted)', padding: '36px 20px', textAlign: 'center', lineHeight: 1.6 }}>
            No API calls recorded yet. Calls will appear here as the agent runs.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
                  <th style={thStyle}>Time</th>
                  <th style={thStyle}>Connector</th>
                  <th style={thStyle}>Tool</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Latency</th>
                </tr>
              </thead>
              <tbody>
                {calls.map(call => (
                  <tr key={call.id} style={{ background: 'transparent' }}>
                    <td style={tdMuted}>{relativeTime(call.createdAt)}</td>
                    <td style={tdStyle}>{call.connectorName}</td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 11 }}>{call.toolName}</td>
                    <td style={tdStyle}>
                      <span style={{
                        fontSize: 10, fontWeight: 700,
                        color: call.callType === 'mcp' ? '#6366f1' : '#f59e0b',
                        background: call.callType === 'mcp' ? 'rgba(99,102,241,0.1)' : 'rgba(245,158,11,0.1)',
                        border: `1px solid ${call.callType === 'mcp' ? 'rgba(99,102,241,0.25)' : 'rgba(245,158,11,0.25)'}`,
                        padding: '2px 7px', borderRadius: 5, textTransform: 'uppercase' as const,
                      }}>
                        {call.callType}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 600, color: call.isError ? '#ef4444' : '#10b981' }}>
                        {call.isError ? '✗ Error' : '✓ OK'}
                      </span>
                    </td>
                    <td style={tdMuted}>{formatLatency(call.latencyMs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function McpPage() {
  const [connectors, setConnectors] = useState<McpConnector[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing]       = useState<McpConnector | null>(null);
  const [toast, setToast]           = useState('');

  const notify = (msg: string) => { setToast(msg); setTimeout(()=>setToast(''), 3000); };

  useEffect(() => {
    api.mcp.list().then(r => setConnectors(r.connectors)).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  const handleToggle = async (c: McpConnector) => {
    try {
      const r = await api.mcp.update(c.id, { enabled: !c.enabled });
      setConnectors(p => p.map(x => x.id===c.id ? r.connector : x));
    } catch { notify('Failed to update connector.'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this connector? The agent will lose access to its tools.')) return;
    try {
      await api.mcp.delete(id);
      setConnectors(p => p.filter(x => x.id!==id));
      notify('Connector removed.');
    } catch { notify('Failed to remove connector.'); }
  };

  return (
    <div style={{ maxWidth:1100, margin:'0 auto' }}>
      <Toast msg={toast} />

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'var(--on-surface)', letterSpacing:'-0.03em', marginBottom:4 }}>MCPs & APIs</h1>
          <p style={{ fontSize:13, color:'var(--muted)', maxWidth:520 }}>Connect MCP servers and REST APIs so the agent can fetch live data, create records, and trigger workflows. Define exactly what it can access.</p>
        </div>
        <button onClick={()=>setShowCreate(true)} style={{ ...btn('primary'), display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:18, lineHeight:1 }}>+</span> New Connector
        </button>
      </div>

      {/* How-to callout */}
      <div style={{ background:'rgba(99,102,241,0.06)', border:'1px solid rgba(99,102,241,0.15)', borderRadius:12, padding:'14px 18px', marginBottom:24, display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:12 }}>
        {[
          { icon:'🔌', title:'MCP Servers', desc:'JSON-RPC tools the agent can call (databases, internal services)' },
          { icon:'🌐', title:'REST APIs',   desc:'Pre-approve HTTP endpoints for call_api to reach' },
          { icon:'🔒', title:'Permissions', desc:'Whitelist tools and set read-only mode per connector' },
          { icon:'👤', title:'User Context',desc:'Pass plan/role/segment via script tag — agent personalizes responses' },
        ].map(({icon,title,desc}) => (
          <div key={title}>
            <p style={{ fontSize:13, fontWeight:700, color:'var(--on-surface)', marginBottom:2 }}>{icon} {title}</p>
            <p style={{ fontSize:11, color:'var(--muted)', lineHeight:1.5 }}>{desc}</p>
          </div>
        ))}
      </div>

      {/* Script-tag snippet */}
      <details style={{ marginBottom:24 }}>
        <summary style={{ fontSize:12, fontWeight:700, color:'#6366f1', cursor:'pointer', marginBottom:8 }}>▸ Pass user context via script tag (no extra JS needed)</summary>
        <pre style={{ background:'rgba(0,0,0,0.3)', borderRadius:10, padding:14, fontSize:11, color:'#a5b4fc', overflowX:'auto', border:'1px solid rgba(99,102,241,0.2)' }}>{`<script
  src="https://widget.ahaget.ai/widget.js"
  data-ahaget-key="ak_live_..."
  data-ahaget-user-id="{{ user.id }}"
  data-ahaget-plan="{{ user.plan }}"
  data-ahaget-role="{{ user.role }}"
  data-ahaget-segment="{{ user.segment }}"
></script>`}</pre>
      </details>

      {/* Cards */}
      {loading ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:'var(--muted)' }}>
          <div style={{ width:32, height:32, border:'3px solid rgba(99,102,241,0.2)', borderTopColor:'#6366f1', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }} />
          Loading connectors…
        </div>
      ) : connectors.length===0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px', background:'var(--surface-low)', border:'1px dashed rgba(99,102,241,0.2)', borderRadius:16, color:'var(--muted)' }}>
          <div style={{ fontSize:36, marginBottom:12 }}>🔌</div>
          <p style={{ fontSize:14, fontWeight:700, color:'var(--on-surface)', marginBottom:6 }}>No connectors yet</p>
          <p style={{ fontSize:13 }}>Create your first MCP server or REST API connector to give the agent backend access.</p>
          <button onClick={()=>setShowCreate(true)} style={{ ...btn('primary'), marginTop:18 }}>+ Create Connector</button>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
          {connectors.map(c => (
            <ConnectorCard key={c.id} c={c}
              onEdit={()=>setEditing(c)}
              onToggle={()=>handleToggle(c)}
              onDelete={()=>handleDelete(c.id)}
            />
          ))}
        </div>
      )}

      {showCreate && <CreateModal onClose={()=>setShowCreate(false)} onCreate={c=>{ setConnectors(p=>[c,...p]); notify('Connector created!'); }} />}
      {editing    && <DetailPanel connector={editing} onClose={()=>setEditing(null)} onSave={c=>{ setConnectors(p=>p.map(x=>x.id===c.id?c:x)); notify('Saved!'); }} />}

      <ContextSourcesSection connectors={connectors} />

      <RecentActivity />

      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}
