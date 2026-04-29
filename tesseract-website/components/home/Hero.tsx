"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "http://localhost:3001";
const painPoints = [
  "confused by your onboarding",
  "giving up on step 2",
  "leaving without activating",
  "churning in week one",
  "emailing support for help",
];

function LiveWidget() {
  const [step, setStep] = useState(0);
  const messages = [
    { role: "ai", text: "Hey! You haven't connected your data source yet. Want me to walk you through it?" },
    { role: "user", text: "Sure, but I'm not sure what 'API key' means..." },
    { role: "ai", text: "No worries — click Settings in the top nav. I'll find it for you." },
    { role: "ai", text: "Got it! I've copied the key automatically. Paste it in the field below." },
  ];
  useEffect(() => {
    const t = setInterval(() => setStep(s => (s + 1) % messages.length), 2800);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ width: 300, borderRadius: 18, overflow: "hidden", background: "rgba(12,12,12,0.97)", border: "0.5px solid rgba(255,255,255,0.1)", boxShadow: "0 40px 100px rgba(0,0,0,0.8)" }}>
      <div style={{ padding: "12px 15px", borderBottom: "0.5px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 9 }}>
        <div style={{ width: 27, height: 27, borderRadius: 6, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="12" height="12" viewBox="0 0 32 32" fill="none">
            <polygon points="16,3 29,25 3,25" fill="none" stroke="#000" strokeWidth="2.5" strokeLinejoin="round"/>
            <line x1="16" y1="3" x2="10" y2="25" stroke="#000" strokeWidth="1.2"/>
            <line x1="16" y1="3" x2="22" y2="25" stroke="#000" strokeWidth="1.2"/>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#f5f5f7", lineHeight: 1 }}>Tesseract AI</p>
          <p style={{ fontSize: 10, color: "#6e6e73", lineHeight: 1.4 }}>Your onboarding guide</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div className="live-dot anim-pulse" />
          <span style={{ fontSize: 10, color: "#34c759", fontWeight: 500 }}>Live</span>
        </div>
      </div>
      <div style={{ padding: "13px 14px 10px", minHeight: 115, display: "flex", flexDirection: "column", gap: 8 }}>
        {messages.slice(0, step + 1).map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
            style={{ fontSize: 11.5, lineHeight: 1.55, padding: "8px 11px", borderRadius: 10, background: m.role === "ai" ? "rgba(255,255,255,0.06)" : "rgba(110,110,244,0.2)", color: m.role === "ai" ? "#d2d2d7" : "#e0e0f5", alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "90%" }}>
            {m.text}
          </motion.div>
        ))}
      </div>
      <div style={{ padding: "8px 14px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.04)", borderRadius: 8, border: "0.5px solid rgba(255,255,255,0.07)", padding: "7px 11px" }}>
          <span style={{ fontSize: 11, color: "#3a3a3c", flex: 1 }}>Ask anything...</span>
          <ArrowRight size={11} color="#3a3a3c" />
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  const [painIdx, setPainIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPainIdx(i => (i + 1) % painPoints.length), 2500);
    return () => clearInterval(t);
  }, []);

  return (
    <section style={{ background: "#000", minHeight: "100dvh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "100px 0 0", position: "relative", overflow: "hidden" }}>
      <div className="dot-grid" style={{ position: "absolute", inset: 0, opacity: 0.4, pointerEvents: "none" }} />
      <div style={{ position: "absolute", left: "-5%", top: "25%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(110,110,244,.06) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 1100, margin: "0 auto", padding: "0 2rem" }}>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} style={{ marginBottom: 36 }}>
          <span className="badge">
            <span className="live-dot" style={{ background: "var(--accent)" }} />
            Public beta · Trusted by early-stage SaaS teams
          </span>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 310px", gap: 60, alignItems: "flex-start" }} className="hero-grid">
          <div>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.05 }}>
              <h1 className="display-xl" style={{ marginBottom: 8, lineHeight: 0.95 }}>Your users are</h1>
              <div style={{ height: "1.05em", overflow: "hidden", marginBottom: 8 }}>
                <motion.h1 key={painIdx} initial={{ opacity: 0, y: "100%" }} animate={{ opacity: 1, y: "0%" }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="display-xl" style={{ color: "var(--accent)", lineHeight: 1.05 }}>
                  {painPoints[painIdx]}
                </motion.h1>
              </div>
              <h1 className="display-xl" style={{ color: "var(--t4)", marginBottom: 36 }}>right now.</h1>
            </motion.div>

            <motion.p className="body-lg" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} style={{ maxWidth: 490, marginBottom: 44, lineHeight: 1.6 }}>
              Tesseract AI embeds an AI agent inside your SaaS. It watches where users get stuck, guides them through, and executes actions on their behalf — automatically.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.32 }} style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 28 }}>
              <Link href={DASHBOARD_URL}>
                <button className="btn-primary" style={{ fontSize: 16, padding: "15px 32px" }}>
                  Start for free <ArrowRight size={15} />
                </button>
              </Link>
              <Link href="/pricing">
                <button className="btn-ghost" style={{ fontSize: 15, padding: "14px 26px" }}>See pricing</button>
              </Link>
            </motion.div>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }} style={{ fontSize: 11, color: "var(--t5)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Free plan forever · No credit card · 2-line install
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} style={{ marginTop: 60, display: "flex", alignItems: "stretch", gap: 0 }}>
              {[{ n: "60%", d: "of users never complete\nonboarding (industry avg)" }, { n: "3×", d: "faster time-to-value\nwith guided AI" }, { n: "2 min", d: "to install Tesseract\nin your SaaS" }].map((s, i) => (
                <div key={i} style={{ padding: "16px 24px", borderLeft: i > 0 ? "0.5px solid rgba(255,255,255,0.07)" : "none", flex: 1 }}>
                  <p style={{ fontSize: 26, fontWeight: 800, color: "#f5f5f7", letterSpacing: "-0.04em", lineHeight: 1, fontFamily: "'Inter', sans-serif", marginBottom: 5 }}>{s.n}</p>
                  <p style={{ fontSize: 11, color: "var(--t4)", lineHeight: 1.5, whiteSpace: "pre-line" }}>{s.d}</p>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }} style={{ paddingTop: 40 }}>
            <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <div className="live-dot anim-pulse" />
              <span style={{ fontSize: 10, color: "var(--t4)", letterSpacing: "0.08em", fontWeight: 500, textTransform: "uppercase" }}>Live demo</span>
            </div>
            <LiveWidget />
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }} style={{ display: "flex", justifyContent: "center", paddingTop: 72, paddingBottom: 40 }}>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 2 }} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <p style={{ fontSize: 10, color: "var(--t5)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Scroll to explore</p>
            <div style={{ width: 1, height: 28, background: "linear-gradient(to bottom, rgba(255,255,255,0.15), transparent)" }} />
          </motion.div>
        </motion.div>
      </div>

      <style>{`@media (max-width: 860px) { .hero-grid { grid-template-columns: 1fr !important; } }`}</style>
    </section>
  );
}
