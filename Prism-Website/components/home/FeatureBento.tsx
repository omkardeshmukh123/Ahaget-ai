"use client";
import { useRef, useState, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { MousePointer2, LightbulbIcon, MessageSquare, Search, Database, Settings, BarChart2, Link as LinkIcon, FolderOpen, Plus } from "lucide-react";

function LiveDOMCard() {
  const [step, setStep] = useState(0);
  const actions = [
    { label: "Locating input field...", color: "#03B5D3" },
    { label: "Typing connection string", color: "#7C3AED" },
    { label: "Clicking 'Connect'", color: "#a78bfa" },
    { label: "✓ Integration verified!", color: "#4ade80" },
  ];
  useEffect(() => {
    const t = setInterval(() => setStep(s => (s + 1) % actions.length), 2000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "#0e0e13", border: "1px solid rgba(74,68,85,.3)" }}>
      <div className="flex items-center gap-2 px-4 py-2" style={{ background: "rgba(74,68,85,.1)", borderBottom: "1px solid rgba(74,68,85,.2)" }}>
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#ff5f57" }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#febc2e" }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#28c840" }} />
        </div>
        <span className="text-xs ml-2" style={{ color: "#4a4455" }}>Your App — Database Setup</span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#7C3AED" }} />
          <span className="text-[10px]" style={{ color: "#a78bfa" }}>AI Active</span>
        </div>
      </div>
      <div className="p-4 space-y-2.5">
        {["Host / Port", "Database Name", "Username"].map((label, i) => (
          <div key={i}>
            <p className="text-[10px] mb-1" style={{ color: "#4a4455" }}>{label}</p>
            <div className="h-8 rounded-lg px-3 flex items-center" style={{
              background: "rgba(31,31,37,.8)",
              border: `1px solid ${i === 1 ? "rgba(3,181,211,.5)" : "rgba(74,68,85,.3)"}`,
              boxShadow: i === 1 ? "0 0 0 2px rgba(3,181,211,.1)" : "none"
            }}>
              {i === 1 && <>
                <span className="text-xs font-mono" style={{ color: "#4cd7f6" }}>postgres.internal:5432</span>
                <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: .8 }}
                  className="ml-0.5 inline-block w-0.5 h-3.5" style={{ background: "#4cd7f6" }} />
              </>}
            </div>
          </div>
        ))}
        <div className="mt-3 px-3 py-2 rounded-lg text-xs flex items-center gap-2"
          style={{ background: "rgba(124,58,237,.08)", border: "1px solid rgba(124,58,237,.2)" }}>
          <MousePointer2 className="w-3 h-3 flex-shrink-0" style={{ color: actions[step].color }} />
          <motion.span key={step} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: actions[step].color, fontFamily: "monospace" }}>
            {actions[step].label}
          </motion.span>
        </div>
      </div>
    </div>
  );
}

function InsightsCard() {
  const lines = [
    { text: "> Analyzing drop-off at node 4...", color: "#4a4455" },
    { text: "> Friction detected: API Setup step", color: "#f87171" },
    { text: "> 42% of users abandoning here.", color: "#fbbf24" },
    { text: "> Rec: proactive agent assist.", color: "#4ade80" },
  ];
  return (
    <div className="bento-card h-full flex flex-col" style={{ borderTop: "2px solid #f43f5e" }}>
      <div className="absolute bottom-0 right-0 w-40 h-40 rounded-full blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(244,63,94,.12) 0%, transparent 70%)" }} />
      <div className="relative z-10 p-6 flex flex-col flex-1">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: "#f87171" }}>
          <LightbulbIcon className="w-3 h-3" /> Insights
        </p>
        <h3 className="text-lg font-black mb-3 leading-snug" style={{ color: "#e4e1e9" }}>
          Issues flagged. Gaps suggested. <span style={{ color: "#f87171" }}>Automatically.</span>
        </h3>
        <div className="rounded-xl flex-1" style={{ background: "#0e0e13", border: "1px solid rgba(74,68,85,.3)", fontFamily: "monospace" }}>
          <div className="px-3 py-2" style={{ borderBottom: "1px solid rgba(74,68,85,.2)" }}>
            <span className="text-[10px]" style={{ color: "#4a4455" }}>prism — analysis_</span>
          </div>
          <div className="p-3 space-y-1.5">
            {lines.map((l, i) => (
              <motion.p key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .5 + i * .3 }}
                className="text-xs leading-relaxed" style={{ color: l.color }}>{l.text}</motion.p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestionsCard() {
  const qs = ["How do I connect Postgres?", "Where's my API key?", "What's an MTU?", "Can I use GraphQL?", "How to test locally?"];
  return (
    <div className="bento-card h-full" style={{ borderTop: "2px solid #4ade80" }}>
      <div className="absolute bottom-0 right-0 w-40 h-40 rounded-full blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(74,222,128,.1) 0%, transparent 70%)" }} />
      <div className="relative z-10 p-6">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: "#4ade80" }}>
          <MessageSquare className="w-3 h-3" /> Questions
        </p>
        <h3 className="text-lg font-black mb-4 leading-snug" style={{ color: "#e4e1e9" }}>
          Every question users ask, <span style={{ color: "#4ade80" }}>in their own words.</span>
        </h3>
        <div className="flex flex-wrap gap-2">
          {qs.map((q, i) => (
            <motion.span key={i} initial={{ opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .3 + i * .08 }}
              className="text-xs px-3 py-1.5 rounded-full"
              style={{ background: "rgba(74,222,128,.08)", border: "1px solid rgba(74,222,128,.2)", color: "#86efac" }}>
              {q}
            </motion.span>
          ))}
        </div>
      </div>
    </div>
  );
}

