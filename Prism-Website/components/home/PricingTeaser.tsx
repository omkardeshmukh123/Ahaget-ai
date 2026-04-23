"use client";
import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import Link from "next/link";

const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "http://localhost:3001";

const plans = [
  { name: "Starter", price: 0,   mtu: "100 MTU/mo",   agents: "3 agents", active: false },
  { name: "Pro",     price: 49,  mtu: "2,500 MTU/mo", agents: "10 agents", active: true  },
  { name: "Scale",   price: 149, mtu: "10k MTU/mo",   agents: "Unlimited", active: false },
];

export default function PricingTeaser() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} style={{ background: "var(--bg-dim)", padding: "7rem 0", borderTop: "1px solid rgba(74,68,85,.15)" }}>
      <div className="container">
        <div className="text-center mb-14">
          <motion.p initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} className="eyebrow mb-4">Pricing</motion.p>
          <motion.h2 initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: .1 }}>
            Start free. Pay when you scale.
            <br />
            <span style={{ color: "#4a4455", fontWeight: 500, fontSize: ".65em" }}>No &ldquo;Contact Sales.&rdquo; No surprises.</span>
          </motion.h2>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-10">
          {plans.map((plan, i) => (
            <motion.div key={plan.name}
              initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: .15 + i * .1 }}
              className="relative rounded-2xl p-6 flex flex-col items-center text-center"
              style={plan.active
                ? { background: "rgba(124,58,237,.08)", border: "1px solid rgba(124,58,237,.4)", boxShadow: "0 0 40px rgba(124,58,237,.15)" }
                : { background: "var(--surface)", border: "1px solid rgba(74,68,85,.2)" }
              }>
              {plan.active && (
                <div className="absolute -top-3 px-3 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ background: "linear-gradient(135deg,#7C3AED,#03B5D3)", color: "#ede0ff" }}>
                  Most popular
                </div>
              )}
              <p className="text-sm font-bold mb-2"
                style={{ color: plan.active ? "#a78bfa" : "#958da1" }}>{plan.name}</p>
              <p className="text-3xl font-black mb-1" style={{ color: "#e4e1e9" }}>
                ${plan.price}<span className="text-sm font-normal" style={{ color: "#958da1" }}>/mo</span>
              </p>
              <p className="text-xs mb-1" style={{ color: "#958da1" }}>{plan.agents}</p>
              <p className="text-xs" style={{ color: "#4a4455" }}>{plan.mtu}</p>
              {plan.active && <div className="mt-3 w-full h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(124,58,237,.5),transparent)" }} />}
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/pricing">
            <button className="btn-primary">
              See full pricing <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
          <p className="text-sm mt-4" style={{ color: "#4a4455" }}>Free plan always available · No credit card required</p>
        </div>
      </div>
    </section>
  );
}
