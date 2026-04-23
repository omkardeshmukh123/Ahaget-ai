"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Zap, ArrowRight, Play, Sparkles, ChevronRight } from "lucide-react";
import { DASHBOARD_URL } from "../../lib/config";

/* ---------- Particle System ---------- */
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let w = canvas.width = canvas.offsetWidth;
    let h = canvas.height = canvas.offsetHeight;
    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number; hue: number }[] = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.5 + 0.2,
        opacity: Math.random() * 0.5 + 0.05,
        hue: Math.random() < 0.6 ? 265 : 190, // violet or cyan
      });
    }
    let raf: number;
    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 70%, 70%, ${p.opacity})`;
        ctx.fill();
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
      }
      raf = requestAnimationFrame(draw);
    }
    draw();
    const ro = new ResizeObserver(() => { w = canvas.width = canvas.offsetWidth; h = canvas.height = canvas.offsetHeight; });
    ro.observe(canvas);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

/* ---------- Live Counter ---------- */
function LiveCounter() {
  const [count, setCount] = useState(2847);
  useEffect(() => {
    const id = setInterval(() => setCount(c => c + Math.floor(Math.random() * 3)), 2800);
    return () => clearInterval(id);
  }, []);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.0 }}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6"
      style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)', color: '#A78BFA' }}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#22D3EE' }} />
        <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#22D3EE' }} />
      </span>
      <span className="tabular-nums font-mono" style={{ color: '#22D3EE' }}>{count.toLocaleString()}</span>
      <span>sessions guided today</span>
    </motion.div>
  );
}

/* ---------- AI Chat Widget ---------- */
const chatMessages = [
  { role: "agent", text: "Hi! I'll guide you through your onboarding. Ready?", delay: 0.8 },
  { role: "user", text: "Yes, where do I start?", delay: 1.8 },
  { role: "agent", text: "Click Settings → Integrations → Connect your first data source", delay: 2.6, action: true },
];

function ChatWidget({ mouse }: { mouse: { x: number; y: number } }) {
  const [visible, setVisible] = useState(0);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    chatMessages.forEach((msg, i) => {
      timers.push(setTimeout(() => {
        setTyping(true);
        setTimeout(() => { setVisible(i + 1); setTyping(false); }, 600);
      }, msg.delay * 1000));
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  const tiltX = (mouse.y - 0.5) * -10;
  const tiltY = (mouse.x - 0.5) * 10;

  return (
    <motion.div
      animate={{ y: [0, -12, 0] }}
      transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
      style={{ perspective: "900px" }}
    >
      <motion.div
        style={{ rotateX: tiltX, rotateY: tiltY, transformStyle: "preserve-3d" }}
        transition={{ type: "spring", stiffness: 70, damping: 18 }}
        className="relative w-full max-w-sm mx-auto"
      >
        {/* Glow halo */}
        <div className="absolute -inset-12 rounded-full blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)' }} />

        {/* Widget card */}
        <div className="relative rounded-2xl overflow-hidden" style={{ background: 'rgba(13,13,24,0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(139,92,246,0.25)', boxShadow: '0 0 40px rgba(139,92,246,0.2), 0 20px 60px rgba(0,0,0,0.5)' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(139,92,246,0.12)', background: 'rgba(139,92,246,0.06)' }}>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#8B5CF6,#22D3EE)' }}>
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Prism AI</p>
                <p className="text-[11px]" style={{ color: '#94A3B8' }}>Step 2 of 4: Connect data source</p>
              </div>
            </div>
            <div className="flex gap-1.5">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={`h-1.5 w-1.5 rounded-full`} style={{ background: i < 2 ? '#8B5CF6' : 'rgba(255,255,255,0.15)' }} />
              ))}
            </div>
          </div>
          {/* Progress bar */}
          <div className="h-0.5" style={{ background: 'rgba(139,92,246,0.1)' }}>
            <div className="h-full w-1/2" style={{ background: 'linear-gradient(to right, #8B5CF6, #22D3EE)' }} />
          </div>
          {/* Chat */}
          <div className="p-4 space-y-3 min-h-[200px]">
            {chatMessages.slice(0, visible).map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "agent" && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0" style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)' }}>
                    <Sparkles className="w-3 h-3" style={{ color: '#A78BFA' }} />
                  </div>
                )}
                <div
                  className="max-w-[75%] rounded-xl px-3 py-2 text-sm leading-relaxed"
                  style={msg.role === "agent"
                    ? msg.action
                      ? { background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)', color: '#e2d9f3' }
                      : { background: 'rgba(255,255,255,0.06)', color: '#e2d9f3' }
                    : { background: 'linear-gradient(135deg,#8B5CF6,#6366F1)', color: '#fff' }
                  }
                >
                  {msg.action && <span className="text-[10px] uppercase tracking-wide block mb-1 font-medium" style={{ color: '#A78BFA' }}>Action</span>}
                  {msg.text}
                </div>
              </motion.div>
            ))}
            {typing && (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)' }}>
                  <Sparkles className="w-3 h-3" style={{ color: '#A78BFA' }} />
                </div>
                <div className="rounded-xl px-4 py-3 flex gap-1" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <span className="typing-dot w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#8B5CF6' }} />
                  <span className="typing-dot w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#8B5CF6' }} />
                  <span className="typing-dot w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#8B5CF6' }} />
                </div>
              </div>
            )}
          </div>
          {visible >= 3 && (
            <div className="px-4 pb-4">
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="w-full relative overflow-hidden rounded-xl text-white text-sm font-semibold py-3"
                style={{ background: 'linear-gradient(135deg,#8B5CF6,#22D3EE)', boxShadow: '0 0 20px rgba(139,92,246,0.4)' }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <ArrowRight className="w-4 h-4" /> Connect source
                </span>
                <motion.div
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: "linear", delay: 0.5 }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                />
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ---------- Hero ---------- */
export default function Hero() {
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });

  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden pt-16"
      style={{ background: '#030306' }}
      onMouseMove={(e) => setMouse({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight })}
    >
      {/* Grid */}
      <div className="absolute inset-0 bg-grid" />

      {/* Radial gradient center glow */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(139,92,246,0.35) 0%, transparent 70%)' }} />

      {/* Ambient orbs */}
      <div className="mesh-orb absolute top-[-15%] right-[-5%] w-[60vw] h-[60vw] rounded-full blur-[140px] pointer-events-none" style={{ background: 'rgba(139,92,246,0.18)' }} />
      <div className="mesh-orb-b absolute bottom-[-20%] left-[-10%] w-[55vw] h-[55vw] rounded-full blur-[120px] pointer-events-none" style={{ background: 'rgba(34,211,238,0.1)' }} />
      <div className="mesh-orb-c absolute top-[35%] left-[15%] w-[30vw] h-[30vw] rounded-full blur-[100px] pointer-events-none" style={{ background: 'rgba(217,70,239,0.1)' }} />

      {/* 3D floating shapes (decorative) */}
      <div className="absolute top-16 right-[8%] w-28 h-28 opacity-60 float-y pointer-events-none hidden lg:block asset-glow" style={{ animationDelay: '0s' }}>
        <Image src="/3d-floats.png" alt="" fill style={{ objectFit: 'contain' }} />
      </div>
      <div className="absolute bottom-[20%] left-[5%] w-20 h-20 opacity-50 float-x pointer-events-none hidden lg:block asset-glow-cyan" style={{ animationDelay: '2s' }}>
        <Image src="/3d-floats.png" alt="" fill style={{ objectFit: 'contain', transform: 'scaleX(-1) rotate(45deg)' }} />
      </div>

      {/* Particles */}
      <ParticleCanvas />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-16 lg:gap-8 items-center w-full">
        {/* Left column */}
        <div className="max-w-2xl">
          {/* Live counter */}
          <LiveCounter />

          {/* NEW badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="badge-new mb-8"
            style={{ display: 'inline-flex' }}
          >
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-sm mr-0.5" style={{ background: '#8B5CF6', color: '#fff' }}>NEW</span>
            Autonomous ReAct agent — just shipped
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-heading text-5xl md:text-6xl lg:text-7xl font-black leading-[1.04] tracking-tight mb-6 text-white"
          >
            Your users are{" "}
            <br />dropping off.{" "}
            <br />
            <span className="gradient-text">Prism fixes it.</span>
          </motion.h1>

          {/* Subline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-xl leading-relaxed mb-10 max-w-xl"
            style={{ color: '#94A3B8' }}
          >
            Embed an AI agent in your SaaS in 2 lines of code. It guides users through onboarding in real time — clicks buttons, fills forms, answers questions autonomously.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="flex flex-wrap gap-4 mb-8"
          >
            <Link
              href={`${DASHBOARD_URL}/register`}
              className="inline-flex items-center gap-2 px-8 py-4 font-bold text-lg rounded-xl transition-all duration-200 hover:scale-[1.03] text-white"
              style={{ background: 'linear-gradient(135deg,#8B5CF6,#22D3EE)', boxShadow: '0 0 40px rgba(139,92,246,0.4), 0 8px 24px rgba(0,0,0,0.3)' }}
            >
              Start for free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <button
              className="inline-flex items-center gap-2 px-8 py-4 font-semibold text-lg rounded-xl transition-all duration-200 group"
              style={{ border: '1px solid rgba(139,92,246,0.3)', color: '#A78BFA', background: 'rgba(139,92,246,0.06)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(139,92,246,0.12)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(139,92,246,0.5)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(139,92,246,0.06)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(139,92,246,0.3)'; }}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.15)' }}>
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              </div>
              Watch 3-min demo
            </button>
          </motion.div>

          {/* Trust micro-copy */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-sm flex flex-wrap gap-x-5 gap-y-1"
            style={{ color: '#475569' }}
          >
            {["Free forever plan", "3 agents included", "100 MTU/mo", "No credit card"].map((item, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full inline-block" style={{ background: '#8B5CF6' }} />
                {item}
              </span>
            ))}
          </motion.p>
        </div>

        {/* Right column — chat widget with 3D orb behind */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="w-full lg:w-[420px] xl:w-[480px] relative"
        >
          {/* 3D Orb behind the widget */}
          <div className="absolute -inset-16 -top-24 pointer-events-none opacity-40 hidden lg:block">
            <Image src="/3d-orb.png" alt="" fill style={{ objectFit: 'contain' }} />
          </div>
          <ChatWidget mouse={mouse} />
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none" style={{ background: 'linear-gradient(to top, #030306, transparent)' }} />
    </section>
  );
}