function KnowledgeCard() {
  return (
    <div className="bento-card h-full" style={{ borderTop: "2px solid #7C3AED" }}>
      <div className="absolute bottom-0 right-0 w-40 h-40 rounded-full blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(124,58,237,.18) 0%, transparent 70%)" }} />
      <div className="relative z-10 p-6">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#a78bfa" }}>Knowledge Base</p>
        <h3 className="text-lg font-black mb-4 leading-snug" style={{ color: "#e4e1e9" }}>
          The AI knows your product, <span style={{ color: "#a78bfa" }}>not just buttons.</span>
        </h3>
        <div className="rounded-xl p-3 space-y-2.5" style={{ background: "#0e0e13", border: "1px solid rgba(74,68,85,.3)" }}>
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ background: "rgba(31,31,37,.8)", border: "1px solid rgba(74,68,85,.2)" }}>
            <Search className="w-3 h-3 flex-shrink-0" style={{ color: "#7C3AED" }} />
            <span className="text-xs" style={{ color: "#4a4455" }}>&quot;How do I connect my Postgres DB?&quot;</span>
          </div>
          {["BM25", "Vector"].map((type, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[10px] font-bold w-12 flex-shrink-0" style={{ color: i === 0 ? "#7C3AED" : "#03B5D3" }}>{type}</span>
              <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(74,68,85,.3)" }}>
                <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: i === 0 ? "78%" : "65%" }}
                  transition={{ delay: .6 + i * .2, duration: .8 }}
                  style={{ background: i === 0 ? "linear-gradient(90deg,#7C3AED,#a78bfa)" : "linear-gradient(90deg,#03B5D3,#4cd7f6)" }} />
              </div>
            </div>
          ))}
          <div className="px-2 py-1.5 rounded-lg text-xs" style={{ background: "rgba(124,58,237,.08)", color: "#ccc3d8" }}>
            ✓ Best match: Postgres connection guide
          </div>
        </div>
      </div>
    </div>
  );
}

function MCPCard() {
  const connectors = [
    { icon: Database, name: "Your Database", desc: "MySQL, Postgres" },
    { icon: Settings, name: "Your API", desc: "REST, GraphQL, gRPC" },
    { icon: BarChart2, name: "CRM", desc: "Salesforce, HubSpot" },
    { icon: LinkIcon, name: "Webhooks", desc: "Event-driven" },
    { icon: FolderOpen, name: "Internal Tools", desc: "Retool, admin" },
    { icon: Plus, name: "Add your own", desc: "Configure custom", custom: true },
  ];
  return (
    <div className="bento-card h-full" style={{ borderTop: "2px solid #03B5D3" }}>
      <div className="absolute bottom-0 right-0 w-40 h-40 rounded-full blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(3,181,211,.12) 0%, transparent 70%)" }} />
      <div className="relative z-10 p-6">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#4cd7f6" }}>MCP Connectors</p>
        <h3 className="text-lg font-black mb-4 leading-snug" style={{ color: "#e4e1e9" }}>
          Give the AI tools, <span style={{ color: "#4cd7f6" }}>not just prompts.</span>
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {connectors.map((c, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-default"
              style={c.custom
                ? { border: "1px dashed rgba(74,68,85,.4)", color: "#4a4455" }
                : { background: "rgba(3,181,211,.06)", border: "1px solid rgba(3,181,211,.15)", color: "#ccc3d8" }}>
              <c.icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: c.custom ? "#4a4455" : "#4cd7f6" }} />
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">{c.name}</p>
                <p className="text-[10px] truncate" style={{ color: "#4a4455" }}>{c.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FeatureBento() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <section ref={ref} style={{ background: "var(--bg)", padding: "7rem 0", borderTop: "1px solid rgba(74,68,85,.15)" }}>
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: .6 }} className="mb-14">
          <p className="eyebrow mb-4">Everything you need</p>
          <h2>A complete platform <br />
            <span style={{ color: "#4a4455", fontWeight: 500, fontSize: ".7em" }}>for AI-powered onboarding.</span>
          </h2>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: .1 }}
            className="md:col-span-2 bento-card" style={{ borderTop: "2px solid #7C3AED", minHeight: 340 }}>
            <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(124,58,237,.18) 0%, transparent 70%)" }} />
            <div className="relative z-10 p-7">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#a78bfa" }}>Live Actions</p>
              <h3 className="text-2xl font-black mb-2 leading-tight" style={{ color: "#e4e1e9" }}>
                The AI doesn&apos;t just talk. <span style={{ color: "#a78bfa" }}>It acts.</span>
              </h3>
              <p className="text-sm mb-5" style={{ color: "#958da1" }}>
                Fills forms, clicks buttons, navigates UI in the user&apos;s live browser. 8 self-healing fallback strategies.
              </p>
              <LiveDOMCard />
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: .15 }} className="min-h-[300px]"><InsightsCard /></motion.div>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: .2 }} className="min-h-[280px]"><QuestionsCard /></motion.div>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: .25 }} className="min-h-[280px]"><KnowledgeCard /></motion.div>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: .3 }} className="min-h-[280px]"><MCPCard /></motion.div>
        </div>
      </div>
    </section>
  );
}
