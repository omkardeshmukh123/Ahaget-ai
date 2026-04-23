"use client";
import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import Link from "next/link";

const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "http://localhost:3001";

const plans = [
  {
    name: "Starter", price: 0, priceAnn: 0,
    desc: "Explore what Prism can do.",
    features: ["3 AI agents", "100 MTU / month", "Visual flow builder", "5-doc knowledge base", "Community support"],
    cta: "Start for free", href: DASHBOARD_URL,
  },
  {
    name: "Pro", price: 49, priceAnn: 39,
    desc: "For fast-growing SaaS teams.",
    features: ["10 AI agents", "2,500 MTU / month", "3 MCP connectors", "Advanced drop-off analytics", "Priority email support"],
    cta: "Start Pro trial", href: `${DASHBOARD_URL}/upgrade`, featured: true,
  },
  {
    name: "Scale", price: 149, priceAnn: 119,
    desc: "For high-volume deployments.",
    features: ["Unlimited agents", "10,000 MTU / month", "Custom MCP connectors", "Dedicated Slack channel", "SLA + 99.9% uptime"],
    cta: "Start Scale trial", href: `${DASHBOARD_URL}/upgrade`,
  },
];

export default function PricingTeaser() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [ann, setAnn] = useState(false);

  return (
    <section ref={ref} className="section-stack section-pad-lg"
      style={{ background: "#000000" }}>
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: .6 }}
          style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 24, marginBottom: 52 }}>
          <div>
            <p className="label" style={{ marginBottom: 16 }}>Pricing</p>
            <h2 className="display-md">Start free.<br />Scale when ready.</h2>
          </div>
          {/* Toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 6 }}>
            <span style={{ fontSize: 14, color: ann ? "var(--t4)" : "var(--t2)" }}>Monthly</span>
            <button onClick={() => setAnn(!ann)} style={{
              width: 44, height: 26, borderRadius: 100, border: "none", cursor: "pointer", position: "relative",
              background: ann ? "#FFFFFF" : "rgba(255,255,255,0.12)", transition: "background .2s",
            }}>
              <motion.div animate={{ x: ann ? 20 : 2 }} transition={{ type: "spring", stiffness: 600, damping: 30 }}
                style={{ position: "absolute", top: 3, width: 20, height: 20, borderRadius: "50%", background: ann ? "#000" : "var(--t4)" }} />
            </button>
            <span style={{ fontSize: 14, color: ann ? "var(--t2)" : "var(--t4)" }}>
              Annual <span style={{ fontSize: 11, background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 4, padding: "2px 7px", color: "var(--t3)", marginLeft: 4 }}>–20%</span>
            </span>
          </div>
        </motion.div>

        {/* Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
          {plans.map((p, i) => (
            <motion.div key={p.name}
              initial={{ opacity: 0, y: 28 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: .1 + i * .09, duration: .6 }}
              className={`price-card ${p.featured ? "featured" : ""}`}>
              {p.featured && <div style={{ position: "absolute" as const, top: 0, left: 0, right: 0, height: "0.5px", background: "rgba(255,255,255,0.4)", borderRadius: "24px 24px 0 0" }} />}
              <p style={{ fontSize: 13, fontWeight: 600, color: p.featured ? "var(--t1)" : "var(--t4)", marginBottom: 10, fontFamily: "'Inter', sans-serif" }}>
                {p.name}
                {p.featured && <span style={{ marginLeft: 8, fontSize: 10, background: "rgba(255,255,255,0.08)", border: "0.5px solid rgba(255,255,255,0.14)", borderRadius: 4, padding: "2px 8px", color: "var(--t3)", fontWeight: 500 }}>Most popular</span>}
              </p>
              <p style={{ fontFamily: "'Coolvetica', sans-serif", fontSize: 52, color: "var(--t1)", lineHeight: 1, letterSpacing: "-0.04em", marginBottom: 6 }}>
                ${ann ? p.priceAnn : p.price}<span style={{ fontSize: 18, fontFamily: "'Inter', sans-serif", color: "var(--t4)", fontWeight: 400 }}>/mo</span>
              </p>
              <p style={{ fontSize: 14, color: "var(--t4)", marginBottom: 28 }}>{p.desc}</p>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 11, marginBottom: 28 }}>
                {p.features.map(f => (
                  <li key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "var(--t3)" }}>
                    <Check size={13} color="var(--t4)" style={{ flexShrink: 0 }} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={p.href}>
                <button style={{
                  width: "100%", padding: "11px 18px", borderRadius: 100, fontSize: 14, fontWeight: 600,
                  cursor: "pointer", fontFamily: "'Inter', sans-serif",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  background: p.featured ? "#FFFFFF" : "rgba(255,255,255,0.07)",
                  color: p.featured ? "#000000" : "var(--t2)",
                  border: `0.5px solid ${p.featured ? "#FFF" : "rgba(255,255,255,0.1)"}`,
                  transition: "opacity .15s",
                }}>
                  {p.cta} <ArrowRight size={13} />
                </button>
              </Link>
            </motion.div>
          ))}
        </div>

        <p style={{ textAlign: "center", fontSize: 13, color: "var(--t5)", marginTop: 28 }}>
          Free plan always available · No credit card required ·{" "}
          <Link href="/pricing" style={{ color: "var(--t4)" }}>See full comparison →</Link>
        </p>
      </div>
    </section>
  );
}
