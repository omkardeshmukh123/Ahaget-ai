'use client';
import { useState } from 'react';

/* ─── Mock SaaS conversation messages ──────────────────────────────────────── */
const DEMO_MESSAGES = [
  { role: 'assistant', text: "Welcome to Acme! I'm here to help you get set up. What's the main thing you're trying to accomplish today?" },
  { role: 'user',      text: 'I want to connect my first data source.' },
  { role: 'assistant', text: "Great choice! Connecting a data source takes about 2 minutes. I'll walk you through each step." },
];

const DEMO_STEPS = [
  { label: 'Account', done: true },
  { label: 'Connect', done: false, active: true },
  { label: 'Configure', done: false },
  { label: 'Go live', done: false },
];

const DEMO_PLAN = [
  { n: 1, text: 'Choose your data source type' },
  { n: 2, text: 'Authorize the connection' },
  { n: 3, text: 'Map your fields and test' },
];

/* ─── Typing dots ────────────────────────────────────────────────────────────── */
function TypingDots({ color }: { color: string }) {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '2px 0' }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 5, height: 5, borderRadius: '50%', background: color, display: 'inline-block',
          animation: `widgetBounce 1.2s ease-in-out ${i * 0.18}s infinite`,
        }} />
      ))}
    </div>
  );
}

