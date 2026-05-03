'use client';
import { useState, useEffect, useRef } from 'react';
import { api, KnowledgeArticle } from '@/lib/api';

type Tab = 'url' | 'file' | 'manual';
type SyncStatus = 'idle' | 'syncing' | 'error';

const SOURCE_ICONS: Record<string, string> = {
  url: '🔗', file: '📄', manual: '✏️', sitemap: '🗺️',
};

const SYNC_BADGE: Record<SyncStatus, { label: string; color: string }> = {
  idle:    { label: 'Synced',   color: '#10b981' },
  syncing: { label: 'Syncing…', color: '#f59e0b' },
  error:   { label: 'Error',    color: '#ef4444' },
};

function SyncBadge({ status }: { status: SyncStatus }) {
  const { label, color } = SYNC_BADGE[status] ?? SYNC_BADGE.idle;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
      background: `${color}18`, color,
    }}>{label}</span>
  );
}

function WordCount({ n }: { n: number }) {
  if (n === 0) return null;
  return <span style={{ fontSize: 10, color: 'var(--muted)' }}>{n.toLocaleString()} words</span>;
}

const S = {
  input: {
    width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13,
    background: 'var(--surface-low)', border: '1px solid rgba(70,69,84,0.2)',
    color: 'var(--on-surface)', outline: 'none', boxSizing: 'border-box' as const,
  },
  textarea: {
    width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13, minHeight: 180,
    background: 'var(--surface-low)', border: '1px solid rgba(70,69,84,0.2)',
    color: 'var(--on-surface)', outline: 'none', boxSizing: 'border-box' as const,
    resize: 'vertical' as const, fontFamily: 'inherit', lineHeight: 1.6,
  },
  label: { fontSize: 11, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 5 },
  btn: (primary?: boolean) => ({
    padding: primary ? '9px 20px' : '8px 14px',
    borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
    background: primary ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'var(--surface-low)',
    color: primary ? '#fff' : 'var(--muted)',
    border: primary ? 'none' : '1px solid rgba(70,69,84,0.2)',
    transition: 'opacity 0.15s',
  }),
};

