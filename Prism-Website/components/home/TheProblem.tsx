"use client";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";

export default function TheProblem() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="section-stack section-pad-xl"
      style={{ background: "#000000" }}>
      <div className="container">
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <motion.p className="label" style={{ marginBottom: 20 }}
            initial={{ opacity: 0, y: 14 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: .55 }}>
            The Problem
          </motion.p>

          {/* Giant centered text — Apple style */}
          <motion.div initial={{ opacity: 0, y: 28 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: .7, delay: .1 }}>
            <h2 className="display-xl" style={{ marginBottom: 0, color: "var(--t1)" }}>
              Most users give up.
            </h2>
            <h2 className="display-xl" style={{ marginBottom: 32, color: "var(--t5)" }}>
              Before they ever succeed.
            </h2>
          </motion.div>

          <motion.p className="body-lg" style={{ maxWidth: 580, margin: "0 auto 72px" }}
            initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: .6, delay: .22 }}>
            You have analytics, heatmaps, and support tickets. None of them tell you what a
            confused user said right before they churned. Prism does.
          </motion.p>

          {/* Stats — 3 columns, lots of space */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1, background: "rgba(255,255,255,0.06)", borderRadius: 24, overflow: "hidden" }}>
            {[
              { n: "60%",  l: "of users never complete onboarding", sub: "industry average across B2B SaaS" },
              { n: "72%",  l: "of SaaS customers churn", sub: "in the first 30 days" },
              { n: "$25k", l: "average cost per churned user", sub: "CAC + lost revenue" },
            ].map((s, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: .35 + i * .1, duration: .6 }}
                style={{ background: "#000", padding: "40px 32px 44px", textAlign: "center" }}>
                <p className="stat-num" style={{ marginBottom: 10 }}>{s.n}</p>
                <p style={{ fontSize: 16, color: "var(--t2)", fontWeight: 500, lineHeight: 1.4, marginBottom: 8 }}>{s.l}</p>
                <p style={{ fontSize: 12, color: "var(--t5)" }}>{s.sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
