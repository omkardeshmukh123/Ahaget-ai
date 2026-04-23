"use client";
import { useRef, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { DASHBOARD_URL } from "../../lib/config";

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let w = canvas.width = canvas.offsetWidth;
    let h = canvas.height = canvas.offsetHeight;
    const palette = ['255,133,122', '235,174,230', '173,235,179', '253,250,246'];
    const ps = Array.from({ length: 55 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
      size: Math.random() * 2.5 + 0.5,
      opacity: Math.random() * 0.45 + 0.12,
      col: palette[Math.floor(Math.random() * palette.length)],
    }));
    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of ps) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.col},${p.opacity})`;
        ctx.fill();
        p.x = (p.x + p.vx + w) % w;
        p.y = (p.y + p.vy + h) % h;
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    const ro = new ResizeObserver(() => { w = canvas.width = canvas.offsetWidth; h = canvas.height = canvas.offsetHeight; });
    ro.observe(canvas);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none opacity-50" />;
}

export default function FinalCTA() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      className="relative py-32 overflow-hidden"
      ref={ref}
      style={{ background: 'linear-gradient(135deg, #FF857A 0%, #EBAEE6 45%, #ADEBB3 100%)' }}
    >
      <ParticleCanvas />

      {/* Soft light orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(253,250,246,0.20)' }} />
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(107,64,60,0.18)' }} />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-5xl md:text-6xl font-black mb-6 leading-tight"
          style={{ color: '#3d1008' }}
        >
          Your first 3 agents are free.
          <br />
          <span style={{ color: 'rgba(61,16,8,0.65)' }}>No credit card. Setup in 5 minutes.</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="text-xl mb-10 leading-relaxed"
          style={{ color: 'rgba(61,16,8,0.70)' }}
        >
          Join founders who stopped guessing why users drop off — and started fixing it.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap gap-4 justify-center mb-8"
        >
          <Link
            href={`${DASHBOARD_URL}/register`}
            className="inline-flex items-center gap-2 px-8 py-4 font-bold text-lg rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
            style={{ background: '#3d1008', color: 'var(--cream)' }}
          >
            Start for free →
          </Link>
          <Link
            href="https://cal.com/useprism"
            className="inline-flex items-center gap-2 px-8 py-4 font-semibold text-lg rounded-xl transition-all hover:scale-[1.01]"
            style={{ border: '2px solid rgba(61,16,8,0.30)', color: '#3d1008', background: 'rgba(253,250,246,0.25)' }}
          >
            Book a 20-min demo
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm"
          style={{ color: 'rgba(61,16,8,0.60)' }}
        >
          {["No credit card", "3 agents free", "100 MTU free", "Cancel anytime"].map((item) => (
            <span key={item} className="flex items-center gap-1.5">
              <span style={{ color: '#ADEBB3' }}>✓</span> {item}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
