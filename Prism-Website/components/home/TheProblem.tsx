"use client";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";

export default function TheProblem() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} style={{ background: "var(--bg-3)", padding: "6rem 0", borderTop: "1px solid var(--border)" }}>
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: .5 }}
          style={{ maxWidth: 640, marginBottom: 56 }}>
          <p className="section-label" style={{ marginBottom: 14 }}>The problem</p>
          <h2 style={{ marginBottom: 16 }}>Most users never finish onboarding. You don&apos;t know why.</h2>
          <p style={{ fontSize: 17, color: "var(--text-4)", lineHeight: 1.7 }}>
            You have analytics. You have heatmaps. You have support tickets. None of them tell you what a
            confused user actually said right before they left. Prism does.
          </p>
        </motion.div>

        {/* Stat row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 1, border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden", background: "var(--border)" }}>
          {[
            { num: "60%",  label: "of users never complete onboarding", sub: "industry average" },
            { num: "72%",  label: "of SaaS churn in first 30 days",    sub: "" },
            { num: "$25k", label: "avg cost per churned customer",      sub: "" },
          ].map((s, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: .1 + i * .1 }}
              style={{ background: "var(--bg)", padding: "32px 32px 36px" }}>
              <p style={{ fontFamily: "'Coolvetica', sans-serif", fontSize: 56, color: "var(--text-1)", letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 8 }}>{s.num}</p>
              <p style={{ fontSize: 15, color: "var(--text-2)", fontWeight: 500, lineHeight: 1.4, marginBottom: 4 }}>{s.label}</p>
              {s.sub && <p style={{ fontSize: 12, color: "var(--text-5)" }}>{s.sub}</p>}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
