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
    <section ref={ref} className="section-stack section-pad-xl"
      style={{ background: "var(--dark-1)" }}>
      <div className="container-sm" style={{ textAlign: "center" }}>
        <motion.div initial={{ opacity: 0, y: 28 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: .7, ease: [0.22, 1, 0.36, 1] }}>
          <h2 className="display-xl" style={{ marginBottom: 24 }}>
            Stop losing users<br />to broken onboarding.
          </h2>
          <p className="body-lg" style={{ maxWidth: 520, margin: "0 auto 44px" }}>
            Join hundreds of SaaS teams using Prism to guide users autonomously.
            2 lines of code. No engineers required for updates.
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
            <Link href={DASHBOARD_URL}>
              <button className="btn-primary" style={{ fontSize: 17, padding: "15px 34px" }}>
                Start for free <ArrowRight size={16} />
              </button>
            </Link>
            <Link href="/pricing">
              <button className="btn-ghost" style={{ fontSize: 16, padding: "14px 30px" }}>
                See pricing
              </button>
            </Link>
          </div>
          <p style={{ fontSize: 13, color: "var(--t5)" }}>Free plan forever · No credit card needed</p>
        </motion.div>
      </div>
    </section>
  );
}
