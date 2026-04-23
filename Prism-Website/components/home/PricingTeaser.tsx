"use client";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";

const plans = [
  { name: "Free", price: 0, agents: "3 agents", mtu: "100 MTU", active: true },
  { name: "Starter", price: 99, agents: "10 agents", mtu: "1,000 MTU" },
  { name: "Growth", price: 299, agents: "Unlimited", mtu: "10,000 MTU" },
  { name: "Scale", price: 999, agents: "Unlimited", mtu: "Unlimited MTU" },
];

export default function PricingTeaser() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-24" ref={ref} style={{ background: 'var(--cream)' }}>
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <motion.p initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }} className="eyebrow mb-4">
            Pricing
          </motion.p>
          <motion.h2 initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.1 }} className="text-4xl md:text-5xl font-bold" style={{ color: '#6B403C' }}>
            Start free. Pay when you scale.
            <br /><span className="font-normal" style={{ color: '#9B6560' }}>No &ldquo;Contact Sales.&rdquo; No surprises.</span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 + i * 0.08 }}
              className={`p-5 rounded-2xl border text-center transition-all ${
                plan.active
                  ? "shadow-brand-sm"
                  : ""
              }
              style={!plan.active ? { border: '1px solid rgba(107,64,60,0.15)' } : {}}
              }`}
              style={plan.active ? { border: '1px solid rgba(255,133,122,0.5)', background: 'rgba(255,133,122,0.06)' } : {}}
            >
              <p className={`text-sm font-semibold mb-2`} style={{ color: plan.active ? '#FF857A' : '#6B403C' }}>{plan.name}</p>
              <p className="text-3xl font-black mb-1" style={{ color: '#6B403C' }}>${plan.price}<span className="text-base font-normal" style={{ color: '#9B6560' }}>/mo</span></p>
              <p className="text-xs mb-1" style={{ color: '#9B6560' }}>{plan.agents}</p>
              <p className="text-xs" style={{ color: '#9B6560' }}>{plan.mtu}</p>
              {plan.active && <div className="mt-3 w-full h-0.5 bg-brand/20 rounded-full" />}
            </motion.div>
          ))}
        </div>

        <div className="text-center">
          <Link href="/pricing" className="inline-flex items-center gap-2 text-brand font-semibold hover:text-brand-dark transition-colors">
            See full pricing →
          </Link>
        </div>
      </div>
    </section>
  );
}
