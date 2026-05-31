'use client';
import { useState, useRef, useEffect, KeyboardEvent } from 'react';

/* ─── Types ─────────────────────────────────────────────────────────────────── */
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface SuggestedAction {
  label: string;
  prompt: string;
}

/* ─── Static suggestions per context ───────────────────────────────────────── */
const SUGGESTIONS: SuggestedAction[] = [
  { label: 'Show me top drop-off points',    prompt: 'Which steps do users drop off from most?' },
  { label: 'Summarize recent conversations', prompt: 'Summarize the most recent 5 conversations.' },
  { label: 'Suggest a new agent flow',       prompt: 'Based on my data, what new agent flow should I create?' },
  { label: "What's my conversion rate?",     prompt: 'What is my current onboarding conversion rate?' },
];

/* ─── Typing indicator ──────────────────────────────────────────────────────── */
function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '4px 0', alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <span
          key={i}
          style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'linear-gradient(135deg, #8A2BE2, #A050F0)',
            display: 'inline-block',
            animation: `assistantBounce 1.2s ease-in-out ${i * 0.18}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Message bubble ────────────────────────────────────────────────────────── */
function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 4,
    }}>
      {!isUser && (
        <div style={{
          width: 26, height: 26, borderRadius: '50%', flexShrink: 0, marginRight: 8,
          background: 'linear-gradient(135deg, #8A2BE2, #A050F0)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, color: '#fff', fontWeight: 700, alignSelf: 'flex-end',
        }}>
          A
        </div>
      )}
      <div style={{
        maxWidth: '80%',
        padding: '9px 12px',
        borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
        background: isUser
          ? 'linear-gradient(135deg, #8A2BE2, #A050F0)'
          : '#ffffff',
        color: isUser ? '#fff' : '#1A0530',
        fontSize: 12.5,
        lineHeight: 1.55,
        border: isUser ? 'none' : '1px solid rgba(138,43,226,0.12)',
        boxShadow: isUser
          ? '0 2px 8px rgba(138,43,226,0.25)'
          : '0 1px 4px rgba(0,0,0,0.05)',
        animation: 'assistantMsgIn 0.2s ease both',
      }}>
        {msg.content}
      </div>
    </div>
  );
}

/* ─── Main panel ────────────────────────────────────────────────────────────── */
interface AhagetAssistantPanelProps {
  onCollapsedChange?: (collapsed: boolean) => void;
}

export default function AhagetAssistantPanel({ onCollapsedChange }: AhagetAssistantPanelProps) {
  const PANEL_WIDTH = 320;

  const [collapsed, setCollapsed]   = useState(false);
  const [messages, setMessages]     = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: "Hi! I'm your Ahaget AI assistant. Ask me anything about your users, agent flows, or performance.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput]           = useState('');
  const [isTyping, setIsTyping]     = useState(false);
  const messagesEndRef               = useRef<HTMLDivElement>(null);
  const inputRef                     = useRef<HTMLTextAreaElement>(null);

  // Notify parent when collapse state changes
  useEffect(() => {
    onCollapsedChange?.(collapsed);
  }, [collapsed, onCollapsedChange]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  /* Fake AI reply — replace with real API call */
  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // TODO: replace with api.assistant.chat(text)
    await new Promise(r => setTimeout(r, 1200 + Math.random() * 600));
    const reply: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: "I'm analysing your data now. This feature will connect to your live analytics once the AI assistant endpoint is wired up. Stay tuned!",
      timestamp: new Date(),
    };
    setIsTyping(false);
    setMessages(prev => [...prev, reply]);
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  /* ── Styles ──────────────────────────────────────────────────────────────── */
  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    right: 0,
    width: collapsed ? 44 : PANEL_WIDTH,
    height: '100vh',
    background: '#FFFFFF',
    borderLeft: '1px solid rgba(138,43,226,0.12)',
    boxShadow: '-4px 0 32px rgba(138,43,226,0.08)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 100,
    transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden',
  };

  return (
    <>
      {/* CSS keyframes injected once */}
      <style>{`
        @keyframes assistantMsgIn {
          from { opacity:0; transform:translateY(4px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes assistantBounce {
          0%,80%,100% { transform:translateY(0); }
          40%         { transform:translateY(-5px); }
        }
        @keyframes assistantPulse {
          0%,100% { opacity:1; }
          50%     { opacity:0.5; }
        }
        #ahaget-assistant-panel *::-webkit-scrollbar { width:4px; }
        #ahaget-assistant-panel *::-webkit-scrollbar-track { background:transparent; }
        #ahaget-assistant-panel *::-webkit-scrollbar-thumb { background:#E2D9F3; border-radius:4px; }
      `}</style>

      <aside id="ahaget-assistant-panel" style={panelStyle} aria-label="Ahaget AI Assistant">

        {/* ── Collapse tab on the LEFT edge ──────────────────────────────────── */}
        <button
          id="ahaget-panel-toggle"
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Expand assistant' : 'Collapse assistant'}
          style={{
            position: 'absolute',
            left: -1,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 20,
            height: 56,
            background: '#fff',
            border: '1px solid rgba(138,43,226,0.15)',
            borderRight: 'none',
            borderRadius: '8px 0 0 8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 1,
            boxShadow: '-3px 0 10px rgba(138,43,226,0.08)',
            transition: 'background 0.15s',
            padding: 0,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#F8F5FE')}
          onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
        >
          <svg
            width="10" height="10"
            viewBox="0 0 24 24"
            fill="none" stroke="#9B8AB0"
            strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s' }}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {collapsed ? (
          /* ── Collapsed: show vertical label ─────────────────────────────── */
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 12,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, #8A2BE2, #A050F0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, color: '#fff', fontWeight: 700,
            }}>A</div>
            <span style={{
              fontSize: 10, fontWeight: 700, color: '#9B8AB0',
              writingMode: 'vertical-rl', textOrientation: 'mixed',
              letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
              AI Assistant
            </span>
          </div>
        ) : (
          <>
            {/* ── Header ────────────────────────────────────────────────────── */}
            <div style={{
              background: 'linear-gradient(160deg, #8A2BE2 0%, #A050F0 100%)',
              padding: '16px 16px 14px',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                {/* Avatar */}
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.22)',
                  border: '2px solid rgba(255,255,255,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, color: '#fff', fontWeight: 700,
                  position: 'relative', flexShrink: 0,
                }}>
                  A
                  {/* Online dot */}
                  <span style={{
                    position: 'absolute', bottom: 0, right: 0,
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#22c55e',
                    border: '2px solid white',
                  }} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1.2 }}>
                    Ahaget Assistant
                  </p>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.72)', margin: '2px 0 0' }}>
                    AI employee · always on
                  </p>
                </div>

                {/* Close/minimize */}
                <button
                  onClick={() => setCollapsed(true)}
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    border: 'none', borderRadius: 6,
                    width: 26, height: 26,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#fff', flexShrink: 0,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.28)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
                  title="Collapse"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
              </div>
            </div>

            {/* ── Suggested actions ──────────────────────────────────────────── */}
            {messages.length <= 1 && (
              <div style={{
                padding: '10px 12px 6px',
                borderBottom: '1px solid rgba(138,43,226,0.08)',
                flexShrink: 0,
                background: '#FDFBFF',
              }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: '#C4B5D8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>
                  Try asking
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {SUGGESTIONS.map(s => (
                    <button
                      key={s.label}
                      onClick={() => sendMessage(s.prompt)}
                      style={{
                        border: '1px solid rgba(138,43,226,0.2)',
                        color: '#8A2BE2',
                        background: 'rgba(138,43,226,0.04)',
                        borderRadius: 20, padding: '4px 10px',
                        fontSize: 11, fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = '#8A2BE2';
                        e.currentTarget.style.color = '#fff';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(138,43,226,0.04)';
                        e.currentTarget.style.color = '#8A2BE2';
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Messages ───────────────────────────────────────────────────── */}
            <div
              role="log"
              aria-live="polite"
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '14px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                background: '#F8F5FE',
              }}
            >
              {messages.map(msg => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}

              {isTyping && (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #8A2BE2, #A050F0)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, color: '#fff', fontWeight: 700,
                  }}>A</div>
                  <div style={{
                    background: '#fff',
                    border: '1px solid rgba(138,43,226,0.12)',
                    borderRadius: '14px 14px 14px 4px',
                    padding: '9px 14px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                  }}>
                    <TypingDots />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ── Input row ──────────────────────────────────────────────────── */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 8,
              padding: '10px 12px',
              borderTop: '1px solid rgba(138,43,226,0.1)',
              background: '#fff',
              flexShrink: 0,
            }}>
              <textarea
                ref={inputRef}
                id="ahaget-assistant-input"
                rows={1}
                value={input}
                onChange={e => {
                  setInput(e.target.value);
                  /* auto-resize */
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 90) + 'px';
                }}
                onKeyDown={handleKey}
                placeholder="Ask anything…"
                aria-label="Message input"
                disabled={isTyping}
                style={{
                  flex: 1,
                  border: '1.5px solid rgba(138,43,226,0.2)',
                  borderRadius: 10,
                  padding: '7px 11px',
                  fontSize: 12.5,
                  outline: 'none',
                  resize: 'none',
                  color: '#1A0530',
                  background: '#F8F5FE',
                  lineHeight: 1.4,
                  maxHeight: 90,
                  transition: 'border-color 0.15s, background 0.15s',
                  fontFamily: 'inherit',
                  overflow: 'hidden',
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#8A2BE2';
                  e.target.style.background = '#fff';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'rgba(138,43,226,0.2)';
                  e.target.style.background = '#F8F5FE';
                }}
              />
              <button
                id="ahaget-assistant-send"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isTyping}
                aria-label="Send message"
                style={{
                  width: 34, height: 34,
                  borderRadius: 9,
                  background: 'linear-gradient(135deg, #8A2BE2, #A050F0)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'opacity 0.15s, transform 0.15s',
                  opacity: !input.trim() || isTyping ? 0.4 : 1,
                }}
                onMouseEnter={e => { if (input.trim() && !isTyping) e.currentTarget.style.transform = 'scale(1.07)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="#fff">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>

            {/* ── Footer ─────────────────────────────────────────────────────── */}
            <div style={{
              textAlign: 'center',
              fontSize: 9.5,
              color: '#C4B5D8',
              padding: '4px 0 7px',
              background: '#fff',
              flexShrink: 0,
            }}>
              AI employee by{' '}
              <a href="https://ahaget.ai" target="_blank" rel="noopener noreferrer"
                style={{ color: '#8A2BE2', textDecoration: 'none', fontWeight: 600 }}>
                Ahaget
              </a>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
