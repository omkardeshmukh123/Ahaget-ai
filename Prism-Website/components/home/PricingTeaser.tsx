"use client";
import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import Link from "next/link";

const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "http://localhost:3001";

const plans = [
  {
    name: "Starter",
    price: 0,
    desc: "For indie developers exploring Prism.",
    features: ["3 AI agents", "100 MTU / month", "Flow builder", "Knowledge base (5 docs)", "Community support"],
    cta: "Start for free",
    href: DASHBOARD_URL,
  },
  {
    name: "Pro",
    price: 49,
    desc: "For growing SaaS teams.",
    features: ["10 AI agents", "2,500 MTU / month", "MCP connectors (3)", "Advanced analytics", "Priority email support"],
    cta: "Start Pro trial",
    href: `${DASHBOARD_URL}/upgrade`,
    featured: true,
  },
  {
    name: "Scale",
    price: 149,
    desc: "For high-volume teams.",
    features: ["Unlimited agents", "10,000 MTU / month", "Custom MCP connectors", "Dedicated Slack", "SLA + 99.9% uptime"],
    cta: "Start Scale trial",
    href: `${DASHBOARD_URL}/upgrade`,
  },
];

export default function PricingTeaser() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [annual, setAnnual] = useState(false);

  return (
    <section ref={ref} style={{ background: "var(--bg)", padding: "6rem 0", borderTop: "1px solid var(--border)" }}>
      <div className="container">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} style={{ marginBottom: 48 }}>
          <p className="section-label" style={{ marginBottom: 14 }}>Pricing</p>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
            <h2>Start free. Scale when ready.</h2>
            {/* Toggle */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 13, color: annual ? "var(--text-4)" : "var(--text-2)" }}>Monthly</span>
              <button onClick={() => setAnnual(!annual)} style={{
                width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
                background: annual ? "#FFFFFF" : "var(--surface-3)", position: "relative", transition: "background .2s",
              }}>
                <motion.div animate={{ x: annual ? 22 : 2 }} transition={{ type: "spring", stiffness: 600, damping: 30 }}
                  style={{ position: "absolute", top: 2, width: 20, height: 20, borderRadius: "50%", background: annual ? "#0A0A0F" : "var(--text-4)" }} />
              </button>
              <span style={{ fontSize: 13, color: annual ? "var(--text-2)" : "var(--text-4)" }}>
                Annual <span style={{ fontSize: 11, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 4, padding: "2px 7px", color: "var(--text-3)", marginLeft: 4 }}>–20%</span>
              </span>
            </div>
          </div>
        </motion.div>

        {/* Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, marginBottom: 24 }}>
          {plans.map((plan, i) => (
            <motion.div key={plan.name}
              initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: .1 + i * .08 }}
              style={{
                background: plan.featured ? "var(--surface-2)" : "var(--surface)",
                border: `1px solid ${plan.featured ? "rgba(255,255,255,0.12)" : "var(--border)"}`,
                borderRadius: 8, padding: "28px 28px 32px",
                position: "relative",
              }}
            >
              {plan.featured && (
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "var(--accent)", borderRadius: "8px 8px 0 0" }} />
              )}
              <p style={{ fontSize: 13, fontWeight: 600, color: plan.featured ? "var(--text-1)" : "var(--text-3)", fontFamily: "'Inter', sans-serif", marginBottom: 8 }}>
                {plan.name}
                {plan.featured && <span style={{ marginLeft: 8, fontSize: 11, background: "var(--surface-3)", border: "1px solid var(--border)", borderRadius: 4, padding: "2px 8px", color: "var(--text-4)" }}>Most popular</span>}
              </p>
              <p style={{ fontFamily: "'Coolvetica', sans-serif", fontSize: 44, color: "var(--text-1)", lineHeight: 1, letterSpacing: "-0.03em", marginBottom: 4 }}>
                ${annual ? Math.round(plan.price * .8) : plan.price}<span style={{ fontSize: 18, color: "var(--text-4)", fontFamily: "'Inter', sans-serif", fontWeight: 400 }}>/mo</span>
              </p>
              <p style={{ fontSize: 13, color: "var(--text-4)", marginBottom: 24 }}>{plan.desc}</p>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--text-3)" }}>
                    <Check size={13} color="var(--text-3)" style={{ flexShrink: 0 }} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={plan.href}>
                <button style={{
                  width: "100%", padding: "10px 16px", borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: "pointer",
                  fontFamily: "'Inter', sans-serif",
                  background: plan.featured ? "#FFFFFF" : "transparent",
                  color: plan.featured ? "#0A0A0F" : "var(--text-3)",
                  border: `1px solid ${plan.featured ? "#FFFFFF" : "var(--border-2)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}>
                  {plan.cta} <ArrowRight size={14} />
                </button>
              </Link>
            </motion.div>
          ))}
        </div>

        <p style={{ fontSize: 13, color: "var(--text-5)", textAlign: "center" }}>
          No credit card required · Free plan always available ·{" "}
          <Link href="/pricing" style={{ color: "var(--text-4)" }}>See full comparison →</Link>
        </p>
      </div>
    </section>
  );
}
