"use client";
import { useRef, useEffect, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { ArrowRight, Play, Sparkles, Zap, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "http://localhost:3001";

/* ─── Ambient particle canvas ─────────────────────────────── */
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf: number;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize(); window.addEventListener("resize", resize);

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + .3,
      dx: (Math.random() - .5) * .3,
      dy: (Math.random() - .5) * .3,
      opacity: Math.random() * .5 + .1,
      color: Math.random() > .5 ? "124,58,237" : "3,181,211",
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${p.opacity})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

/* ─── Live AI Widget mockup ────────────────────────────────── */
const chatMsgs = [
  { role: "ai", text: "Hi! I'll guide you through setting up Prism. Let's start with installing the snippet." },
  { role: "user", text: "Done! Pasted the script tag." },
  { role: "ai", text: "Perfect — I can see it's live. Now let's connect your first data source." },
  { role: "action", text: "→ Navigating to Settings → Integrations..." },
];

function AIWidget() {
  const [step, setStep] = useState(0);
  const [typed, setTyped] = useState("");
  const [msgIdx, setMsgIdx] = useState(0);
  const steps = ["Install snippet", "Connect data", "Build flow", "Go live"];

  useEffect(() => {
    const t = setTimeout(() => setMsgIdx(i => Math.min(i + 1, chatMsgs.length - 1)), 1800);
    return () => clearTimeout(t);
  }, [msgIdx]);

  useEffect(() => {
    const t = setInterval(() => setStep(s => (s + 1) % 4), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotateY: -10 }}
      animate={{ opacity: 1, y: 0, rotateY: 0 }}
      transition={{ duration: .8, delay: .4, ease: [.16,.77,.25,1] }}
      style={{ perspective: 1200 }}
      className="relative"
    >
      {/* Outer glow */}
      <div className="absolute -inset-8 rounded-3xl blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(124,58,237,.35) 0%, rgba(3,181,211,.15) 60%, transparent 100%)' }} />

      {/* Widget panel */}
      <div className="relative glass-prism rounded-2xl overflow-hidden shadow-2xl" style={{ width: 380 }}>
        {/* Header bar */}
        <div className="px-5 py-3.5 flex items-center gap-3"
          style={{ background: 'linear-gradient(135deg, rgba(124,58,237,.25), rgba(3,181,211,.15))', borderBottom: '1px solid rgba(74,68,85,.25)' }}>
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-400/60" />
            <span className="w-3 h-3 rounded-full bg-yellow-400/60" />
            <span className="w-3 h-3 rounded-full bg-green-400/60" />
          </div>
          <div className="flex items-center gap-2 ml-1">
            <div className="w-5 h-5 rounded-md flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#7C3AED,#03B5D3)' }}>
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs font-semibold" style={{ color: '#ccc3d8' }}>Prism Assistant</span>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px]" style={{ color: '#4ade80' }}>Live</span>
          </div>
        </div>

        {/* Progress steps */}
        <div className="px-5 py-3 flex gap-2" style={{ background: 'rgba(14,14,19,.6)', borderBottom: '1px solid rgba(74,68,85,.15)' }}>
          {steps.map((s, i) => (
            <div key={i} className="flex-1 text-center">
              <div className="h-1 rounded-full mb-1.5 transition-all duration-500"
                style={{ background: i <= step ? 'linear-gradient(90deg,#7C3AED,#03B5D3)' : 'rgba(74,68,85,.4)' }} />
              <p className="text-[9px] font-medium truncate" style={{ color: i <= step ? '#d2bbff' : '#958da1' }}>{s}</p>
            </div>
          ))}
        </div>

        {/* Chat messages */}
        <div className="p-4 space-y-3 min-h-[200px]" style={{ background: 'rgba(14,14,19,.4)' }}>
          {chatMsgs.slice(0, msgIdx + 1).map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .3 }}>
              {m.role === "action" ? (
                <div className="text-xs px-3 py-1.5 rounded-lg text-center"
                  style={{ background: 'rgba(124,58,237,.12)', color: '#a78bfa', border: '1px solid rgba(124,58,237,.2)' }}>
                  {m.text}
                </div>
              ) : m.role === "ai" ? (
                <div className="flex gap-2.5 items-start">
                  <div className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center mt-0.5"
                    style={{ background: 'linear-gradient(135deg,#7C3AED,#03B5D3)' }}>
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                  <div className="px-3 py-2 rounded-xl text-sm max-w-[240px]"
                    style={{ background: 'rgba(42,41,47,.8)', color: '#ccc3d8', border: '1px solid rgba(74,68,85,.2)' }}>
                    {m.text}
                  </div>
                </div>
              ) : (
                <div className="flex justify-end">
                  <div className="px-3 py-2 rounded-xl text-sm"
                    style={{ background: 'linear-gradient(135deg, rgba(124,58,237,.3), rgba(3,181,211,.2))', color: '#e4e1e9', border: '1px solid rgba(124,58,237,.25)' }}>
                    {m.text}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Input bar */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(14,14,19,.8)', border: '1px solid rgba(74,68,85,.25)' }}>
            <input className="flex-1 bg-transparent text-sm outline-none border-none p-0"
              style={{ color: '#ccc3d8' }} placeholder="Ask Prism anything..." readOnly />
            <button className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-opacity hover:opacity-80"
              style={{ background: 'linear-gradient(135deg,#7C3AED,#03B5D3)' }}>
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Hero ─────────────────────────────────────────────────── */
export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20"
      style={{ background: 'var(--bg)' }}>
      {/* Ambient particles */}
      <ParticleCanvas />

      {/* Background grid */}
      <div className="absolute inset-0 bg-grid opacity-100 pointer-events-none" />

      {/* Large ambient orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] rounded-full pointer-events-none blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,.18) 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full pointer-events-none blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(3,181,211,.12) 0%, transparent 70%)' }} />
      <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] rounded-full pointer-events-none blur-3xl -translate-x-1/2"
        style={{ background: 'radial-gradient(circle, rgba(217,70,239,.08) 0%, transparent 70%)' }} />

      <div className="container relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-16 items-center">
          {/* ── Left: copy ── */}
          <div>
            {/* New badge */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }}>
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full mb-8 cursor-default"
                style={{ background: 'rgba(124,58,237,.1)', border: '1px solid rgba(124,58,237,.3)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                <span className="text-xs font-semibold tracking-wide" style={{ color: '#d2bbff' }}>
                  NEW — Autonomous ReAct agent just shipped
                </span>
                <ArrowRight className="w-3 h-3" style={{ color: '#a78bfa' }} />
              </div>
            </motion.div>

            {/* Headline */}
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6, delay: .1 }}>
              <h1 className="mb-6" style={{ letterSpacing: '-0.05em', lineHeight: 1.05 }}>
                <span style={{ color: '#e4e1e9' }}>Your users drop off.</span>
                <br />
                <span className="grad-text">Prism fixes it.</span>
              </h1>
            </motion.div>

            {/* Subheadline */}
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6, delay: .2 }}
              className="text-xl mb-10 max-w-lg" style={{ color: '#ccc3d8', lineHeight: 1.65 }}>
              Embed an AI agent in 2 lines of code. It guides users through onboarding autonomously —
              clicks buttons, fills forms, answers questions.
            </motion.p>

            {/* CTAs */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6, delay: .3 }}
              className="flex flex-wrap gap-4 mb-8">
              <Link href={DASHBOARD_URL}>
                <button className="btn-primary text-base px-7 py-3.5">
                  Start for free <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <button className="btn-ghost text-base px-6 py-3.5">
                <Play className="w-4 h-4" style={{ color: '#a78bfa' }} />
                Watch demo
              </button>
            </motion.div>

            {/* Trust micro-copy */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .6, delay: .5 }}
              className="flex flex-wrap gap-x-5 gap-y-2">
              {["Free forever plan", "3 agents included", "100 MTU/mo", "No credit card"].map(t => (
                <div key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#4cd7f6' }} />
                  <span className="text-sm" style={{ color: '#958da1' }}>{t}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* ── Right: AI widget ── */}
          <div className="flex justify-center lg:justify-end">
            <AIWidget />
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: 'linear-gradient(to top, var(--bg), transparent)' }} />
    </section>
  );
}
