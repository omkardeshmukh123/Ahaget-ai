"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Play, Zap } from "lucide-react";
import Link from "next/link";

const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "http://localhost:3001";

/* ── AI Widget preview inside hero ─────────────────────────── */
function HeroWidget() {
  const [step, setStep] = useState(0);
  const [msg, setMsg] = useState(0);

  const steps = ["Install snippet", "Connect data", "Launch agent", "Go live"];
  const messages = [
    "Hi! I'll guide you through setup. Click the button below to continue.",
    "Great — now let's connect your first data source.",
    "Your agent is trained and ready. Let's deploy it.",
  ];

  useEffect(() => {
    const t1 = setInterval(() => setStep(s => (s + 1) % 4), 2800);
    const t2 = setInterval(() => setMsg(m => (m + 1) % messages.length), 3500);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: .7, delay: .3 }}
      className="glass-widget"
      style={{ width: 340, flexShrink: 0, overflow: "hidden" }}
    >
      {/* Widget header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "12px 16px",
        borderBottom: "1px solid var(--border)",
        background: "rgba(255,255,255,0.02)"
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6, background: "#FFFFFF",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
        }}>
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" stroke="#0A0A0F" strokeWidth="1.5" fill="none"/>
            <path d="M7 4L10 5.5V8.5L7 10L4 8.5V5.5L7 4Z" fill="#0A0A0F"/>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)", lineHeight: 1.2 }}>Prism</p>
          <p style={{ fontSize: 11, color: "var(--text-4)", lineHeight: 1.2 }}>AI Onboarding Agent</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80" }} className="animate-pulse-dot" />
          <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 500 }}>Live</span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ padding: "10px 16px 0", display: "flex", gap: 4 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ flex: 1 }}>
            <div style={{
              height: 2, borderRadius: 2, marginBottom: 4,
              background: i <= step ? "#FFFFFF" : "var(--surface-3)",
              transition: "background .4s"
            }} />
            <p style={{ fontSize: 9, color: i <= step ? "var(--text-3)" : "var(--text-5)", textAlign: "center", lineHeight: 1.2 }}>
              {s}
            </p>
          </div>
        ))}
      </div>

      {/* AI message */}
      <div style={{ padding: "14px 16px", minHeight: 90 }}>
        <div style={{
          background: "var(--surface-2)", borderRadius: 6, padding: "10px 12px",
          border: "1px solid var(--border)"
        }}>
          <motion.p key={msg}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .3 }}
            style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}>
            {messages[msg]}
          </motion.p>
        </div>
      </div>

      {/* Action button */}
      <div style={{ padding: "0 16px 14px" }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "9px 16px", borderRadius: 6, gap: 6, cursor: "pointer",
          background: "#FFFFFF", transition: "background .12s"
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#0A0A0F" }}>Continue setup</span>
          <ArrowRight size={13} color="#0A0A0F" />
        </div>
      </div>

      {/* Input bar */}
      <div style={{ padding: "0 16px 16px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "var(--bg-2)", borderRadius: 6, border: "1px solid var(--border)",
          padding: "8px 12px"
        }}>
          <span style={{ fontSize: 12, color: "var(--text-5)", flex: 1 }}>Ask anything...</span>
          <ArrowRight size={13} color="var(--text-5)" />
        </div>
      </div>
    </motion.div>
  );
}

/* ── Hero ──────────────────────────────────────────────────── */
export default function Hero() {
  return (
    <section style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      background: "var(--bg)", position: "relative", overflow: "hidden",
      padding: "80px 0 60px",
    }}>
      {/* Dot grid */}
      <div className="dot-grid" style={{ position: "absolute", inset: 0, opacity: .6, pointerEvents: "none" }} />

      {/* Violet glow — RIGHT side only, behind widget */}
      <div style={{
        position: "absolute", right: "5%", top: "30%",
        width: 480, height: 480, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(124,58,237,.18) 0%, transparent 70%)",
        filter: "blur(40px)", pointerEvents: "none",
      }} />

      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 80,
          flexWrap: "wrap",
        }}>
          {/* Left: copy */}
          <div style={{ flex: "1 1 480px", minWidth: 300 }}>
            {/* Badge */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4 }}>
              <div className="badge" style={{ marginBottom: 32 }}>
                <span className="badge-dot" />
                Now in public beta
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5, delay: .1 }}
              style={{ marginBottom: 20 }}
            >
              Your users stop.<br />Prism starts.
            </motion.h1>

            {/* Sub */}
            <motion.p
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5, delay: .2 }}
              style={{ fontSize: 18, lineHeight: 1.7, maxWidth: 480, marginBottom: 36, color: "var(--text-3)" }}
            >
              Embed an AI agent in 2 lines of code. It guides users through onboarding
              autonomously — clicks buttons, fills forms, answers questions.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5, delay: .3 }}
              style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 20 }}
            >
              <Link href={DASHBOARD_URL}>
                <button className="btn-primary" style={{ padding: "12px 24px", fontSize: 15 }}>
                  Start for free <ArrowRight size={15} />
                </button>
              </Link>
              <button className="btn-ghost" style={{ padding: "11px 22px", fontSize: 15 }}>
                <Play size={14} style={{ opacity: .6 }} />
                Watch demo
              </button>
            </motion.div>

            {/* Trust */}
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .5 }}
              style={{ fontSize: 13, color: "var(--text-5)" }}
            >
              Free forever plan · No credit card needed
            </motion.p>
          </div>

          {/* Right: AI widget */}
          <div style={{ flex: "0 1 340px", display: "flex", justifyContent: "flex-end" }}>
            <HeroWidget />
          </div>
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .6, duration: .5 }}
          style={{
            marginTop: 80,
            background: "var(--bg-3)", border: "1px solid var(--border)",
            borderRadius: 8, display: "flex", flexWrap: "wrap",
            overflow: "hidden",
          }}
        >
          {[
            { num: "60%", label: "of users never finish onboarding" },
            { num: "72%", label: "SaaS churn in first 30 days" },
            { num: "$25k", label: "avg cost per churned customer" },
          ].map((s, i) => (
            <div key={i} className="stat-block" style={{
              borderRight: i < 2 ? "1px solid var(--border)" : "none",
              borderBottom: "none",
            }}>
              <p style={{ fontSize: 36, fontFamily: "'Coolvetica', sans-serif", fontWeight: 400, color: "var(--text-1)", letterSpacing: "-0.03em", lineHeight: 1 }}>{s.num}</p>
              <p style={{ fontSize: 14, color: "var(--text-4)", marginTop: 4 }}>{s.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
