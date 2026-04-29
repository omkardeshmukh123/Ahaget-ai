"use client";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const techs = ["React", "Next.js", "Vue 3", "Angular", "Svelte", "Nuxt", "Remix", "Astro", "Solid.js", "HTML + JS"];

export default function IntegrationLogos() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="section-stack section-pad-lg"
      style={{ background: "var(--dark-1)" }}>
      <div className="container-sm" style={{ textAlign: "center" }}>
        <motion.p className="label" style={{ marginBottom: 16 }}
          initial={{ opacity: 0, y: 14 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: .55 }}>
          Works with your stack
        </motion.p>
        <motion.h2 className="display-md" style={{ marginBottom: 14 }}
          initial={{ opacity: 0, y: 18 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: .1, duration: .6 }}>
          2 lines of code.<br />Any framework.
        </motion.h2>
        <motion.p className="body-lg" style={{ marginBottom: 52 }}
          initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: .2 }}>
          Drop the snippet into your &lt;head&gt;. Works everywhere JavaScript runs.
        </motion.p>

        {/* Code block */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: .28, duration: .6 }}
          style={{ display: "inline-block", textAlign: "left", marginBottom: 44, width: "100%", maxWidth: 440 }}>
          <div className="code-surface">
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "11px 16px", borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#3a3a3c" }} />
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#3a3a3c" }} />
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#3a3a3c" }} />
              <span style={{ fontSize: 12, color: "var(--t5)", marginLeft: 8 }}>index.html</span>
            </div>
            <pre style={{ padding: "16px 20px", fontSize: 13, lineHeight: 1.8, margin: 0, overflowX: "auto", color: "var(--t3)" }}>
{`<script>
  window.TesseractConfig = {
    apiKey: "pk_live_••••••",
    userId: "{{user.id}}",
  };
</script>
<script src="https://cdn.usetesseract.ai/v1/widget.js" async></script>`}
            </pre>
          </div>
        </motion.div>

        {/* Tech tags */}
        <motion.div initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: .38 }}
          style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8 }}>
          {techs.map(t => (
            <span key={t} style={{
              display: "inline-block", padding: "6px 16px", borderRadius: 100,
              fontSize: 13, fontWeight: 500, color: "var(--t4)",
              background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)",
              fontFamily: "'Inter', sans-serif",
            }}>{t}</span>
          ))}
          <span style={{
            display: "inline-block", padding: "6px 16px", borderRadius: 100,
            fontSize: 13, color: "var(--t5)", background: "transparent", border: "0.5px solid rgba(255,255,255,0.04)",
          }}>+ more</span>
        </motion.div>
      </div>
    </section>
  );
}
