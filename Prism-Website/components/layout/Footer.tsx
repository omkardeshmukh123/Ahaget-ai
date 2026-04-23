"use client";
import Link from "next/link";
import { Zap, ExternalLink, Mail } from "lucide-react";
import { DASHBOARD_URL } from "../../lib/config";

const footerLinks = {
  Product: [
    { label: "Product", href: "/product" },
    { label: "Use Cases", href: "/use-cases" },
    { label: "Pricing", href: "/pricing" },
    { label: "Integrations", href: "/integrations" },
    { label: "Changelog", href: "/changelog" },
  ],
  Resources: [
    { label: "Docs", href: "/docs" },
    { label: "Blog", href: "/blog" },
    { label: "Case Studies", href: "/case-studies" },
    { label: "Status", href: "/status" },
    { label: "Security", href: "/security" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Affiliate", href: "/affiliate" },
    { label: "Twitter / X", href: "https://twitter.com/useprism", external: true },
    { label: "GitHub", href: "https://github.com/useprism", external: true },
  ],
};

export default function Footer() {
  return (
    <footer style={{ background: '#07070d', borderTop: '1px solid rgba(139,92,246,0.12)' }}>
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-5 group">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform"
                style={{ background: 'linear-gradient(135deg, #8B5CF6, #22D3EE)', boxShadow: '0 0 16px rgba(139,92,246,0.4)' }}
              >
                <Zap className="w-4 h-4 text-white fill-white" />
              </div>
              <span className="font-bold text-lg text-white">Prism</span>
            </Link>
            <p className="text-sm leading-relaxed mb-6" style={{ color: '#475569' }}>
              The AI onboarding layer for B2B SaaS. 2 lines of code. Real results.
            </p>
            <div className="flex items-center gap-3">
              {[
                { href: "https://twitter.com/useprism", label: "𝕏", title: "Twitter/X" },
                { href: "https://github.com/useprism", label: <ExternalLink className="w-4 h-4" />, title: "GitHub" },
                { href: "mailto:hello@useprism.ai", label: <Mail className="w-4 h-4" />, title: "Email" },
              ].map((social, i) => (
                <Link
                  key={i}
                  href={social.href}
                  target={social.href.startsWith("http") ? "_blank" : undefined}
                  title={social.title}
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-all text-sm font-black"
                  style={{ background: 'rgba(139,92,246,0.08)', color: '#475569', border: '1px solid rgba(139,92,246,0.12)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.2)'; e.currentTarget.style.color = '#A78BFA'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.08)'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.12)'; }}
                >
                  {social.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold text-sm mb-4 text-white">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      target={(link as { external?: boolean }).external ? "_blank" : undefined}
                      className="text-sm transition-colors"
                      style={{ color: '#475569' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#A78BFA')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ borderTop: '1px solid rgba(139,92,246,0.1)' }}
        >
          <p className="text-sm" style={{ color: '#334155' }}>
            © 2026 Prism ·{" "}
            <Link
              href="/legal/privacy"
              className="transition-colors"
              style={{ color: '#334155' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#A78BFA')}
              onMouseLeave={e => (e.currentTarget.style.color = '#334155')}
            >
              Privacy
            </Link>
            {" · "}
            <Link
              href="/legal/terms"
              className="transition-colors"
              style={{ color: '#334155' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#A78BFA')}
              onMouseLeave={e => (e.currentTarget.style.color = '#334155')}
            >
              Terms
            </Link>
          </p>
          <p className="text-xs" style={{ color: '#1e293b' }}>
            Built for B2B SaaS teams who care about activation.
          </p>
        </div>
      </div>
    </footer>
  );
}
