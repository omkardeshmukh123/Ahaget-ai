"use client";
import { useRef, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Zap } from "lucide-react";
import Link from "next/link";

const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "http://localhost:3001";

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf: number;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize(); window.addEventListener("resize", resize);
    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      r: Math.random() * 1.2 + .2, dx: (Math.random() - .5) * .25, dy: (Math.random() - .5) * .25,
      opacity: Math.random() * .4 + .1, color: Math.random() > .5 ? "124,58,237" : "3,181,211",
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${p.opacity})`; ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

export default function FinalCTA() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="relative overflow-hidden" style={{ background: 'var(--bg)', padding: '8rem 0' }}>
      <ParticleCanvas />
      <div className="absolute inset-0 bg-grid pointer-events-none" />

      {/* Ambient orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(124,58,237,.18) 0%, rgba(3,181,211,.08) 50%, transparent 80%)' }} />

      <div className="container relative z-10 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: .7 }}>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
            style={{ background: 'rgba(124,58,237,.1)', border: '1px solid rgba(124,58,237,.3)' }}>
            <Zap className="w-3.5 h-3.5" style={{ color: '#a78bfa' }} />
            <span className="text-xs font-semibold tracking-wide" style={{ color: '#d2bbff' }}>
              Start in under 2 minutes
            </span>
          </div>

          {/* Headline */}
          <h2 className="mb-6" style={{ letterSpacing: '-0.04em' }}>
            <span style={{ color: '#e4e1e9' }}>Stop losing users to</span>
            <br />
            <span className="grad-text">broken onboarding.</span>
          </h2>

          <p className="text-xl max-w-2xl mx-auto mb-12" style={{ color: '#ccc3d8' }}>
            Join hundreds of SaaS teams using Prism to guide users autonomously.
            2 lines of code. No engineers required.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            <Link href={DASHBOARD_URL}>
              <button className="btn-primary text-base px-8 py-4">
                Start for free today <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <Link href="/pricing">
              <button className="btn-ghost text-base px-7 py-4">See pricing</button>
            </Link>
          </div>

          {/* Trust */}
          <p className="text-sm" style={{ color: '#958da1' }}>
            Free forever plan available · No credit card required · SOC 2 compliant
          </p>
        </motion.div>
      </div>
    </section>
  );
}
