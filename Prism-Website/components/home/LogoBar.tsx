"use client";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const COMPANIES = ["Acme Corp", "TechFlow", "BuildFast", "DataSync", "LaunchPad", "GrowthOS", "NexaHQ", "CoreStack", "PivotLab", "FluxAI", "ShipFast", "RunLoop"];

export default function LogoBar() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const track = [...COMPANIES, ...COMPANIES];

  return (
    <section ref={ref} className="section-stack section-pad-lg"
      style={{ background: "var(--dark-1)" }}>
      <div className="container-sm" style={{ textAlign: "center" }}>
        <motion.p initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: .6 }} style={{ fontSize: 13, color: "var(--t4)", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 40, fontWeight: 500 }}>
          Trusted by fast-growing SaaS teams
        </motion.p>

        {/* Marquee */}
        <div style={{ position: "relative", overflow: "hidden", marginBottom: 64 }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 100, background: "linear-gradient(to right, var(--dark-1), transparent)", zIndex: 1, pointerEvents: "none" }} />
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 100, background: "linear-gradient(to left, var(--dark-1), transparent)", zIndex: 1, pointerEvents: "none" }} />
          <div className="anim-marquee" style={{ display: "flex", gap: 52, width: "max-content" }}>
            {track.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, flexShrink: 0 }}>
                <div style={{ width: 18, height: 18, borderRadius: 4, background: "var(--dark-4)", flexShrink: 0 }} />
                <span style={{ fontSize: 15, fontWeight: 500, color: "var(--t5)", whiteSpace: "nowrap", letterSpacing: "-0.01em" }}>{c}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
          {[
            { q: "Prism cut our time-to-value from 14 days to 2. The agent handles questions we never even documented.", name: "Sarah Chen", role: "Head of Growth, TechFlow" },
            { q: "4 minutes to set up. Activation rate up 38%. Support tickets from new users dropped by 60%.", name: "Marcus Rivera", role: "VP Product, BuildFast" },
          ].map((t, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: .3 + i * .1, duration: .6 }}
              style={{ background: "var(--dark-2)", borderRadius: 20, padding: "28px 32px", textAlign: "left", border: "0.5px solid rgba(255,255,255,0.06)" }}>
              <p style={{ fontSize: 16, color: "var(--t2)", lineHeight: 1.7, marginBottom: 24, fontStyle: "normal" }}>
                &ldquo;{t.q}&rdquo;
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--dark-4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--t3)" }}>{t.name[0]}</span>
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--t1)", lineHeight: 1.2 }}>{t.name}</p>
                  <p style={{ fontSize: 12, color: "var(--t4)", lineHeight: 1.3, marginTop: 2 }}>{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
