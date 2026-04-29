"use client";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { MousePointer2, BarChart2, MessageSquare, BookOpen, Plug, Activity } from "lucide-react";

const features = [
  { icon: MousePointer2, title: "Live DOM Actions",     desc: "Fills forms, clicks buttons, navigates your app in the user's live session." },
  { icon: BarChart2,     title: "Friction Insights",   desc: "AI automatically flags the exact step where users are dropping off." },
  { icon: MessageSquare, title: "Question Clusters",   desc: "Every question users ask, grouped by intent and surfaced to your team." },
  { icon: BookOpen,      title: "Knowledge Base",      desc: "Hybrid BM25 + vector search over your docs. Never hallucinates." },
  { icon: Plug,          title: "MCP Connectors",      desc: "Connect any tool, API, or database via the Model Context Protocol." },
  { icon: Activity,      title: "Analytics",           desc: "Completion rates, drop-off funnels, and time-to-value — all in one view." },
];

export default function FeatureBento() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="features" ref={ref} className="section-stack section-pad-lg"
      style={{ background: "#000000" }}>
      <div className="container">
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 40, marginBottom: 52, flexWrap: "wrap" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: .6 }}>
            <p className="label" style={{ marginBottom: 16 }}>Platform</p>
            <h2 className="display-md" style={{ maxWidth: 380 }}>
              A complete onboarding platform.
            </h2>
          </motion.div>
          <motion.p initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: .2 }}
            className="body-md" style={{ maxWidth: 320, paddingTop: 44 }}>
            Everything you need to go from "users are churning" to "users are activating."
          </motion.p>
        </div>

        {/* Feature grid — Apple-style borderless with 1px gaps */}
        <div className="feature-grid">
          {features.map((f, i) => (
            <motion.div key={f.title}
              initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: .5, delay: .07 * i }}
              className="feature-cell">
              <div className="icon-box" style={{ marginBottom: 18 }}>
                <f.icon size={17} color="var(--t3)" strokeWidth={1.5} />
              </div>
              <h3 className="headline" style={{ fontSize: 16, marginBottom: 10 }}>{f.title}</h3>
              <p className="body-sm">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
