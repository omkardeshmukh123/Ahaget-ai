"use client";
import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Copy, Check } from "lucide-react";

const snippet = `<script>
  window.PrismConfig = {
    apiKey: "YOUR_KEY",
    userId: "{{user.id}}"
  };
</script>
<script src="https://cdn.useprism.ai/widget.js" async></script>`;

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="code-block">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--surface-3)" }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--surface-3)" }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--surface-3)" }} />
        </div>
        <button onClick={copy} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-5)", display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}>
          {copied ? <Check size={12} color="#4ade80" /> : <Copy size={12} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre style={{ padding: "16px 20px", margin: 0, fontSize: 13, overflowX: "auto" }}>
        <code style={{ color: "var(--text-3)" }}>{code}</code>
      </pre>
    </div>
  );
}

const steps = [
  {
    n: "01", label: "Install",
    title: "2 lines of code. That's it.",
    desc: "Paste into your app's <head>. Works with React, Next.js, Vue, Svelte, or plain HTML.",
    visual: <CodeBlock code={snippet} />,
  },
  {
    n: "02", label: "Build",
    title: "Build your onboarding flow visually.",
    desc: "Drag steps, write AI prompts, configure actions. No engineers needed for updates.",
    visual: (
      <div style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", display: "flex", gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--surface-3)" }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--surface-3)" }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--surface-3)" }} />
        </div>
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            { label: "Connect data source", done: true },
            { label: "Verify integration", active: true },
            { label: "Create first resource", done: false },
            { label: "Complete setup", done: false },
          ].map((s, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 14px", borderRadius: 6,
              background: s.active ? "var(--surface-2)" : "var(--surface)",
              border: `1px solid ${s.active ? "rgba(255,255,255,0.1)" : "var(--border)"}`,
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                background: s.done ? "#FFFFFF" : s.active ? "var(--surface-3)" : "var(--surface-3)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {s.done && <Check size={10} color="#0A0A0F" />}
              </div>
              <span style={{ fontSize: 13, color: s.active ? "var(--text-1)" : s.done ? "var(--text-4)" : "var(--text-5)" }}>{s.label}</span>
              {s.active && <span style={{ marginLeft: "auto", fontSize: 11, background: "var(--surface-3)", border: "1px solid var(--border)", borderRadius: 4, padding: "2px 8px", color: "var(--text-3)" }}>Active</span>}
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    n: "03", label: "Watch",
    title: "Watch it work. Measure what matters.",
    desc: "Real-time session feed. Completion rates. Drop-off analysis. Everything in one dashboard.",
    visual: (
      <div style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: "var(--text-4)" }}>Live sessions</span>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80" }} className="animate-pulse-dot" />
            <span style={{ fontSize: 11, color: "var(--text-4)" }}>247 active</span>
          </div>
        </div>
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 1 }}>
          {[
            { email: "sarah@techflow.io", step: "Step 3/5", status: "Active", pct: 60 },
            { email: "alex@buildfast.com", step: "Step 5/5", status: "Done", pct: 100 },
            { email: "mike@nexahq.com", step: "Step 2/5", status: "Active", pct: 40 },
          ].map((u, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < 2 ? "1px solid var(--border)" : "none" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--surface-3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600 }}>{u.email[0].toUpperCase()}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</p>
                <div style={{ height: 3, background: "var(--surface-3)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${u.pct}%`, background: u.status === "Done" ? "#4ade80" : "#FFFFFF", borderRadius: 2, transition: "width .4s" }} />
                </div>
              </div>
              <span style={{ fontSize: 11, color: u.status === "Done" ? "#4ade80" : "var(--text-4)", flexShrink: 0 }}>{u.step}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

export default function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [active, setActive] = useState(0);

  return (
    <section id="how-it-works" ref={ref} style={{ background: "var(--bg-2)", padding: "6rem 0", borderTop: "1px solid var(--border)" }}>
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: .5 }} style={{ marginBottom: 48 }}>
          <p className="section-label" style={{ marginBottom: 14 }}>How it works</p>
          <h2>Three steps. Up in minutes.</h2>
        </motion.div>

        {/* Step tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 32 }}>
          {steps.map((s, i) => (
            <button key={i} onClick={() => setActive(i)}
              style={{
                padding: "8px 18px", borderRadius: 6, border: "1px solid",
                fontSize: 14, fontWeight: 500, fontFamily: "'Inter', sans-serif", cursor: "pointer",
                background: active === i ? "var(--surface-2)" : "transparent",
                borderColor: active === i ? "rgba(255,255,255,0.12)" : "var(--border)",
                color: active === i ? "var(--text-1)" : "var(--text-4)",
                transition: "all .15s",
              }}>
              <span style={{ color: "var(--text-5)", marginRight: 6, fontSize: 12 }}>{s.n}</span>
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div key={active}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: .3 }}
            style={{
              display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 60, alignItems: "center",
              background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "40px 48px",
            }}
            className="how-it-works-grid"
          >
            <div>
              <p style={{ fontFamily: "'Coolvetica', sans-serif", fontSize: 80, color: "var(--surface-3)", lineHeight: 1, marginBottom: 12, letterSpacing: "-0.03em", userSelect: "none" }}>{steps[active].n}</p>
              <h3 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-1)", marginBottom: 12, fontFamily: "'Inter', sans-serif", letterSpacing: "-0.02em", lineHeight: 1.3 }}>{steps[active].title}</h3>
              <p style={{ fontSize: 16, color: "var(--text-4)", lineHeight: 1.7 }}>{steps[active].desc}</p>
            </div>
            <div>{steps[active].visual}</div>
          </motion.div>
        </AnimatePresence>
      </div>
      <style>{`.how-it-works-grid { @media (max-width: 768px) { grid-template-columns: 1fr !important; padding: 24px !important; gap: 32px !important; } }`}</style>
    </section>
  );
}
