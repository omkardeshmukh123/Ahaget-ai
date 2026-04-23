"use client";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "http://localhost:3001";

export default function FinalCTA() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} style={{ background: "var(--bg-2)", padding: "6rem 0", borderTop: "1px solid var(--border)" }}>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: .5 }}
          style={{
            background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8,
            padding: "56px 64px",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 48, flexWrap: "wrap",
          }}
        >
          <div style={{ flex: "1 1 340px" }}>
            <h2 style={{ marginBottom: 14 }}>Stop losing users to<br />broken onboarding.</h2>
            <p style={{ fontSize: 17, color: "var(--text-4)", lineHeight: 1.7 }}>
              Join hundreds of SaaS teams using Prism to guide users autonomously.
              2 lines of code. No engineers required.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, flexShrink: 0 }}>
            <Link href={DASHBOARD_URL}>
              <button className="btn-primary" style={{ padding: "13px 28px", fontSize: 16 }}>
                Start for free <ArrowRight size={16} />
              </button>
            </Link>
            <Link href="/pricing">
              <button className="btn-ghost" style={{ padding: "12px 28px", fontSize: 15, width: "100%" }}>
                See pricing
              </button>
            </Link>
            <p style={{ fontSize: 12, color: "var(--text-5)", textAlign: "center" }}>No credit card needed</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
