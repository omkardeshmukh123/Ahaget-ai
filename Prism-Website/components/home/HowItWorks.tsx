"use client";
import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Copy, Check } from "lucide-react";

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
    <div className="relative group rounded-xl overflow-hidden" style={{ background: '#0a0a12', border: '1px solid rgba(139,92,246,0.2)' }}>
      <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid rgba(139,92,246,0.1)', background: 'rgba(139,92,246,0.05)' }}>
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-400/60" />
          <span className="w-3 h-3 rounded-full bg-yellow-400/60" />
          <span className="w-3 h-3 rounded-full bg-green-400/60" />
        </div>
        <button onClick={copy} className="flex items-center gap-1.5 text-xs transition-colors" style={{ color: '#475569' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#A78BFA')}
          onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="p-5 text-sm overflow-x-auto font-mono" style={{ color: '#e2d9f3', lineHeight: 1.75 }}><code>{code}</code></pre>
    </div>
  );
}

const steps = [
  {
    n: "01",
    label: "Install",
    title: "2 lines of code. That's it.",
    desc: "Paste into your app's <head>. Works with React, Next.js, Vue, plain HTML — anything that runs JavaScript.",
    content: <CodeBlock code={snippet} />,
  },
  {
    n: "02",
    label: "Build",
    title: "Build your flow visually.",
    desc: "Drag steps, set AI prompts, configure actions. No-code builder — deploy changes without a release.",
    content: (
      <div className="rounded-2xl overflow-hidden shadow-lg" style={{ background: '#0a0a12', border: '1px solid rgba(139,92,246,0.2)' }}>
        <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: '#12121f', borderBottom: '1px solid rgba(139,92,246,0.12)' }}>
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-400/60" />
            <span className="w-3 h-3 rounded-full bg-yellow-400/60" />
            <span className="w-3 h-3 rounded-full bg-green-400/60" />
          </div>
          <span style={{ color: 'rgba(148,163,184,0.6)', fontSize: '12px', marginLeft: '8px' }}>Flow Builder — Prism Dashboard</span>
        </div>
        <div className="p-6 space-y-3">
          {["Connect data source", "Verify integration", "Create first resource", "Complete setup"].map((step, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl text-sm font-medium"
              style={i === 1
                ? { background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.35)', color: '#A78BFA' }
                : i < 1
                  ? { background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)', color: '#4ADE80' }
                  : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.08)', color: '#475569' }
              }
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={i < 1
                  ? { background: 'rgba(74,222,128,0.2)', color: '#4ADE80' }
                  : i === 1
                    ? { background: 'rgba(139,92,246,0.3)', color: '#A78BFA' }
                    : { background: 'rgba(255,255,255,0.05)', color: '#475569' }
                }
              >
                {i < 1 ? "✓" : i + 1}
              </div>
              {step}
              {i === 1 && <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(139,92,246,0.2)', color: '#A78BFA' }}>Active</span>}
            </div>
          ))}
          <button className="w-full py-2.5 border-dashed rounded-xl text-sm transition-all" style={{ border: '1px dashed rgba(139,92,246,0.25)', color: '#475569' }}>
            + Add step
          </button>
        </div>
      </div>
    ),
  },
  {
    n: "03",
    label: "Watch",
    title: "Watch it work in real time.",
    desc: "See live conversations in your dashboard. Step completions tick in real time. Insights surface drop-off patterns automatically.",
    content: (
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl p-4 space-y-3" style={{ background: '#0a0a12', border: '1px solid rgba(139,92,246,0.2)' }}>
          <p className="text-xs font-medium" style={{ color: '#475569' }}>Your user sees →</p>
          <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(13,13,24,0.8)', border: '1px solid rgba(139,92,246,0.15)' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-md" style={{ background: 'linear-gradient(135deg,#8B5CF6,#22D3EE)' }} />
              <span className="text-white text-xs font-semibold">Prism</span>
            </div>
            <div className="rounded-lg p-2 text-xs" style={{ background: 'rgba(255,255,255,0.05)', color: '#94A3B8' }}>Click Settings → Integrations</div>
            <motion.div animate={{ scale: [1, 1.03, 1] }} transition={{ repeat: Infinity, duration: 2 }}
              className="rounded-lg p-2 text-white text-xs text-center font-medium"
              style={{ background: 'linear-gradient(135deg,#8B5CF6,#22D3EE)' }}>
              → Go to Integrations
            </motion.div>
          </div>
        </div>
        <div className="rounded-2xl p-4 space-y-3" style={{ background: '#0a0a12', border: '1px solid rgba(34,211,238,0.15)' }}>
          <p className="text-xs font-medium" style={{ color: '#475569' }}>You see →</p>
          <div className="space-y-2">
            {["Step 1", "Step 2", "Step 3"].map((s, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg text-xs"
                style={i < 2
                  ? { background: 'rgba(74,222,128,0.08)', color: '#4ADE80' }
                  : { background: 'rgba(255,255,255,0.03)', color: '#475569' }
                }
              >
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px]"
                  style={i < 2 ? { background: '#4ADE80', color: '#030306' } : { background: 'rgba(255,255,255,0.08)', color: '#475569' }}
                >{i < 2 ? "✓" : ""}</span>
                {s} {i < 2 ? "✓" : "..."}
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
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section className="py-28" ref={ref} style={{ background: '#07070d', borderTop: '1px solid rgba(139,92,246,0.1)' }}>
      <div className="max-w-5xl mx-auto px-6">
        {/* Heading */}
        <div className="text-center mb-14">
          <motion.p initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }} className="eyebrow mb-4">
            How It Works
          </motion.p>
          <motion.h2 initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.1 }} className="text-4xl md:text-5xl font-black text-white">
            Three steps. Zero configuration.
          </motion.h2>
        </div>

        {/* Tab selectors */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex gap-2 justify-center mb-10 flex-wrap"
        >
          {steps.map((step, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
              style={activeTab === i
                ? { background: 'linear-gradient(135deg,#8B5CF6,#6366F1)', color: '#fff', boxShadow: '0 0 20px rgba(139,92,246,0.4)' }
                : { background: 'rgba(139,92,246,0.06)', color: '#94A3B8', border: '1px solid rgba(139,92,246,0.15)' }
              }
            >
              <span className="text-xs font-bold" style={{ color: activeTab === i ? 'rgba(255,255,255,0.5)' : '#475569' }}>{step.n}</span>
              {step.label}
            </button>
          ))}
        </motion.div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="rounded-3xl p-8 md:p-12"
            style={{ background: '#12121f', border: '1px solid rgba(139,92,246,0.15)', boxShadow: '0 0 40px rgba(139,92,246,0.08)' }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-10 items-center">
              {/* Left text */}
              <div>
                <div className="text-8xl font-black leading-none mb-5 select-none" style={{ color: 'rgba(139,92,246,0.1)' }}>{steps[activeTab].n}</div>
                <h3 className="text-2xl font-black mb-3 text-white">{steps[activeTab].title}</h3>
                <p className="leading-relaxed text-base" style={{ color: '#94A3B8' }}>{steps[activeTab].desc}</p>
              </div>
              {/* Right content */}
              <div>{steps[activeTab].content}</div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
