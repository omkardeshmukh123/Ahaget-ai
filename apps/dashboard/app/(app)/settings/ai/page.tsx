'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, KnowledgeArticle, McpConnector } from '@/lib/api';

const S = {
  card: { background: 'var(--surface-container)', border: '1px solid rgba(139,92,246,0.1)', borderRadius: 12, padding: '20px 24px', marginBottom: 16 } as React.CSSProperties,
  label: { fontSize: 10, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' as const },
  sub: { fontSize: 12, color: 'var(--muted)', marginTop: 4, marginBottom: 16, lineHeight: 1.6 } as React.CSSProperties,
  row: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', border: '1px solid rgba(139,92,246,0.1)', borderRadius: 8, marginBottom: 8 } as React.CSSProperties,
};

import React from 'react';

export default function AIConfigPage() {
  const [instructions, setInstructions] = useState('');
  const [original, setOriginal] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [connectors, setConnectors] = useState<McpConnector[]>([]);

  useEffect(() => {
    Promise.allSettled([api.config.get(), api.kb.list(), api.mcp.list()])
      .then(([cfg, kb, mcp]) => {
        if (cfg.status === 'fulfilled') {
          const val = cfg.value.customInstructions ?? '';
          setInstructions(val);
          setOriginal(val);
        }
        if (kb.status === 'fulfilled') setArticles(kb.value.articles);
        if (mcp.status === 'fulfilled') setConnectors(mcp.value.connectors);
      })
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      await api.config.updateAI(instructions);
      setOriginal(instructions);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  const isDirty = instructions !== original;

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--on-surface)', letterSpacing: '-0.03em' }}>Configure agent</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
          Set context, connect your knowledge, and write instructions to control how the AI behaves.
        </p>
      </div>

      {/* Context */}
      <div style={S.card}>
        <p style={S.label}>Context</p>
        <p style={S.sub}>The AI always knows the page your user is on via the widget. No setup required.</p>
        <div style={{ ...S.row, background: 'var(--surface-low)' }}>
          <span style={{ fontSize: 18 }}>📍</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface)' }}>Current page</p>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>URL, page title, and user metadata passed automatically from the widget</p>
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--success)', background: 'rgba(74,222,128,0.1)', padding: '2px 10px', borderRadius: 999 }}>Auto</span>
        </div>
      </div>

      {/* Knowledge & Tools */}
      <div style={S.card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <p style={S.label}>Knowledge &amp; Tools</p>
        </div>
        <p style={S.sub}>Articles and integrations the AI can reference in conversations.</p>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...Array(2)].map((_, i) => <div key={i} style={{ height: 44, borderRadius: 8, background: 'var(--surface-low)', animation: 'pulse 1.5s infinite' }} />)}
          </div>
        ) : (
          <div>
            {articles.slice(0, 3).map((a) => (
              <div key={a.id} style={S.row}>
                <span style={{ fontSize: 16 }}>📄</span>
                <span style={{ fontSize: 13, color: 'var(--on-surface)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</span>
                {a.tags.slice(0, 2).map((t) => (
                  <span key={t} style={{ fontSize: 10, fontWeight: 600, color: 'var(--primary-bright)', background: 'rgba(139,92,246,0.12)', padding: '2px 7px', borderRadius: 999 }}>{t}</span>
                ))}
              </div>
            ))}
            {articles.length > 3 && <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>+{articles.length - 3} more articles</p>}
            {articles.length === 0 && (
              <div style={{ fontSize: 12, color: 'var(--muted)', border: '1px dashed rgba(139,92,246,0.15)', borderRadius: 8, padding: '14px', textAlign: 'center', marginBottom: 8 }}>
                No knowledge articles yet
              </div>
            )}
            {connectors.slice(0, 2).map((c) => (
              <div key={c.id} style={S.row}>
                <span style={{ fontSize: 16 }}>🔌</span>
                <span style={{ fontSize: 13, color: 'var(--on-surface)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: c.enabled ? 'var(--success)' : 'var(--muted)', background: c.enabled ? 'rgba(74,222,128,0.1)' : 'rgba(71,85,105,0.1)', padding: '2px 10px', borderRadius: 999 }}>
                  {c.enabled ? 'Connected' : 'Disabled'}
                </span>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 14, marginTop: 12 }}>
              <Link href="/knowledge" style={{ fontSize: 12, fontWeight: 500, color: 'var(--primary-bright)' }}>Manage knowledge base →</Link>
              <Link href="/mcp" style={{ fontSize: 12, fontWeight: 500, color: 'var(--primary-bright)' }}>Manage integrations →</Link>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div style={S.card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <p style={S.label}>Instructions</p>
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>{instructions.length} / 2000</span>
        </div>
        <p style={S.sub}>Tell the AI how to behave — your product&apos;s tone, what to avoid, and any special handling.</p>
        {loading ? (
          <div style={{ height: 160, borderRadius: 8, background: 'var(--surface-low)', animation: 'pulse 1.5s infinite' }} />
        ) : (
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={8}
            maxLength={2000}
            placeholder={`Examples:\n- Our product is a project management tool for remote teams\n- Users often get confused at the "invite teammates" step\n- Always encourage users to invite at least 2 teammates before proceeding\n- Tone: friendly and encouraging, never pushy`}
            style={{ width: '100%', background: 'var(--surface-low)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 8, padding: '12px 14px', fontSize: 12, color: 'var(--on-surface)', fontFamily: 'monospace', lineHeight: 1.6, resize: 'vertical', boxSizing: 'border-box' }}
          />
        )}

        {/* Base prompt preview */}
        <div style={{ marginTop: 12, background: 'var(--surface-low)', border: '1px solid rgba(139,92,246,0.1)', borderRadius: 8, padding: '12px 14px', fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace', lineHeight: 1.6 }}>
          <span style={{ color: 'var(--on-surface-variant)' }}>Base prompt (always included):</span><br />
          You are an AI assistant embedded inside &quot;[Your Product]&quot;.<br />
          Help users who are stuck or have questions. Be concise and action-oriented.<br />
          <span style={{ color: 'var(--primary-bright)' }}>+ your instructions above</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
          <button
            onClick={save}
            disabled={saving || !isDirty}
            style={{ background: 'linear-gradient(135deg,#8B5CF6,#22D3EE)', color: '#fff', padding: '9px 20px', borderRadius: 8, fontWeight: 600, fontSize: 13, border: 'none', cursor: (saving || !isDirty) ? 'not-allowed' : 'pointer', opacity: (saving || !isDirty) ? 0.5 : 1 }}
          >
            {saving ? 'Saving…' : 'Save instructions'}
          </button>
          {isDirty && (
            <button onClick={() => setInstructions(original)} style={{ fontSize: 13, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
              Discard
            </button>
          )}
          {saved && <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)' }}>✓ Saved</span>}
        </div>
      </div>

      {/* Model info */}
      <div style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 20 }}>🤖</span>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface)' }}>Claude Sonnet 4.6</p>
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Model powering your AI assistant</p>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--success)', background: 'rgba(74,222,128,0.1)', padding: '2px 10px', borderRadius: 999 }}>Active</span>
      </div>
    </div>
  );
}
