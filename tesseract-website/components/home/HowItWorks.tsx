"use client";
import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";

const steps = [
  {
    n: "01", label: "Install",
    title: "Paste 2 lines. Done.",
    desc: "Drop the snippet into your app's <head>. Works with React, Next.js, Vue, Svelte, Nuxt, or plain HTML. No build steps.",
    visual: (
      <div className="code-surface">
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "11px 16px", borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#3a3a3c" }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#3a3a3c" }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#3a3a3c" }} />
          <span style={{ fontSize: 12, color: "var(--t5)", marginLeft: 8 }}>index.html</span>
        </div>
        <pre style={{ padding: "18px 20px", fontSize: 13, lineHeight: 1.8, margin: 0, overflowX: "auto", color: "var(--t3)" }}>
{`<script>
  window.TesseractConfig = {
    apiKey: "pk_live_••••••",
    userId: "{{user.id}}",
  };
</script>
<script src="https://cdn.usetesseract.ai/v1/widget.js" async></script>`}
        </pre>
      </div>
    ),
  },
  {
    n: "02", label: "Build flows",
    title: "Build flows visually. No engineers needed.",
    desc: "Drag steps, write AI prompts, and set action triggers in the visual editor. Update your onboarding in minutes, not sprints.",
    visual: (
      <div style={{ background: "#0d0d0d", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "11px 16px", borderBottom: "0.5px solid rgba(255,255,255,0.06)", display: "flex", gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#3a3a3c" }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#3a3a3c" }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#3a3a3c" }} />
          <span style={{ fontSize: 12, color: "var(--t5)", marginLeft: 8 }}>Flow Builder</span>
        </div>
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            { label: "Welcome message", done: true },
            { label: "Connect first integration", active: true },
            { label: "Invite team member", done: false },
            { label: "Publish workspace", done: false },
          ].map((s, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 14px", borderRadius: 10,
              background: s.active ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)",
              border: `0.5px solid ${s.active ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)"}`,
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                background: s.done ? "#fff" : "rgba(255,255,255,0.06)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {s.done && <Check size={9} color="#000" strokeWidth={2.5} />}
              </div>
              <span style={{ fontSize: 13, color: s.active ? "var(--t1)" : s.done ? "var(--t5)" : "var(--t4)" }}>{s.label}</span>
              {s.active && <span style={{ marginLeft: "auto", fontSize: 10, background: "rgba(255,255,255,0.08)", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: 4, padding: "2px 8px", color: "var(--t3)" }}>Step 2/4</span>}
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    n: "03", label: "Measure",
    title: "See exactly where users get stuck.",
    desc: "Real-time sessions, completion rates, drop-off analysis, and AI-generated improvement suggestions — all in one dashboard.",
    visual: (
      <div style={{ background: "#0d0d0d", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "11px 16px", borderBottom: "0.5px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: "var(--t4)" }}>Live sessions</span>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div className="live-dot anim-pulse" />
            <span style={{ fontSize: 11, color: "#34c759", fontWeight: 500 }}>247 active</span>
          </div>
        </div>
        <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column" }}>
          {[
            { u: "sarah@techflow.io", p: 65, s: "Step 3/5" },
            { u: "alex@buildfast.com", p: 100, s: "Done ✓" },
            { u: "mike@nexahq.com", p: 40, s: "Step 2/5" },
          ].map((u, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: i < 2 ? "0.5px solid rgba(255,255,255,0.05)" : "none" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--dark-4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 11, color: "var(--t3)", fontWeight: 600 }}>{u.u[0].toUpperCase()}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, color: "var(--t2)", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.u}</p>
                <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                  <div style={{ height: "100%", width: `${u.p}%`, background: u.p === 100 ? "#34c759" : "#fff", borderRadius: 2 }} />
                </div>
              </div>
              <span style={{ fontSize: 11, color: u.p === 100 ? "#34c759" : "var(--t4)", flexShrink: 0, fontWeight: 500 }}>{u.s}</span>
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
    <section id="how-it-works" ref={ref} className="section-stack section-pad-lg"
      style={{ background: "var(--dark-1)" }}>
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: .6 }} style={{ marginBottom: 52 }}>
          <p className="label" style={{ marginBottom: 16 }}>How it works</p>
          <h2 className="display-md">Install. Build. Measure.</h2>
        </motion.div>

        {/* Tab row */}
        <div style={{ display: "flex", gap: 4, marginBottom: 28 }}>
          {steps.map((s, i) => (
            <button key={i} onClick={() => setActive(i)} style={{
              padding: "8px 20px", borderRadius: 100, border: "0.5px solid",
              fontSize: 14, fontWeight: 500, cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
              background: active === i ? "rgba(255,255,255,0.1)" : "transparent",
              borderColor: active === i ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)",
              color: active === i ? "var(--t1)" : "var(--t4)",
              transition: "all .18s",
            }}>
              <span style={{ color: "var(--t5)", marginRight: 7, fontSize: 11 }}>{s.n}</span>
              {s.label}
            </button>
          ))}
        </div>

        {/* Content panel */}
        <AnimatePresence mode="wait">
          <motion.div key={active}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            transition={{ duration: .3, ease: [0.22, 1, 0.36, 1] }}
            style={{
              display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 56,
              background: "var(--dark-2)", borderRadius: 28, padding: "44px 52px",
              alignItems: "center",
            }}>
            <div>
              <p style={{ fontFamily: "'Coolvetica', sans-serif", fontSize: 90, color: "var(--dark-4)", lineHeight: 1, marginBottom: 16, letterSpacing: "-0.04em", userSelect: "none" }}>{steps[active].n}</p>
              <h3 style={{ fontSize: 26, fontWeight: 700, color: "var(--t1)", marginBottom: 14, fontFamily: "'Inter', sans-serif", letterSpacing: "-0.02em", lineHeight: 1.25 }}>{steps[active].title}</h3>
              <p style={{ fontSize: 16, color: "var(--t3)", lineHeight: 1.7 }}>{steps[active].desc}</p>
            </div>
            <div>{steps[active].visual}</div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
