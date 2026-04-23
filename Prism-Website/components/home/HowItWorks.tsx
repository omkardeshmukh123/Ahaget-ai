"use client";
import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Copy, Check, MousePointer, Layers, BarChart2 } from "lucide-react";

const snippet = `<script>
  window.PrismConfig = {
    apiKey: "YOUR_KEY",
    userId: "{{user.id}}"
  };
</script>
<script src="https://cdn.useprism.ai/widget.js" async></script>`;

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "#0e0e13", border: "1px solid rgba(74,68,85,.3)" }}>
      <div className="flex items-center justify-between px-4 py-2.5"
        style={{ background: "rgba(124,58,237,.06)", borderBottom: "1px solid rgba(74,68,85,.2)" }}>
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full" style={{ background: "#ff5f57" }} />
          <span className="w-3 h-3 rounded-full" style={{ background: "#febc2e" }} />
          <span className="w-3 h-3 rounded-full" style={{ background: "#28c840" }} />
        </div>
        <button onClick={copy} className="flex items-center gap-1.5 text-xs transition-colors"
          style={{ color: "#958da1" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#d2bbff")}
          onMouseLeave={e => (e.currentTarget.style.color = "#958da1")}>
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="p-5 text-sm overflow-x-auto font-mono leading-relaxed" style={{ color: "#ccc3d8" }}>
        <code dangerouslySetInnerHTML={{ __html: code
          .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
          .replace(/(&lt;script&gt;|&lt;\/script&gt;|&lt;script[^&]*&gt;)/g, `<span style="color:#d2bbff">$1</span>`)
          .replace(/(window\.PrismConfig|apiKey|userId)/g, `<span style="color:#4cd7f6">$1</span>`)
          .replace(/"([^"]+)"/g, `<span style="color:#7C3AED">"$1"</span>`)
        }} />
      </pre>
    </div>
  );
}

