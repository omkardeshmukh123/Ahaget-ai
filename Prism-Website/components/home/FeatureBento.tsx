"use client";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { MousePointer2, BarChart2, MessageSquare, BookOpen, Plug, Activity } from "lucide-react";

const features = [
  { icon: MousePointer2, title: "Live Actions", desc: "Fills forms, clicks buttons, navigates your UI in the user's actual browser session." },
  { icon: BarChart2,     title: "Insights",     desc: "Flags friction points and drop-off nodes automatically. No manual analytics setup." },
  { icon: MessageSquare, title: "Questions",    desc: "Clusters user questions by intent so you know exactly what to document next." },
  { icon: BookOpen,      title: "Knowledge Base", desc: "Hybrid BM25 + vector search over your docs. Always accurate, never hallucinated." },
  { icon: Plug,          title: "MCP Connectors", desc: "Connect any tool, API, or database via the Model Context Protocol." },
  { icon: Activity,      title: "Analytics",   desc: "Real-time completion rates, drop-off steps, time-to-value — all in one dashboard." },
];

export default function FeatureBento() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="features" ref={ref} style={{ background: "var(--bg)", padding: "6rem 0", borderTop: "1px solid var(--border)" }}>
      <div className="container">
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 40, marginBottom: 56, flexWrap: "wrap" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: .5 }}>
            <p className="section-label" style={{ marginBottom: 14 }}>Platform</p>
            <h2 style={{ maxWidth: 400 }}>
              A complete platform for AI-powered onboarding.
            </h2>
          </motion.div>
          <motion.p initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: .2 }}
            style={{ fontSize: 16, color: "var(--text-4)", maxWidth: 320, paddingTop: 40 }}>
            Everything you need to go from "users are churning" to "users are activating" — in one product.
          </motion.p>
        </div>

        {/* Feature grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 1, border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden", background: "var(--border)" }}>
          {features.map((f, i) => (
            <motion.div key={f.title}
              initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: .4, delay: .08 * i }}
              style={{ background: "var(--bg)", padding: "28px 28px 32px", transition: "background .15s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--surface)")}
              onMouseLeave={e => (e.currentTarget.style.background = "var(--bg)")}
            >
              <div className="icon-box" style={{ marginBottom: 16 }}>
                <f.icon size={16} color="var(--text-3)" />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-1)", marginBottom: 8, fontFamily: "'Inter', sans-serif", letterSpacing: "-0.01em" }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: "var(--text-4)", lineHeight: 1.65 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
