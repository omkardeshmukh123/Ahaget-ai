"use client";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const companies = ["Acme Corp", "TechFlow", "BuildFast", "DataSync", "LaunchPad", "GrowthOS", "NexaHQ", "CoreStack", "PivotLab", "FluxAI"];

const testimonials = [
  { quote: "Prism cut our time-to-value from 14 days to 2. The agent handles questions we never even documented.", name: "Sarah Chen", role: "Head of Growth, TechFlow" },
  { quote: "4 minutes to set up. Activation rate up 38%. Support tickets from new users dropped by 60%.", name: "Marcus Rivera", role: "VP Product, BuildFast" },
];

export default function LogoBar() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const track = [...companies, ...companies];

  return (
    <section ref={ref} style={{ background: "var(--bg-2)", padding: "3.5rem 0", borderTop: "1px solid var(--border)" }}>
      {/* Trusted by */}
      <p style={{ textAlign: "center", fontSize: 12, color: "var(--text-5)", fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 24 }}>
        Trusted by teams at
      </p>

      {/* Marquee */}
      <div style={{ position: "relative", overflow: "hidden", marginBottom: 48 }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 80, background: "linear-gradient(to right, var(--bg-2), transparent)", zIndex: 1, pointerEvents: "none" }} />
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 80, background: "linear-gradient(to left, var(--bg-2), transparent)", zIndex: 1, pointerEvents: "none" }} />
        <div style={{ display: "flex", gap: 48 }} className="animate-marquee">
          {track.map((name, i) => (
            <div key={i} style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 20, height: 20, borderRadius: 4, background: "var(--surface-3)", flexShrink: 0 }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-5)", whiteSpace: "nowrap" }}>{name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div className="container">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
          {testimonials.map((t, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: .2 + i * .1 }}
              style={{
                background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8,
                padding: "24px 28px",
              }}
            >
              <p style={{ fontSize: 15, color: "var(--text-2)", lineHeight: 1.7, marginBottom: 20, fontStyle: "italic" }}>
                &ldquo;{t.quote}&rdquo;
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--surface-3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)" }}>{t.name[0]}</span>
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)", lineHeight: 1.2 }}>{t.name}</p>
                  <p style={{ fontSize: 12, color: "var(--text-4)", lineHeight: 1.2 }}>{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
