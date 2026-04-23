"use client";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const techs = ["React", "Next.js", "Vue", "Angular", "Svelte", "Nuxt", "Remix", "Astro", "Solid.js", "HTML + JS"];

export default function IntegrationLogos() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} style={{ background: "var(--bg)", padding: "5rem 0", borderTop: "1px solid var(--border)" }}>
      <div className="container" style={{ textAlign: "center" }}>
        <motion.p className="section-label" style={{ marginBottom: 14 }} initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}}>
          Works with your stack
        </motion.p>
        <motion.h2 style={{ marginBottom: 10, fontSize: "clamp(1.5rem, 3vw, 2.5rem)" }} initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: .1 }}>
          2 lines of code. Any framework.
        </motion.h2>
        <motion.p style={{ fontSize: 16, color: "var(--text-4)", marginBottom: 40 }} initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: .2 }}>
          Drop the snippet in your &lt;head&gt;. Works anywhere JavaScript runs.
        </motion.p>

        {/* Code snippet */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: .25 }}
          style={{ display: "inline-block", textAlign: "left", marginBottom: 40 }}>
          <div style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden", minWidth: 380 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderBottom: "1px solid var(--border)" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--surface-3)" }} />
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--surface-3)" }} />
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--surface-3)" }} />
              <span style={{ fontSize: 12, color: "var(--text-5)", marginLeft: 8 }}>index.html</span>
            </div>
            <pre style={{ padding: "16px 20px", fontSize: 13, fontFamily: "monospace", color: "var(--text-3)", lineHeight: 1.7, margin: 0, overflowX: "auto" }}>
{`<script>
  window.PrismConfig = {
    apiKey: "YOUR_KEY",
    userId: "{{user.id}}",
  };
</script>
<script src="https://cdn.useprism.ai/widget.js" async></script>`}
            </pre>
          </div>
        </motion.div>

        {/* Tech pills */}
        <motion.div initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: .35 }}
          style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8 }}>
          {techs.map(t => (
            <span key={t} className="tag" style={{ fontSize: 13 }}>{t}</span>
          ))}
          <span className="tag" style={{ color: "var(--text-5)", fontSize: 13 }}>+ more</span>
        </motion.div>
      </div>
    </section>
  );
}
