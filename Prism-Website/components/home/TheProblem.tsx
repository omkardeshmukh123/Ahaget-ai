"use client";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import CountUp from "react-countup";

const stats = [
  { value: 60,    suffix: "%",  label: "of users never complete onboarding",   sub: "industry average" },
  { value: 72,    suffix: "%",  label: "of SaaS churn happens in first 30 days", sub: "" },
  { value: 25000, prefix: "$",  label: "average cost of replacing one churned customer", sub: "" },
];

export default function TheProblem() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative overflow-hidden" style={{ background: "var(--bg)", padding: "7rem 0" }}>
      {/* Grid */}
      <div className="absolute inset-0 bg-grid pointer-events-none" />

      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-64 rounded-full blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(124,58,237,.22) 0%, rgba(3,181,211,.08) 50%, transparent 80%)" }} />

      <div className="container relative z-10">
        {/* Label + headline */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: .6 }}
          className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-7"
            style={{ background: "rgba(124,58,237,.1)", border: "1px solid rgba(124,58,237,.3)" }}>
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#d2bbff" }}>
              The Problem With Onboarding Today
            </span>
          </div>

          <h2 style={{ letterSpacing: "-0.04em" }}>
            <span style={{ color: "#e4e1e9" }}>Most users never finish onboarding.</span>
            <br />
            <span style={{ color: "#958da1", fontWeight: 600, fontSize: "0.75em" }}>You don&apos;t know why. Neither do they.</span>
          </h2>
        </motion.div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-14">
          {stats.map((stat, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: .6, delay: .15 + i * .12 }}
              className="glass-prism rounded-2xl p-10 flex flex-col items-center text-center">
              {/* Big number */}
              <div className="text-6xl md:text-7xl font-black mb-3 tabular-nums"
                style={{ background: "linear-gradient(135deg, #7C3AED 0%, #03B5D3 100%)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                  letterSpacing: "-0.04em" }}>
                {stat.prefix ?? ""}
                {inView
                  ? <CountUp end={stat.value} duration={2.4} separator="," delay={.3 + i * .15} />
                  : "0"}
                {stat.suffix ?? ""}
              </div>
              <p className="font-semibold text-lg leading-snug mb-1" style={{ color: "#e4e1e9" }}>{stat.label}</p>
              {stat.sub && <p className="text-sm" style={{ color: "#958da1" }}>{stat.sub}</p>}
            </motion.div>
          ))}
        </div>

        {/* Punchline */}
        <motion.p initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: .7, duration: .6 }}
          className="text-center text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: "#958da1" }}>
          You have analytics. You have heatmaps. You have support tickets.
          None of them tell you what a confused user{" "}
          <em style={{ color: "#e4e1e9", fontStyle: "normal", fontWeight: 600 }}>actually said</em>{" "}
          right before they left.{" "}
          <strong style={{ background: "linear-gradient(90deg,#d2bbff,#4cd7f6)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", fontWeight: 700 }}>
            Prism does.
          </strong>
        </motion.p>
      </div>
    </section>
  );
}
