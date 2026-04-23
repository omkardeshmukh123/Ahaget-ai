"use client";
import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Check, ArrowRight, Zap } from "lucide-react";
import Link from "next/link";

const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "http://localhost:3001";

const plans = [
  {
    name: "Starter",
    price: { monthly: 0, annual: 0 },
    desc: "For indie developers and tiny teams.",
    features: ["3 AI agents", "100 Monthly Tracked Users", "Flow builder (unlimited steps)", "Knowledge base (5 docs)", "Community support"],
    cta: "Start for free",
    ctaHref: DASHBOARD_URL,
    featured: false,
  },
  {
    name: "Pro",
    price: { monthly: 49, annual: 39 },
    desc: "For growing SaaS teams.",
    features: ["10 AI agents", "2,500 MTU", "MCP connectors (3)", "Advanced analytics & drop-off", "Priority email support", "Custom knowledge base"],
    cta: "Start Pro trial",
    ctaHref: `${DASHBOARD_URL}/upgrade`,
    featured: true,
    badge: "Most popular",
  },
  {
    name: "Scale",
    price: { monthly: 149, annual: 119 },
    desc: "For teams requiring dedicated throughput.",
    features: ["Unlimited agents", "10,000 MTU", "Custom MCP connectors", "Dedicated Slack channel", "SLA + 99.9% uptime", "SSO & advanced security"],
    cta: "Start Scale trial",
    ctaHref: `${DASHBOARD_URL}/upgrade`,
    featured: false,
  },
];

const faqs = [
  { q: "How are Monthly Tracked Users counted?", a: "An MTU is any unique user who interacts with a Prism agent during a calendar month. Visitors who never trigger the widget don't count." },
  { q: "Can I switch plans at any time?", a: "Yes — upgrade or downgrade instantly. Prorated charges apply automatically to your next billing cycle." },
  { q: "Do you offer open-source or non-profit discounts?", a: "Yes! Contact us with proof of status and we'll apply a 40% discount." },
  { q: "What payment methods do you accept?", a: "All major credit/debit cards via Stripe. Annual plans can be paid by invoice." },
];

export default function PricingPage() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <main ref={ref} style={{ background: "var(--bg)", minHeight: "100vh" }}>
      {/* Hero */}
      <section style={{ padding: "10rem 0 5rem", borderBottom: "1px solid rgba(74,68,85,.15)", position: "relative", overflow: "hidden" }}>
        <div className="absolute inset-0 bg-grid pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-64 rounded-full blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(124,58,237,.2) 0%, transparent 70%)" }} />
        <div className="container relative z-10 text-center">
          <motion.p initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} className="eyebrow mb-5">Pricing</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: .1 }}
            className="mb-5">
            Start free. Scale as you grow.
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: .2 }}
            className="text-xl max-w-xl mx-auto mb-10" style={{ color: "#ccc3d8" }}>
            Transparent pricing. No &ldquo;Contact Sales.&rdquo; No surprises.
          </motion.p>
          {/* Toggle */}
          <motion.div initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: .3 }}
            className="inline-flex items-center gap-4">
            <span className="text-sm font-medium" style={{ color: annual ? "#958da1" : "#e4e1e9" }}>Monthly</span>
            <button onClick={() => setAnnual(!annual)}
              className="relative w-12 h-6 rounded-full transition-colors"
              style={{ background: annual ? "linear-gradient(135deg,#7C3AED,#03B5D3)" : "rgba(74,68,85,.4)" }}>
              <motion.div animate={{ x: annual ? 24 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full" />
            </button>
            <span className="text-sm font-medium" style={{ color: annual ? "#e4e1e9" : "#958da1" }}>
              Annual <span className="text-xs px-2 py-0.5 rounded-full ml-1"
                style={{ background: "rgba(124,58,237,.15)", color: "#a78bfa" }}>Save 20%</span>
            </span>
          </motion.div>
        </div>
      </section>

      {/* Plans */}
      <section style={{ padding: "5rem 0" }}>
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div key={plan.name}
                initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: .1 + i * .1 }}
                className={`relative rounded-2xl p-8 flex flex-col ${plan.featured ? "pricing-featured" : "card"}`}>
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold"
                    style={{ background: "linear-gradient(135deg,#7C3AED,#03B5D3)", color: "#ede0ff" }}>
                    {plan.badge}
                  </div>
                )}
                <p className="text-sm font-bold mb-2"
                  style={{ background: plan.featured ? "linear-gradient(90deg,#d2bbff,#4cd7f6)" : "none",
                    WebkitBackgroundClip: plan.featured ? "text" : "initial",
                    WebkitTextFillColor: plan.featured ? "transparent" : "#958da1",
                    backgroundClip: plan.featured ? "text" : "initial" }}>
                  {plan.name}
                </p>
                <div className="mb-2">
                  <span className="text-4xl font-black" style={{ color: "#e4e1e9" }}>
                    ${annual ? plan.price.annual : plan.price.monthly}
                  </span>
                  <span className="text-base ml-1" style={{ color: "#958da1" }}>/mo</span>
                </div>
                <p className="text-sm mb-7" style={{ color: "#958da1" }}>{plan.desc}</p>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-sm" style={{ color: "#ccc3d8" }}>
                      <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#4cd7f6" }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={plan.ctaHref}>
                  <button className={plan.featured ? "btn-primary w-full justify-center" : "btn-ghost w-full justify-center"}>
                    {plan.cta} <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise band */}
      <section style={{ background: "var(--bg-dim)", padding: "3rem 0", borderTop: "1px solid rgba(74,68,85,.15)", borderBottom: "1px solid rgba(74,68,85,.15)" }}>
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold mb-1" style={{ color: "#e4e1e9" }}>Need more power?</h3>
            <p className="text-sm" style={{ color: "#958da1" }}>Custom volume, enterprise compliance, and dedicated support. Let&apos;s talk.</p>
          </div>
          <Link href="mailto:hello@useprism.ai">
            <button className="btn-ghost flex items-center gap-2 flex-shrink-0">
              Book a call <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: "5rem 0" }}>
        <div className="container max-w-2xl mx-auto">
          <h2 className="text-3xl font-black mb-10 text-center" style={{ color: "#e4e1e9" }}>Frequently asked</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl overflow-hidden"
                style={{ background: "var(--surface)", border: "1px solid rgba(74,68,85,.2)" }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left"
                  style={{ color: "#e4e1e9" }}>
                  <span className="font-semibold text-sm pr-4">{faq.q}</span>
                  <motion.span animate={{ rotate: openFaq === i ? 45 : 0 }} transition={{ duration: .2 }}
                    className="text-xl flex-shrink-0" style={{ color: "#7C3AED" }}>+</motion.span>
                </button>
                {openFaq === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} transition={{ duration: .25 }}>
                    <p className="px-6 pb-5 text-sm" style={{ color: "#958da1" }}>{faq.a}</p>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
