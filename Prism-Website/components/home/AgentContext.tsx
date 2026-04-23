"use client";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Monitor, BookOpen, Clock, Plug, User, Sparkles } from "lucide-react";

const sources = [
  { icon: Monitor,  label: "Page content",    desc: "Reads every element — fields, buttons, values, error states — in real time.", color: "#7C3AED" },
  { icon: BookOpen, label: "Knowledge base",  desc: "Your docs, FAQs, help articles. Referenced instantly, never hallucinated.", color: "#a78bfa" },
  { icon: Clock,    label: "User history",    desc: "What the user has done, said, and completed across sessions.", color: "#4ade80" },
  { icon: Plug,     label: "MCP / API data",  desc: "Live data from your backend via MCP servers or direct API calls.", color: "#4cd7f6" },
  { icon: User,     label: "User data",       desc: "Plan, role, segment — anything you pass via the script tag.", color: "#fbbf24" },
];

export default function AgentContext() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section ref={ref} style={{ background: "var(--bg-dim)", padding: "7rem 0", borderTop: "1px solid rgba(74,68,85,.15)" }}>
      {/* Ambient glow */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(124,58,237,.12) 0%, transparent 70%)" }} />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Heading */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: .5 }} className="mb-14 max-w-2xl">
          <p className="eyebrow mb-4">Intelligence Layer</p>
          <h2 className="mb-4" style={{ letterSpacing: "-0.04em" }}>What the agent sees.</h2>
          <p className="text-lg leading-relaxed" style={{ color: "#958da1" }}>
            Prism isn&apos;t guessing. It reads five live context streams before every response — so guidance is
            always accurate and specific to that user, on that page, right now.
          </p>
        </motion.div>

        {/* Context grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sources.map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: .45, delay: .1 + i * .08 }}
              className="relative rounded-2xl p-6 overflow-hidden group transition-all duration-300"
              style={{ background: "var(--surface)", border: "1px solid rgba(74,68,85,.2)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${s.color}40`; (e.currentTarget as HTMLElement).style.background = "var(--surface-high)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(74,68,85,.2)"; (e.currentTarget as HTMLElement).style.background = "var(--surface)"; }}
            >
              <div className="absolute top-0 left-0 w-40 h-40 blur-3xl opacity-30 pointer-events-none rounded-full"
                style={{ background: `radial-gradient(circle, ${s.color}33 0%, transparent 70%)` }} />
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl mb-4"
                  style={{ background: `${s.color}15`, border: `1px solid ${s.color}35` }}>
                  <s.icon className="w-4 h-4" style={{ color: s.color }} />
                </div>
                <h3 className="font-bold text-base mb-2" style={{ color: "#e4e1e9" }}>{s.label}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#958da1" }}>{s.desc}</p>
              </div>
            </motion.div>
          ))}

          {/* Sixth tile — the AI output */}
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: .45, delay: .1 + sources.length * .08 }}
            className="relative rounded-2xl p-6 overflow-hidden sm:col-span-2 lg:col-span-1"
            style={{ background: "rgba(124,58,237,.08)", border: "1px solid rgba(124,58,237,.35)" }}>
            <div className="absolute top-0 left-0 w-56 h-56 blur-3xl pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(124,58,237,.2) 0%, transparent 70%)" }} />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 mb-4"
                style={{ background: "rgba(124,58,237,.15)", border: "1px solid rgba(124,58,237,.3)" }}>
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                <span className="text-xs font-bold" style={{ color: "#d2bbff" }}>Prism Agent</span>
              </div>
              <h3 className="font-bold text-base mb-2" style={{ color: "#e4e1e9" }}>All five, every turn.</h3>
              <p className="text-sm leading-relaxed" style={{ color: "#958da1" }}>
                Every response combines all five streams. No stale context, no guessing, no hallucinated instructions.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
