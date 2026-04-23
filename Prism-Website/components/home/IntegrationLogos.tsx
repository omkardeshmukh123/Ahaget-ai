"use client";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const techs = [
  "React", "Next.js", "Vue", "Angular", "Svelte", "Nuxt", "Remix",
  "Astro", "SvelteKit", "Solid.js", "Qwik", "HTML + JS",
];

export default function IntegrationLogos() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} style={{ background: "var(--bg)", padding: "6rem 0", borderTop: "1px solid rgba(74,68,85,.15)" }}>
      <div className="container text-center">
        <motion.p initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          className="eyebrow mb-4">Works with your stack</motion.p>
        <motion.h2 initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: .1 }}
          className="text-3xl md:text-4xl font-black mb-3" style={{ color: "#e4e1e9" }}>
          2 lines of code. Any framework.
        </motion.h2>
        <motion.p initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: .2 }}
          className="text-base mb-12" style={{ color: "#958da1" }}>
          Drop in the snippet. Works everywhere JavaScript runs.
        </motion.p>

        {/* Code snippet */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: .3 }}
          className="inline-block rounded-2xl overflow-hidden mb-12 text-left"
          style={{ background: "#0e0e13", border: "1px solid rgba(74,68,85,.3)", minWidth: 360 }}>
          <div className="px-4 py-2.5 flex items-center gap-2"
            style={{ background: "rgba(124,58,237,.06)", borderBottom: "1px solid rgba(74,68,85,.2)" }}>
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#ff5f57" }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#febc2e" }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#28c840" }} />
            </div>
            <span className="text-xs ml-2" style={{ color: "#4a4455" }}>index.html</span>
          </div>
          <pre className="px-6 py-5 text-sm font-mono leading-relaxed overflow-x-auto">
            <code>
              <span style={{ color: "#a78bfa" }}>&lt;script&gt;</span>{"\n"}
              {"  "}<span style={{ color: "#4cd7f6" }}>window</span>.<span style={{ color: "#e4e1e9" }}>PrismConfig</span> = {"{"}{"\n"}
              {"    "}<span style={{ color: "#4cd7f6" }}>apiKey</span>: <span style={{ color: "#7C3AED" }}>&quot;YOUR_KEY&quot;</span>,{"\n"}
              {"    "}<span style={{ color: "#4cd7f6" }}>userId</span>: <span style={{ color: "#7C3AED" }}>&quot;{"{{user.id}}"}&quot;</span>,{"\n"}
              {"  "}{"}"};{"\n"}
              <span style={{ color: "#a78bfa" }}>&lt;/script&gt;</span>{"\n"}
              <span style={{ color: "#a78bfa" }}>&lt;script</span> <span style={{ color: "#4cd7f6" }}>src</span>=<span style={{ color: "#7C3AED" }}>&quot;https://cdn.useprism.ai/widget.js&quot;</span> <span style={{ color: "#4cd7f6" }}>async</span><span style={{ color: "#a78bfa" }}>&gt;&lt;/script&gt;</span>
            </code>
          </pre>
        </motion.div>

        {/* Tech pills */}
        <div className="flex flex-wrap justify-center gap-2.5">
          {techs.map((tech, i) => (
            <motion.span key={tech}
              initial={{ opacity: 0, scale: .9 }} animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: .35 + i * .04 }}
              whileHover={{ scale: 1.06, y: -2 }}
              className="px-4 py-1.5 rounded-full text-sm font-semibold cursor-default select-none"
              style={{ background: "rgba(124,58,237,.08)", border: "1px solid rgba(124,58,237,.2)", color: "#d2bbff" }}>
              {tech}
            </motion.span>
          ))}
        </div>

        <motion.p initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: .9 }}
          className="text-sm mt-8" style={{ color: "#4a4455" }}>
          And anything else that runs JavaScript.
        </motion.p>
      </div>
    </section>
  );
}
