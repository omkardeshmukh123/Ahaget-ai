"use client";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Monitor, BookOpen, Clock, Plug, User, Sparkles } from "lucide-react";

const sources = [
  { icon: Monitor,   label: "Page content",  desc: "Reads every visible element in real time — fields, buttons, values, errors." },
  { icon: BookOpen,  label: "Knowledge base", desc: "Your docs and help articles, instantly retrieved, never hallucinated." },
  { icon: Clock,     label: "User history",   desc: "What the user has said and done across sessions." },
  { icon: Plug,      label: "MCP / API data", desc: "Live backend data via MCP servers or direct API calls." },
  { icon: User,      label: "User data",      desc: "Plan, role, segment — passed via the script tag config." },
];

export default function AgentContext() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section ref={ref} style={{ background: "var(--bg)", padding: "6rem 0", borderTop: "1px solid var(--border)" }}>
      <div className="container">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 64, alignItems: "start" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: .5 }}>
            <p className="section-label" style={{ marginBottom: 14 }}>Intelligence</p>
            <h2 style={{ marginBottom: 16 }}>What the agent sees.</h2>
            <p style={{ fontSize: 16, color: "var(--text-4)", lineHeight: 1.7 }}>
              Prism isn&apos;t guessing. It reads five live context streams before every response.
              Guidance is always accurate and specific to that user, on that page, right now.
            </p>
          </motion.div>

          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden", background: "var(--border)" }}>
              {sources.map((s, i) => (
                <motion.div key={s.label}
                  initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: .08 * i, duration: .4 }}
                  style={{ background: "var(--bg)", padding: "24px", transition: "background .15s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--surface)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "var(--bg)")}
                >
                  <div className="icon-box" style={{ marginBottom: 12 }}>
                    <s.icon size={15} color="var(--text-3)" />
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", marginBottom: 6, fontFamily: "'Inter', sans-serif" }}>{s.label}</p>
                  <p style={{ fontSize: 13, color: "var(--text-4)", lineHeight: 1.6 }}>{s.desc}</p>
                </motion.div>
              ))}

              {/* Output tile */}
              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: .4, duration: .4 }}
                style={{ background: "var(--surface-2)", padding: "24px", border: "none" }}
              >
                <div className="icon-box" style={{ marginBottom: 12, borderColor: "rgba(124,58,237,.3)", background: "rgba(124,58,237,.06)" }}>
                  <Sparkles size={15} color="var(--text-3)" />
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", marginBottom: 6, fontFamily: "'Inter', sans-serif" }}>All five, every turn.</p>
                <p style={{ fontSize: 13, color: "var(--text-4)", lineHeight: 1.6 }}>
                  Every response combines all streams. No stale context, no guessing.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