/* ─── The widget preview (mimics the embeddable Ahaget widget) ──────────────── */
function WidgetPreview({ primaryColor, gradFrom, gradTo, agentName, agentSub }: {
  primaryColor: string; gradFrom: string; gradTo: string;
  agentName: string; agentSub: string;
}) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(DEMO_MESSAGES);
  const [typing, setTyping] = useState(false);

  const send = () => {
    if (!input.trim()) return;
    const txt = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: txt }]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages(prev => [...prev, { role: 'assistant', text: "I'm on it! Let me guide you through the next step right now." }]);
    }, 1400);
  };

  return (
    <div style={{
      width: 320, height: 580, borderRadius: 16,
      background: '#fff',
      boxShadow: '0 8px 48px rgba(0,0,0,0.18), 0 2px 12px rgba(0,0,0,0.08)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      border: '1px solid rgba(0,0,0,0.06)',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(160deg, ${gradFrom} 0%, ${gradTo} 100%)`,
        padding: '14px 14px 12px', flexShrink: 0,
      }}>
        {/* Agent row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,255,255,0.22)',
            border: '2px solid rgba(255,255,255,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, color: '#fff', fontWeight: 700, flexShrink: 0, position: 'relative',
          }}>
            {agentName[0]}
            <span style={{
              position: 'absolute', bottom: -1, right: -1,
              width: 9, height: 9, borderRadius: '50%',
              background: '#22c55e', border: '2px solid white',
            }} />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1.2 }}>{agentName}</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.72)', margin: '2px 0 0' }}>{agentSub}</p>
          </div>
          {/* Close / pop-out icons */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            {['⊡', '✕'].map(icon => (
              <div key={icon} style={{
                width: 22, height: 22, borderRadius: 5,
                background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, color: 'rgba(255,255,255,0.8)', cursor: 'pointer',
              }}>{icon}</div>
            ))}
          </div>
        </div>

        {/* Step progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {DEMO_STEPS.map((step, i) => (
            <div key={step.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, position: 'relative' }}>
              {/* connector line */}
              {i < DEMO_STEPS.length - 1 && (
                <div style={{
                  position: 'absolute', top: 10, left: '50%', width: '100%', height: 2,
                  background: step.done ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)',
                }} />
              )}
              <div style={{
                width: 20, height: 20, borderRadius: '50%', zIndex: 1,
                background: step.done ? 'rgba(255,255,255,0.9)' : step.active ? '#fff' : 'rgba(255,255,255,0.2)',
                border: `2px solid ${step.done || step.active ? '#fff' : 'rgba(255,255,255,0.4)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 700,
                color: step.done || step.active ? primaryColor : '#fff',
                boxShadow: step.active ? '0 0 0 3px rgba(255,255,255,0.3)' : 'none',
              }}>
                {step.done ? '✓' : i + 1}
              </div>
              <span style={{
                fontSize: 8.5, color: step.active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.6)',
                fontWeight: step.active ? 700 : 400, textAlign: 'center',
              }}>{step.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '12px 11px',
        display: 'flex', flexDirection: 'column', gap: 9,
        background: '#f8fafc',
      }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
          }}>
            {m.role === 'assistant' && (
              <div style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginRight: 6,
                background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, color: '#fff', fontWeight: 700, alignSelf: 'flex-end',
              }}>{agentName[0]}</div>
            )}
            <div style={{
              maxWidth: '80%', padding: '8px 10px',
              borderRadius: m.role === 'user' ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
              background: m.role === 'user' ? `linear-gradient(135deg, ${gradFrom}, ${gradTo})` : '#fff',
              color: m.role === 'user' ? '#fff' : '#1e293b',
              fontSize: 11.5, lineHeight: 1.5,
              border: m.role === 'user' ? 'none' : '1px solid #e2e8f0',
              boxShadow: m.role === 'user' ? `0 2px 8px ${gradFrom}44` : '0 1px 3px rgba(0,0,0,0.05)',
            }}>{m.text}</div>
          </div>
        ))}

        {/* Plan card */}
        <div style={{
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
          padding: '10px 11px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: primaryColor, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7 }}>
            Here's the plan:
          </p>
          <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
            {DEMO_PLAN.map(p => (
              <li key={p.n} style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                <span style={{
                  width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                  border: `1.5px solid ${primaryColor}44`, color: primaryColor,
                  fontSize: 8, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{p.n}</span>
                <span style={{ fontSize: 11, color: '#475569', lineHeight: 1.4 }}>{p.text}</span>
              </li>
            ))}
          </ol>
        </div>

        {typing && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%',
              background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, color: '#fff', fontWeight: 700,
            }}>{agentName[0]}</div>
            <div style={{
              background: '#fff', border: '1px solid #e2e8f0',
              borderRadius: '12px 12px 12px 3px', padding: '9px 12px',
            }}>
              <TypingDots color={primaryColor} />
            </div>
          </div>
        )}
      </div>

      {/* CTA button */}
      <div style={{
        padding: '8px 11px 0', background: '#fff', flexShrink: 0,
        borderTop: '1px solid #f1f5f9',
      }}>
        <button style={{
          width: '100%', padding: '9px 14px',
          background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})`,
          color: '#fff', border: 'none', borderRadius: 9,
          fontSize: 13, fontWeight: 700, cursor: 'pointer',
          boxShadow: `0 3px 12px ${gradFrom}44`,
        }}>
          Let&apos;s go →
        </button>
      </div>

      {/* Input */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 7,
        padding: '8px 11px 10px', background: '#fff', flexShrink: 0,
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Type to adjust the plan…"
          style={{
            flex: 1, border: '1.5px solid #e2e8f0', borderRadius: 9,
            padding: '7px 10px', fontSize: 11.5, outline: 'none',
            color: '#1e293b', background: '#f8fafc', fontFamily: 'inherit',
          }}
          onFocus={e => (e.target.style.borderColor = primaryColor)}
          onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
        />
        <button
          onClick={send}
          style={{
            width: 30, height: 30, borderRadius: 8,
            background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})`,
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, opacity: input.trim() ? 1 : 0.4,
          }}
        >
          <svg viewBox="0 0 24 24" width="12" height="12" fill="#fff">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center', fontSize: 9.5, color: '#94a3b8',
        paddingBottom: 7, background: '#fff',
      }}>
        AI employee by <a href="https://ahaget.ai" target="_blank" rel="noopener noreferrer"
          style={{ color: primaryColor, fontWeight: 600, textDecoration: 'none' }}>Ahaget</a>
      </div>
    </div>
  );
}

/* ─── Branding picker ────────────────────────────────────────────────────────── */
const PRESETS = [
  { name: 'Violet',  primary: '#8A2BE2', from: '#8A2BE2', to: '#A050F0' },
  { name: 'Indigo',  primary: '#6366f1', from: '#6366f1', to: '#818cf8' },
  { name: 'Emerald', primary: '#059669', from: '#059669', to: '#10b981' },
  { name: 'Rose',    primary: '#e11d48', from: '#e11d48', to: '#f43f5e' },
  { name: 'Amber',   primary: '#d97706', from: '#d97706', to: '#f59e0b' },
];

/* ─── Page ───────────────────────────────────────────────────────────────────── */
export default function InPageAssistantPage() {
  const [preset, setPreset] = useState(0);
  const [agentName, setAgentName] = useState('Acme Assistant');
  const [agentSub, setAgentSub]   = useState('Your AI guide · always on');
  const { primary, from, to } = PRESETS[preset];

  return (
    <>
      <style>{`
        @keyframes widgetBounce {
          0%,80%,100% { transform:translateY(0); }
          40%         { transform:translateY(-4px); }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>

      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--on-surface)', letterSpacing: '-0.03em', marginBottom: 4 }}>
          In-Page Assistant
        </h1>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>
          Preview how Ahaget appears inside your customers&apos; SaaS product — a persistent right-side panel that guides users in real time.
        </p>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 40, alignItems: 'start' }}>

        {/* ── Left: setup & checklist ─────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Branding preview controls */}
          <div style={{
            background: 'var(--surface-low)', border: '1px solid rgba(138,43,226,0.12)',
            borderRadius: 14, padding: '20px 22px',
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>
              Preview branding
            </p>

            {/* Color presets */}
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Color theme</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
              {PRESETS.map((p, i) => (
                <button
                  key={p.name}
                  onClick={() => setPreset(i)}
                  title={p.name}
                  style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: `linear-gradient(135deg, ${p.from}, ${p.to})`,
                    border: i === preset ? '3px solid white' : '2px solid transparent',
                    outline: i === preset ? `2px solid ${p.primary}` : 'none',
                    cursor: 'pointer', transition: 'transform 0.15s',
                    transform: i === preset ? 'scale(1.15)' : 'scale(1)',
                    boxShadow: i === preset ? `0 0 0 2px ${p.primary}44` : 'none',
                  }}
                />
              ))}
            </div>

            {/* Name fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Agent name', value: agentName, set: setAgentName, placeholder: 'e.g. Acme Assistant' },
                { label: 'Subtitle',   value: agentSub,  set: setAgentSub,  placeholder: 'e.g. Your AI guide · always on' },
              ].map(({ label, value, set, placeholder }) => (
                <div key={label}>
                  <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 5 }}>{label}</p>
                  <input
                    value={value}
                    onChange={e => set(e.target.value)}
                    placeholder={placeholder}
                    style={{
                      width: '100%', padding: '8px 11px', borderRadius: 8, fontSize: 12.5,
                      background: 'var(--surface)', border: '1px solid rgba(138,43,226,0.15)',
                      color: 'var(--on-surface)', outline: 'none', boxSizing: 'border-box',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* How to embed */}
          <div style={{
            background: 'var(--surface-low)', border: '1px solid rgba(138,43,226,0.12)',
            borderRadius: 14, padding: '20px 22px',
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
              Add to your app
            </p>
            <div style={{
              background: '#0f172a', borderRadius: 10, padding: '14px 16px',
              fontSize: 11.5, fontFamily: 'monospace', lineHeight: 1.6, color: '#94a3b8',
              marginBottom: 14, overflowX: 'auto',
            }}>
              <span style={{ color: '#64748b' }}>{`<!-- Paste before </body> -->`}</span>{'\n'}
              <span style={{ color: '#7dd3fc' }}>{`<script`}</span>
              <span style={{ color: '#fde68a' }}>{` src`}</span>
              <span style={{ color: '#94a3b8' }}>{`=`}</span>
              <span style={{ color: '#86efac' }}>{`"https://cdn.ahaget.ai/widget.js"`}</span>
              <span style={{ color: '#7dd3fc' }}>{`>`}</span>
              <span style={{ color: '#7dd3fc' }}>{`</script>`}</span>{'\n'}
              <span style={{ color: '#7dd3fc' }}>{`<script>`}</span>{'\n'}
              {'  '}<span style={{ color: '#c084fc' }}>Ahaget</span>
              <span style={{ color: '#94a3b8' }}>{`('init', {`}</span>{'\n'}
              {'    '}<span style={{ color: '#fde68a' }}>apiKey</span>
              <span style={{ color: '#94a3b8' }}>{`: `}</span>
              <span style={{ color: '#86efac' }}>{`'YOUR_API_KEY'`}</span>
              <span style={{ color: '#94a3b8' }}>{`,`}</span>{'\n'}
              {'    '}<span style={{ color: '#fde68a' }}>userId</span>
              <span style={{ color: '#94a3b8' }}>{`: `}</span>
              <span style={{ color: '#86efac' }}>{`user.id`}</span>{'\n'}
              {'  '}<span style={{ color: '#94a3b8' }}>{`});`}</span>{'\n'}
              <span style={{ color: '#7dd3fc' }}>{`</script>`}</span>
            </div>

            {/* Checklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { done: true,  label: 'Create your Ahaget account' },
                { done: false, label: 'Install the snippet in your app' },
                { done: false, label: 'Set up your first agent flow' },
                { done: false, label: 'Go live with your users' },
              ].map(({ done, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: done
                      ? `linear-gradient(135deg, ${primary}, ${to})`
                      : 'rgba(138,43,226,0.06)',
                    border: done ? 'none' : '1px solid rgba(138,43,226,0.18)',
                  }}>
                    {done && (
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span style={{
                    fontSize: 12.5, color: done ? 'var(--muted)' : 'var(--on-surface-variant)',
                    textDecoration: done ? 'line-through' : 'none',
                  }}>{label}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button
                id="btn-open-ahaget-editor"
                style={{
                  flex: 1,
                  background: `linear-gradient(135deg, ${primary}, ${to})`,
                  boxShadow: `0 2px 12px ${primary}44`,
                  color: '#fff', border: 'none', borderRadius: 9,
                  padding: '9px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}
              >
                Open in your app ↗
              </button>
              <a
                href="/settings/widget"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '9px 16px', borderRadius: 9,
                  border: '1px solid rgba(138,43,226,0.2)',
                  color: 'var(--muted)', fontSize: 13, textDecoration: 'none',
                  transition: 'background 0.15s',
                }}
              >
                Settings
              </a>
            </div>
          </div>
        </div>

        {/* ── Right: live widget preview ───────────────────────────────────── */}
        <div style={{ position: 'sticky', top: 36 }}>
          {/* "Customer's SaaS" mock frame */}
          <div style={{
            background: '#f1f5f9', border: '1px solid #e2e8f0',
            borderRadius: 16, overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          }}>
            {/* Browser chrome */}
            <div style={{
              background: '#ffffff', borderBottom: '1px solid #e2e8f0',
              padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{ display: 'flex', gap: 5 }}>
                {['#ef4444','#f59e0b','#22c55e'].map(c => (
                  <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
                ))}
              </div>
              <div style={{
                flex: 1, background: '#f8fafc', border: '1px solid #e2e8f0',
                borderRadius: 6, padding: '4px 10px', fontSize: 10.5, color: '#94a3b8',
              }}>
                app.yourcustomer.com/dashboard
              </div>
            </div>

            {/* Mock SaaS UI + widget side by side */}
            <div style={{ display: 'flex', background: '#f8fafc', minHeight: 640 }}>
              {/* Mock SaaS content */}
              <div style={{ flex: 1, padding: '18px 16px' }}>
                {/* Mock nav */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  {['Dashboard', 'Analytics', 'Settings'].map((item, i) => (
                    <span key={item} style={{
                      fontSize: 11, fontWeight: i === 0 ? 700 : 400,
                      color: i === 0 ? '#1e293b' : '#94a3b8',
                      borderBottom: i === 0 ? '2px solid #6366f1' : '2px solid transparent',
                      paddingBottom: 4, cursor: 'pointer',
                    }}>{item}</span>
                  ))}
                </div>
                {/* Mock content blocks */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ height: 14, background: '#e2e8f0', borderRadius: 4, width: '60%' }} />
                  <div style={{ height: 60, background: '#e2e8f0', borderRadius: 8 }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div style={{ height: 48, background: '#e2e8f0', borderRadius: 8 }} />
                    <div style={{ height: 48, background: '#e2e8f0', borderRadius: 8 }} />
                  </div>
                  <div style={{ height: 10, background: '#e2e8f0', borderRadius: 4, width: '80%' }} />
                  <div style={{ height: 10, background: '#e2e8f0', borderRadius: 4, width: '55%' }} />
                  <div style={{ height: 80, background: '#e2e8f0', borderRadius: 8 }} />
                  <div style={{ height: 10, background: '#e2e8f0', borderRadius: 4, width: '70%' }} />
                  <div style={{ height: 10, background: '#e2e8f0', borderRadius: 4, width: '40%' }} />
                </div>
              </div>

              {/* Ahaget widget panel */}
              <div style={{
                borderLeft: '1px solid #e2e8f0',
                animation: 'fadeUp 0.4s ease both',
              }}>
                <WidgetPreview
                  primaryColor={primary}
                  gradFrom={from}
                  gradTo={to}
                  agentName={agentName}
                  agentSub={agentSub}
                />
              </div>
            </div>
          </div>

          <p style={{
            textAlign: 'center', fontSize: 11, color: 'var(--muted)', marginTop: 10,
          }}>
            ↑ Live preview — try typing in the chat
          </p>
        </div>
      </div>
    </>
  );
}
