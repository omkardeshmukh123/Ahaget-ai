"use client";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import CountUp from "react-countup";

const stats = [
  { value: 60, suffix: "%", label: "of users never complete onboarding", sub: "industry average" },
  { value: 72, suffix: "%", label: "of SaaS churn happens in the first 30 days", sub: "" },
  { value: 25000, prefix: "$", label: "average cost of replacing one churned customer", sub: "" },
];

export default function TheProblem() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-28 relative overflow-hidden" ref={ref} style={{ background: '#030306' }}>
      {/* Background grid */}
      <div className="absolute inset-0 bg-grid opacity-40" />
      {/* Gradient orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-64 rounded-full blur-3xl" style={{ background: 'rgba(139,92,246,0.15)' }} />
      <div className="absolute bottom-0 left-1/4 w-96 h-48 rounded-full blur-3xl" style={{ background: 'rgba(34,211,238,0.08)' }} />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Section label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-6" style={{ background: 'rgba(139,92,246,0.12)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.3)' }}>
            The problem with onboarding today
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight text-white">
            Most users never finish onboarding.
            <br />
            <span style={{ color: '#475569' }}>You don&apos;t know why. Neither do they.</span>
          </h2>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px rounded-3xl overflow-hidden" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.15)' }}>
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.12 }}
              className="p-10 flex flex-col items-center text-center transition-colors group" style={{ background: '#0d0d18' }}
            >
              {/* Big number */}
              <div className="text-6xl md:text-7xl font-black mb-3 tabular-nums" style={{ background: 'linear-gradient(135deg, #8B5CF6, #22D3EE)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {stat.prefix || ""}
                {inView ? (
                  <CountUp end={stat.value} duration={2.5} separator="," delay={0.4 + i * 0.15} />
                ) : "0"}
                {stat.suffix || ""}
              </div>
              <p className="font-semibold leading-snug text-lg mb-1 text-white">{stat.label}</p>
              {stat.sub && <p className="text-sm mt-1" style={{ color: '#475569' }}>{stat.sub}</p>}
            </motion.div>
          ))}
        </div>

        {/* Punchline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.7 }}
          className="text-center text-lg max-w-2xl mx-auto leading-relaxed mt-14" style={{ color: '#94A3B8' }}
        >
          You have analytics. You have heatmaps. You have support tickets.
          None of them tell you what a confused user <em style={{ color: '#fff' }}>actually said</em> right
          before they left. <strong style={{ color: '#A78BFA' }}>Prism does.</strong>
        </motion.p>
      </div>
    </section>
  );
}
