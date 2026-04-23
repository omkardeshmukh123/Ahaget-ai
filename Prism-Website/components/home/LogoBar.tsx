"use client";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const logos = [
  { name: "Acme Corp",  color: "#7C3AED" },
  { name: "TechFlow",   color: "#03B5D3" },
  { name: "BuildFast",  color: "#D946EF" },
  { name: "DataSync",   color: "#7C3AED" },
  { name: "LaunchPad",  color: "#03B5D3" },
  { name: "GrowthOS",   color: "#a78bfa" },
  { name: "NexaHQ",     color: "#4cd7f6" },
  { name: "PivotLab",   color: "#7C3AED" },
  { name: "CoreStack",  color: "#03B5D3" },
  { name: "FluxAI",     color: "#D946EF" },
];

const testimonials = [
  {
    quote: "Prism cut our time-to-value from 14 days to 2. The AI agent handles questions we never even wrote docs for.",
    name: "Sarah Chen", role: "Head of Growth", company: "TechFlow",
    avatar: "SC",
  },
  {
    quote: "Setup took 4 minutes. Activation rate up 38%. Support tickets from new users dropped 60%.",
    name: "Marcus Rivera", role: "VP Product", company: "BuildFast",
    avatar: "MR",
  },
];

export default function LogoBar() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const track = [...logos, ...logos];

  return (
    <section ref={ref} style={{ background: "var(--bg-dim)", padding: "4rem 0", borderTop: "1px solid rgba(74,68,85,.15)", borderBottom: "1px solid rgba(74,68,85,.15)" }}>
      {/* Label */}
      <motion.p initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: .5 }}
        className="text-center text-xs font-bold uppercase tracking-widest mb-8"
        style={{ color: "#4a4455", letterSpacing: ".12em" }}>
        Trusted by teams at
      </motion.p>

      {/* Marquee */}
      <div className="relative overflow-hidden mb-14">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to right, var(--bg-dim), transparent)" }} />
        <div className="absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to left, var(--bg-dim), transparent)" }} />

        <div className="flex gap-10 animate-marquee" style={{ width: "max-content" }}>
          {track.map((logo, i) => (
            <div key={i} className="flex items-center gap-2.5 flex-shrink-0 cursor-default select-none">
              <div className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-black"
                style={{ background: logo.color, opacity: .7 }}>
                {logo.name[0]}
              </div>
              <span className="text-sm font-semibold whitespace-nowrap" style={{ color: "#4a4455" }}>
                {logo.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: .3 + i * .12, duration: .6 }}
              className="glass-prism rounded-2xl p-7">
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, j) => (
                  <span key={j} style={{ color: "#7C3AED", fontSize: 14 }}>★</span>
                ))}
              </div>
              <p className="text-sm leading-relaxed mb-5 italic" style={{ color: "#ccc3d8" }}>
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: "linear-gradient(135deg,#7C3AED,#03B5D3)", color: "#ede0ff" }}>
                  {t.avatar}
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: "#e4e1e9" }}>{t.name}</p>
                  <p className="text-xs" style={{ color: "#958da1" }}>{t.role} · {t.company}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