const steps = [
  {
    n: "01", label: "Install", icon: Layers,
    title: "2 lines of code. That's it.",
    desc: "Paste into your app's <head>. Works with React, Next.js, Vue, plain HTML — anything that runs JavaScript.",
    content: <CodeBlock code={snippet} />,
  },
  {
    n: "02", label: "Build", icon: MousePointer,
    title: "Build your flow visually.",
    desc: "Drag steps, set AI prompts, configure actions. No-code builder — deploy changes without a release.",
    content: (
      <div className="rounded-xl overflow-hidden" style={{ background: "#0e0e13", border: "1px solid rgba(74,68,85,.3)" }}>
        <div className="px-4 py-2.5 flex items-center gap-2"
          style={{ background: "rgba(124,58,237,.06)", borderBottom: "1px solid rgba(74,68,85,.2)" }}>
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ background: "#ff5f57" }} />
            <span className="w-3 h-3 rounded-full" style={{ background: "#febc2e" }} />
            <span className="w-3 h-3 rounded-full" style={{ background: "#28c840" }} />
          </div>
          <span className="text-xs font-medium" style={{ color: "#4a4455" }}>Flow Builder — Prism Dashboard</span>
        </div>
        <div className="p-5 space-y-2.5">
          {[
            { label: "Connect data source", done: true },
            { label: "Verify integration",  active: true },
            { label: "Create first resource", done: false },
            { label: "Complete setup", done: false },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium"
              style={step.active
                ? { background: "rgba(124,58,237,.12)", border: "1px solid rgba(124,58,237,.3)", color: "#d2bbff" }
                : step.done
                  ? { background: "rgba(74,222,128,.06)", border: "1px solid rgba(74,222,128,.15)", color: "#4ade80" }
                  : { background: "rgba(31,31,37,.6)", border: "1px solid rgba(74,68,85,.2)", color: "#4a4455" }
              }>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                style={step.active
                  ? { background: "rgba(124,58,237,.3)", color: "#d2bbff" }
                  : step.done
                    ? { background: "rgba(74,222,128,.2)", color: "#4ade80" }
                    : { background: "rgba(74,68,85,.2)", color: "#4a4455" }
                }>
                {step.done ? "✓" : i + 1}
              </div>
              {step.label}
              {step.active && (
                <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold"
                  style={{ background: "rgba(124,58,237,.2)", color: "#a78bfa" }}>Active</span>
              )}
            </div>
          ))}
          <button className="w-full py-2.5 text-sm rounded-xl mt-1"
            style={{ border: "1px dashed rgba(74,68,85,.4)", color: "#4a4455" }}>
            + Add step
          </button>
        </div>
      </div>
    ),
  },
  {
    n: "03", label: "Watch", icon: BarChart2,
    title: "Watch it work in real time.",
    desc: "See live conversations in your dashboard. Step completions tick in real time. Insights surface drop-off patterns automatically.",
    content: (
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl p-4 space-y-3" style={{ background: "#0e0e13", border: "1px solid rgba(124,58,237,.2)" }}>
          <p className="text-xs font-medium" style={{ color: "#4a4455" }}>Your user sees →</p>
          <div className="rounded-xl p-3 space-y-2" style={{ background: "rgba(31,31,37,.8)", border: "1px solid rgba(74,68,85,.2)" }}>
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-5 h-5 rounded-md" style={{ background: "linear-gradient(135deg,#7C3AED,#03B5D3)" }} />
              <span className="text-xs font-semibold" style={{ color: "#e4e1e9" }}>Prism</span>
            </div>
            <div className="rounded-lg px-3 py-2 text-xs" style={{ background: "rgba(74,68,85,.2)", color: "#ccc3d8" }}>
              Click Settings → Integrations
            </div>
            <motion.div animate={{ scale: [1, 1.03, 1] }} transition={{ repeat: Infinity, duration: 2 }}
              className="rounded-lg px-3 py-2 text-xs text-center font-semibold"
              style={{ background: "linear-gradient(135deg,#7C3AED,#03B5D3)", color: "#ede0ff" }}>
              → Go to Integrations
            </motion.div>
          </div>
        </div>
        <div className="rounded-xl p-4 space-y-3" style={{ background: "#0e0e13", border: "1px solid rgba(3,181,211,.2)" }}>
          <p className="text-xs font-medium" style={{ color: "#4a4455" }}>You see →</p>
          <div className="space-y-2">
            {["Step 1", "Step 2", "Step 3"].map((s, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                style={i < 2
                  ? { background: "rgba(74,222,128,.08)", color: "#4ade80" }
                  : { background: "rgba(74,68,85,.1)", color: "#4a4455" }
                }>
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={i < 2 ? { background: "#4ade80", color: "#0e0e13" } : { background: "rgba(74,68,85,.3)" }}>
                  {i < 2 ? "✓" : ""}
                </span>
                {s} {i < 2 ? "complete" : "pending"}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
];

export default function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [active, setActive] = useState(0);

  return (
    <section ref={ref} style={{ background: "var(--bg-dim)", padding: "7rem 0", borderTop: "1px solid rgba(74,68,85,.15)" }}>
      <div className="container">
        {/* Heading */}
        <div className="text-center mb-14">
          <motion.p initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: .5 }}
            className="eyebrow mb-4">How It Works</motion.p>
          <motion.h2 initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: .1 }}>
            Three steps. Zero configuration.
          </motion.h2>
        </div>

        {/* Step tabs */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: .2 }}
          className="flex gap-3 justify-center mb-10 flex-wrap">
          {steps.map((step, i) => (
            <button key={i} onClick={() => setActive(i)}
              className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
              style={active === i
                ? { background: "linear-gradient(135deg,#7C3AED,#03B5D3)", color: "#ede0ff", boxShadow: "0 0 24px rgba(124,58,237,.4)" }
                : { background: "rgba(31,31,37,.6)", color: "#958da1", border: "1px solid rgba(74,68,85,.3)" }}>
              <span className="text-xs font-bold opacity-60">{step.n}</span>
              {step.label}
            </button>
          ))}
        </motion.div>

        {/* Content panel */}
        <AnimatePresence mode="wait">
          <motion.div key={active}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: .35 }}
            className="glass-prism rounded-3xl p-8 md:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-10 items-center">
              <div>
                <div className="text-8xl font-black leading-none mb-5 select-none"
                  style={{ background: "linear-gradient(135deg,rgba(124,58,237,.15),rgba(3,181,211,.1))",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  {steps[active].n}
                </div>
                <h3 className="text-2xl font-black mb-3" style={{ color: "#e4e1e9" }}>{steps[active].title}</h3>
                <p className="leading-relaxed" style={{ color: "#958da1" }}>{steps[active].desc}</p>
              </div>
              <div>{steps[active].content}</div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