export default function KnowledgePage() {
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('url');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [preview, setPreview] = useState<(KnowledgeArticle & { content?: string }) | null>(null);
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  // Form state
  const [url, setUrl] = useState('');
  const [urlScope, setUrlScope] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [manualContent, setManualContent] = useState('');
  const [manualScope, setManualScope] = useState('');
  const [fileScope, setFileScope] = useState('');
  const [fileTitle, setFileTitle] = useState('');

  // Edit state
  const [editScope, setEditScope] = useState('');
  const [editTags, setEditTags] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const { articles: a } = await api.kb.list();
      setArticles(a);
    } finally { setLoading(false); }
  }

  function toast_(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3200);
  }

  async function handleIngestUrl(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setSubmitting(true);
    try {
      const { article } = await api.kb.ingestUrl({ url: url.trim(), pageUrlPattern: urlScope.trim() || undefined });
      setArticles(prev => [article, ...prev]);
      setUrl(''); setUrlScope('');
      toast_('✅ Crawl started — content will appear shortly');
      // poll for sync completion
      pollSync(article.id);
    } catch (err: unknown) {
      toast_(`❌ ${err instanceof Error ? err.message : 'Failed to add URL'}`);
    } finally { setSubmitting(false); }
  }

  async function handleIngestFile(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      if (fileTitle.trim()) fd.append('title', fileTitle.trim());
      if (fileScope.trim()) fd.append('pageUrlPattern', fileScope.trim());
      const { article } = await api.kb.ingestFile(fd);
      setArticles(prev => [article, ...prev]);
      setFileTitle(''); setFileScope('');
      if (fileRef.current) fileRef.current.value = '';
      toast_('✅ File ingested and embedded');
    } catch (err: unknown) {
      toast_(`❌ ${err instanceof Error ? err.message : 'File upload failed'}`);
    } finally { setSubmitting(false); }
  }

  async function handleManual(e: React.FormEvent) {
    e.preventDefault();
    if (!manualTitle.trim() || !manualContent.trim()) return;
    setSubmitting(true);
    try {
      const { article } = await api.kb.create({
        title: manualTitle.trim(), content: manualContent.trim(),
        pageUrlPattern: manualScope.trim() || undefined,
      });
      setArticles(prev => [article, ...prev]);
      setManualTitle(''); setManualContent(''); setManualScope('');
      toast_('✅ Article created and embedded');
    } catch (err: unknown) {
      toast_(`❌ ${err instanceof Error ? err.message : 'Failed'}`);
    } finally { setSubmitting(false); }
  }

  async function handleSync(id: string) {
    setSyncing(prev => ({ ...prev, [id]: true }));
    try {
      await api.kb.sync(id);
      setArticles(prev => prev.map(a => a.id === id ? { ...a, syncStatus: 'syncing' } : a));
      pollSync(id);
      toast_('🔄 Re-sync started');
    } catch (err: unknown) {
      toast_(`❌ ${err instanceof Error ? err.message : 'Sync failed'}`);
      setSyncing(prev => ({ ...prev, [id]: false }));
    }
  }

  function pollSync(id: string, attempts = 0) {
    if (attempts > 24) { setSyncing(prev => ({ ...prev, [id]: false })); return; }
    setTimeout(async () => {
      try {
        const { article } = await api.kb.get(id);
        setArticles(prev => prev.map(a => a.id === id ? { ...article, content: undefined } : a));
        if (article.syncStatus === 'syncing') pollSync(id, attempts + 1);
        else setSyncing(prev => ({ ...prev, [id]: false }));
      } catch { setSyncing(prev => ({ ...prev, [id]: false })); }
    }, 3000);
  }

  async function handleSaveEdit() {
    if (!editId) return;
    setSubmitting(true);
    try {
      const { article } = await api.kb.update(editId, {
        pageUrlPattern: editScope.trim() || undefined,
        tags: editTags.split(',').map(t => t.trim()).filter(Boolean),
      });
      setArticles(prev => prev.map(a => a.id === editId ? { ...a, ...article } : a));
      setEditId(null);
      toast_('✅ Saved');
    } catch { toast_('❌ Save failed'); }
    finally { setSubmitting(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this source from the knowledge base?')) return;
    try {
      await api.kb.delete(id);
      setArticles(prev => prev.filter(a => a.id !== id));
      if (editId === id) setEditId(null);
      toast_('Source removed');
    } catch { toast_('❌ Delete failed'); }
  }

  async function openPreview(id: string) {
    try {
      const { article } = await api.kb.get(id);
      setPreview(article);
    } catch { toast_('Failed to load preview'); }
  }

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: 'url',    label: 'Add URL',      icon: '🔗' },
    { key: 'file',   label: 'Upload File',  icon: '📄' },
    { key: 'manual', label: 'Write Article', icon: '✏️' },
  ];

  return (
    <div style={{ padding: '28px 32px', maxWidth: 900 }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          background: 'var(--surface)', border: '1px solid rgba(70,69,84,0.2)',
          borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 600,
          color: 'var(--on-surface)', boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }}>{toast}</div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--on-surface)', margin: '0 0 6px' }}>Knowledge Base</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
          Connect docs, FAQs, and guides — your AI employee references these in real time, scoped to the page the user is on.
        </p>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Sources', value: articles.length },
          { label: 'Words indexed', value: articles.reduce((s, a) => s + (a.wordCount ?? 0), 0).toLocaleString() },
          { label: 'URL sources', value: articles.filter(a => a.sourceType === 'url').length },
          { label: 'File sources', value: articles.filter(a => a.sourceType === 'file').length },
          { label: 'Errors', value: articles.filter(a => a.syncStatus === 'error').length, warn: true },
        ].map(stat => (
          <div key={stat.label} style={{
            flex: 1, background: 'var(--surface)', border: `1px solid ${stat.warn && Number(stat.value) > 0 ? '#ef444430' : 'rgba(70,69,84,0.1)'}`,
            borderRadius: 10, padding: '12px 16px',
          }}>
            <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: stat.warn && Number(stat.value) > 0 ? '#ef4444' : 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{stat.label}</p>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: stat.warn && Number(stat.value) > 0 ? '#ef4444' : 'var(--on-surface)' }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Add source — tabbed */}
      <div style={{ background: 'var(--surface)', border: '1px solid rgba(70,69,84,0.12)', borderRadius: 12, marginBottom: 28 }}>
        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(70,69,84,0.1)', padding: '0 20px' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '13px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: 'none', border: 'none', borderBottom: `2px solid ${tab === t.key ? '#6366f1' : 'transparent'}`,
              color: tab === t.key ? '#6366f1' : 'var(--muted)', marginBottom: -1,
            }}>{t.icon} {t.label}</button>
          ))}
        </div>

        <div style={{ padding: '20px 24px' }}>
          {/* URL tab */}
          {tab === 'url' && (
            <form onSubmit={handleIngestUrl} style={{ display: 'grid', gap: 14 }}>
              <p style={{ margin: '0 0 4px', fontSize: 13, color: 'var(--muted)' }}>
                Paste any public URL — docs page, help article, FAQ. Ahaget will crawl and index it automatically.
              </p>
              <div>
                <label style={S.label}>URL *</label>
                <input style={S.input} value={url} onChange={e => setUrl(e.target.value)}
                  placeholder="https://docs.yourapp.com/getting-started" />
              </div>
              <div>
                <label style={S.label}>Page scope <span style={{ fontWeight: 400 }}>(optional — show only on matching pages)</span></label>
                <input style={S.input} value={urlScope} onChange={e => setUrlScope(e.target.value)}
                  placeholder="/reports — only surfaces when user is on a /reports page" />
              </div>
              <button type="submit" disabled={submitting || !url.trim()} style={{ ...S.btn(true), width: 'fit-content', opacity: submitting || !url.trim() ? 0.5 : 1 }}>
                {submitting ? 'Crawling…' : 'Crawl & Index'}
              </button>
            </form>
          )}

          {/* File tab */}
          {tab === 'file' && (
            <form onSubmit={handleIngestFile} style={{ display: 'grid', gap: 14 }}>
              <p style={{ margin: '0 0 4px', fontSize: 13, color: 'var(--muted)' }}>
                Upload a <strong>.txt</strong>, <strong>.md</strong>, or <strong>.csv</strong> file (max 5 MB).
                Internal playbooks, SOPs, release notes — anything plain text.
              </p>
              <div>
                <label style={S.label}>File *</label>
                <input ref={fileRef} type="file" accept=".txt,.md,.mdx,.csv"
                  style={{ ...S.input, padding: '7px 12px' }} />
              </div>
              <div>
                <label style={S.label}>Title <span style={{ fontWeight: 400 }}>(defaults to filename)</span></label>
                <input style={S.input} value={fileTitle} onChange={e => setFileTitle(e.target.value)} placeholder="e.g. Billing FAQ" />
              </div>
              <div>
                <label style={S.label}>Page scope <span style={{ fontWeight: 400 }}>(optional)</span></label>
                <input style={S.input} value={fileScope} onChange={e => setFileScope(e.target.value)} placeholder="/billing" />
              </div>
              <button type="submit" disabled={submitting} style={{ ...S.btn(true), width: 'fit-content', opacity: submitting ? 0.5 : 1 }}>
                {submitting ? 'Uploading…' : 'Upload & Embed'}
              </button>
            </form>
          )}

          {/* Manual tab */}
          {tab === 'manual' && (
            <form onSubmit={handleManual} style={{ display: 'grid', gap: 14 }}>
              <div>
                <label style={S.label}>Title *</label>
                <input style={S.input} value={manualTitle} onChange={e => setManualTitle(e.target.value)} placeholder="e.g. How to connect your CRM" />
              </div>
              <div>
                <label style={S.label}>Content * <span style={{ fontWeight: 400 }}>(markdown supported)</span></label>
                <textarea style={S.textarea} value={manualContent} onChange={e => setManualContent(e.target.value)}
                  placeholder="## How to connect your CRM&#10;&#10;1. Go to Settings → Integrations&#10;2. Click **Connect CRM**&#10;..." />
              </div>
              <div>
                <label style={S.label}>Page scope <span style={{ fontWeight: 400 }}>(optional)</span></label>
                <input style={S.input} value={manualScope} onChange={e => setManualScope(e.target.value)} placeholder="/integrations" />
              </div>
              <button type="submit" disabled={submitting || !manualTitle.trim() || !manualContent.trim()}
                style={{ ...S.btn(true), width: 'fit-content', opacity: submitting || !manualTitle.trim() || !manualContent.trim() ? 0.5 : 1 }}>
                {submitting ? 'Saving…' : 'Create & Embed'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Sources list */}
      <div style={{ background: 'var(--surface)', border: '1px solid rgba(70,69,84,0.12)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(70,69,84,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--on-surface)' }}>Indexed Sources</p>
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>{articles.length} total</span>
        </div>

        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Loading…</div>
        ) : articles.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📚</div>
            <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 600, color: 'var(--on-surface)' }}>No sources yet</p>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>Add a URL, upload a file, or write an article above</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(70,69,84,0.08)' }}>
                {['Source', 'Type', 'Page scope', 'Words', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {articles.map(a => (
                <tr key={a.id} style={{ borderBottom: '1px solid rgba(70,69,84,0.05)' }}>
                  <td style={{ padding: '12px 16px', maxWidth: 260 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--on-surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {SOURCE_ICONS[a.sourceType] ?? '◈'} {a.title}
                    </p>
                    {a.sourceUrl && (
                      <p style={{ margin: '2px 0 0', fontSize: 10, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {a.sourceUrl}
                      </p>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', background: 'var(--surface-low)', padding: '2px 7px', borderRadius: 6 }}>
                      {a.sourceType}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--muted)' }}>
                    {a.pageUrlPattern
                      ? <code style={{ fontSize: 11, background: 'rgba(99,102,241,0.1)', color: '#6366f1', padding: '2px 6px', borderRadius: 5 }}>{a.pageUrlPattern}</code>
                      : <span style={{ opacity: 0.4 }}>All pages</span>}
                  </td>
                  <td style={{ padding: '12px 16px' }}><WordCount n={a.wordCount} /></td>
                  <td style={{ padding: '12px 16px' }}>
                    <SyncBadge status={syncing[a.id] ? 'syncing' : a.syncStatus} />
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button onClick={() => openPreview(a.id)} style={{ fontSize: 11, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '3px 8px' }}>Preview</button>
                      {a.sourceType === 'url' && (
                        <button onClick={() => handleSync(a.id)} disabled={syncing[a.id] || a.syncStatus === 'syncing'}
                          style={{ fontSize: 11, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: '3px 8px', opacity: syncing[a.id] ? 0.5 : 1 }}>
                          Sync
                        </button>
                      )}
                      <button onClick={() => { setEditId(a.id); setEditScope(a.pageUrlPattern ?? ''); setEditTags(a.tags.join(', ')); }}
                        style={{ fontSize: 11, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '3px 8px' }}>Edit</button>
                      <button onClick={() => handleDelete(a.id)}
                        style={{ fontSize: 11, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '3px 8px' }}>Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit modal */}
      {editId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => e.target === e.currentTarget && setEditId(null)}>
          <div style={{ background: 'var(--surface)', borderRadius: 14, padding: 28, width: 440, border: '1px solid rgba(70,69,84,0.15)' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: 'var(--on-surface)' }}>Edit Source</h2>
            <div style={{ display: 'grid', gap: 14 }}>
              <div>
                <label style={S.label}>Page scope <span style={{ fontWeight: 400 }}>(leave blank = all pages)</span></label>
                <input style={S.input} value={editScope} onChange={e => setEditScope(e.target.value)} placeholder="/billing, /settings, etc." />
                <p style={{ margin: '5px 0 0', fontSize: 11, color: 'var(--muted)' }}>
                  The AI will only show this content when the user is on a page whose URL contains this pattern.
                </p>
              </div>
              <div>
                <label style={S.label}>Tags <span style={{ fontWeight: 400 }}>(comma-separated)</span></label>
                <input style={S.input} value={editTags} onChange={e => setEditTags(e.target.value)} placeholder="billing, payments, stripe" />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleSaveEdit} disabled={submitting} style={{ ...S.btn(true), flex: 1, opacity: submitting ? 0.5 : 1 }}>
                  {submitting ? 'Saving…' : 'Save'}
                </button>
                <button onClick={() => setEditId(null)} style={{ ...S.btn(), padding: '9px 16px' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview modal */}
      {preview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => e.target === e.currentTarget && setPreview(null)}>
          <div style={{ background: 'var(--surface)', borderRadius: 14, padding: 28, width: 600, maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid rgba(70,69,84,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--on-surface)' }}>{preview.title}</h2>
              <button onClick={() => setPreview(null)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--muted)' }}>✕</button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <SyncBadge status={preview.syncStatus} />
              <WordCount n={preview.wordCount} />
              {preview.pageUrlPattern && <code style={{ fontSize: 11, background: 'rgba(99,102,241,0.1)', color: '#6366f1', padding: '2px 6px', borderRadius: 5 }}>{preview.pageUrlPattern}</code>}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', background: 'var(--surface-low)', borderRadius: 8, padding: '14px 16px' }}>
              <pre style={{ margin: 0, fontSize: 12, lineHeight: 1.7, color: 'var(--on-surface)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit' }}>
                {preview.content ?? '(content not loaded)'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
