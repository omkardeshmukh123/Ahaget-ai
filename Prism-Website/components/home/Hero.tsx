"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import Link from "next/link";

const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "http://localhost:3001";

/* ── Live AI Widget ─────────────────────────────────────────── */
function Widget() {
  const [step, setStep] = useState(0);
  const steps = ["Install", "Connect", "Configure", "Live"];
  const messages = [
    "I'll guide you through setup step by step. Ready to begin?",
    "Now let's connect your first data source. I'll handle the rest.",
    "Almost there — configuring your AI agent to match your product.",
    "Your agent is live. Users will now be guided automatically.",
  ];

  useEffect(() => {
    const t = setInterval(() => setStep(s => (s + 1) % 4), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      width: 320, background: "rgba(20,20,20,0.9)",
      backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)",
      borderRadius: 20, overflow: "hidden",
      border: "0.5px solid rgba(255,255,255,0.12)",
      boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(255,255,255,0.06) inset",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}>
        <div style={{ width: 30, height: 30, background: "#fff", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" stroke="#000" strokeWidth="1.5" fill="none"/>
            <path d="M7 4L10 5.5V8.5L7 10L4 8.5V5.5L7 4Z" fill="#000"/>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#f5f5f7", lineHeight: 1 }}>Prism</p>
          <p style={{ fontSize: 11, color: "var(--t4)", lineHeight: 1.4 }}>AI Onboarding Agent</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div className="live-dot anim-pulse" />
          <span style={{ fontSize: 11, color: "#34c759", fontWeight: 500 }}>Live</span>
        </div>
      </div>

      {/* Step pills */}
      <div style={{ display: "flex", gap: 4, padding: "12px 14px 0" }}>
        {steps.map((s, i) => (
          <div key={s} style={{
            flex: 1, padding: "5px 0", borderRadius: 6, textAlign: "center",
            background: i === step ? "rgba(255,255,255,0.12)" : "transparent",
            transition: "background .4s",
          }}>
            <span style={{ fontSize: 10, color: i <= step ? "var(--t2)" : "var(--t5)", fontWeight: i === step ? 600 : 400 }}>{s}</span>
          </div>
        ))}
      </div>

      {/* Message */}
      <div style={{ padding: "14px 14px 10px" }}>
        <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "11px 13px" }}>
          <motion.p key={step} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .3 }}
            style={{ fontSize: 13, color: "var(--t2)", lineHeight: 1.6 }}>
            {messages[step]}
          </motion.p>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: "0 14px 10px" }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          background: "#fff", borderRadius: 8, padding: "9px 14px", cursor: "pointer",
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#000" }}>Continue</span>
          <ArrowRight size={12} color="#000" />
        </div>
      </div>

      {/* Input */}
      <div style={{ padding: "0 14px 14px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "rgba(255,255,255,0.04)", borderRadius: 8, border: "0.5px solid rgba(255,255,255,0.08)",
          padding: "8px 12px",
        }}>
          <span style={{ fontSize: 12, color: "var(--t5)", flex: 1 }}>Ask anything...</span>
          <ArrowRight size={12} color="var(--t5)" />
        </div>
      </div>
    </div>
  );
}

/* ── Hero ──────────────────────────────────────────────────── */
export default function Hero() {
  return (
    <section style={{
      background: "#000000",
      minHeight: "100dvh",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "80px 0 120px",
      position: "relative", overflow: "hidden",
    }}>
      {/* Subtle dot grid */}
      <div className="dot-grid" style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: .5 }} />

      {/* Glow — right */}
      <div style={{
        position: "absolute", right: "10%", top: "25%",
        width: 500, height: 500, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(110,110,244,.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 1100, margin: "0 auto", padding: "0 2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 60, flexWrap: "wrap" }}>

          {/* Left: Copy */}
          <div style={{ flex: "1 1 480px", minWidth: 280 }}>
            {/* Badge */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }}>
              <div className="badge" style={{ marginBottom: 36 }}>
                <span className="live-dot" style={{ width: 5, height: 5, background: "var(--accent)" }} />
                Now in public beta
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65, delay: .08 }}
              className="display-xl" style={{ marginBottom: 24 }}>
              The AI that<br />onboards your<br />users.
            </motion.h1>

            {/* Sub */}
            <motion.p
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55, delay: .18 }}
              className="body-lg" style={{ maxWidth: 420, marginBottom: 40 }}>
              Embed it in 2 lines of code. It guides users, answers questions, and executes actions — automatically.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5, delay: .28 }}
              style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
              <Link href={DASHBOARD_URL}>
                <button className="btn-primary" style={{ fontSize: 16, padding: "14px 30px" }}>
                  Start for free <ArrowRight size={15} />
                </button>
              </Link>
              <button className="btn-ghost" style={{ fontSize: 15, padding: "13px 26px" }}>
                <Play size={13} style={{ opacity: .5 }} />
                Watch demo
              </button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .5 }}
              style={{ fontSize: 13, color: "var(--t5)" }}>
              Free plan forever · No credit card
            </motion.p>
          </div>

          {/* Right: Widget */}
          <div style={{ flex: "0 1 320px", display: "flex", justifyContent: "flex-end" }}>
            <Widget />
          </div>
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6, delay: .5 }}
          style={{
            marginTop: 72,
            display: "grid", gridTemplateColumns: "repeat(3,1fr)",
            background: "rgba(255,255,255,0.03)",
            border: "0.5px solid rgba(255,255,255,0.08)",
            borderRadius: 20, overflow: "hidden",
          }}>
          {[
            { n: "60%",  l: "of users never finish onboarding" },
            { n: "72%",  l: "SaaS churn in first 30 days" },
            { n: "$25k", l: "avg cost per churned user" },
          ].map((s, i) => (
            <div key={i} style={{
              padding: "28px 32px",
              borderRight: i < 2 ? "0.5px solid rgba(255,255,255,0.08)" : "none",
            }}>
              <p className="stat-num">{s.n}</p>
              <p style={{ fontSize: 14, color: "var(--t4)", marginTop: 6 }}>{s.l}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
