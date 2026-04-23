"use client";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { DASHBOARD_URL } from "../../lib/config";
import { ArrowRight } from "lucide-react";

export default function FinalCTA() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      className="relative py-36 overflow-hidden"
      ref={ref}
      style={{ background: '#030306' }}
    >
      {/* Center glow */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 100%, rgba(139,92,246,0.3) 0%, transparent 70%)' }} />
      <div className="absolute inset-0 bg-grid opacity-40" />

      {/* 3D shapes decorative */}
      <div className="absolute right-[5%] top-[10%] w-40 h-40 opacity-35 float-y pointer-events-none hidden lg:block asset-glow">
        <Image src="/3d-shapes.png" alt="" fill style={{ objectFit: 'contain' }} />
      </div>
      <div className="absolute left-[5%] bottom-[10%] w-32 h-32 opacity-30 float-x pointer-events-none hidden lg:block asset-glow-cyan">
        <Image src="/3d-floats.png" alt="" fill style={{ objectFit: 'contain', transform: 'rotate(180deg)' }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="badge-new mb-6"
          style={{ display: 'inline-flex' }}
        >
          Free tier · No credit card · 5-min setup
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-5xl md:text-6xl font-black mb-6 leading-tight text-white"
        >
          Your first 3 agents
          <br />
          <span className="gradient-text">are completely free.</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="text-xl mb-10 leading-relaxed"
          style={{ color: '#94A3B8' }}
        >
          Join founders who stopped guessing why users drop off — and started fixing it with AI.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap gap-4 justify-center mb-8"
        >
          <Link
            href={`${DASHBOARD_URL}/register`}
            className="inline-flex items-center gap-2 px-10 py-4 font-bold text-xl rounded-xl text-white transition-all hover:scale-[1.03]"
            style={{ background: 'linear-gradient(135deg,#8B5CF6,#22D3EE)', boxShadow: '0 0 50px rgba(139,92,246,0.5), 0 12px 40px rgba(0,0,0,0.4)' }}
          >
            Start for free <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="https://cal.com/useprism"
            className="inline-flex items-center gap-2 px-10 py-4 font-semibold text-xl rounded-xl transition-all hover:scale-[1.01]"
            style={{ border: '1px solid rgba(139,92,246,0.35)', color: '#A78BFA', background: 'rgba(139,92,246,0.08)' }}
          >
            Book a 20-min demo
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm"
          style={{ color: '#475569' }}
        >
          {["No credit card", "3 agents free", "100 MTU/mo", "Cancel anytime"].map((item) => (
            <span key={item} className="flex items-center gap-1.5">
              <span style={{ color: '#22D3EE' }}>✓</span> {item}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
