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
    <footer style={{ background: 'var(--brown)', color: 'var(--cream)' }}>
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4 group">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #FF857A, #EBAEE6)' }}
              >
                <Zap className="w-4 h-4 fill-current" style={{ color: '#3d1008' }} />
              </div>
              <span className="font-bold text-lg" style={{ color: 'var(--cream)' }}>Prism</span>
            </Link>
            <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(253,250,246,0.55)' }}>
              The AI onboarding layer for B2B SaaS. 2 lines of code. Real results.
            </p>
            <div className="flex items-center gap-3">
              <Link
                href="https://twitter.com/useprism"
                target="_blank"
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
                style={{ background: 'rgba(253,250,246,0.08)', color: 'rgba(253,250,246,0.5)' }}
                title="Twitter/X"
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,133,122,0.25)'; e.currentTarget.style.color = '#FF857A'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(253,250,246,0.08)'; e.currentTarget.style.color = 'rgba(253,250,246,0.5)'; }}
              >
                <span className="text-sm font-black">𝕏</span>
              </Link>
              <Link
                href="https://github.com/useprism"
                target="_blank"
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
                style={{ background: 'rgba(253,250,246,0.08)', color: 'rgba(253,250,246,0.5)' }}
                title="GitHub"
              >
                <ExternalLink className="w-4 h-4" />
              </Link>
              <Link
                href="mailto:hello@useprism.ai"
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
                style={{ background: 'rgba(253,250,246,0.08)', color: 'rgba(253,250,246,0.5)' }}
                title="Email"
              >
                <Mail className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold text-sm mb-4" style={{ color: 'var(--cream)' }}>{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      target={(link as { external?: boolean }).external ? "_blank" : undefined}
                      className="text-sm transition-colors"
                      style={{ color: 'rgba(253,250,246,0.5)' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#FF857A')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(253,250,246,0.5)')}
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
          style={{ borderTop: '1px solid rgba(253,250,246,0.1)' }}
        >
          <p className="text-sm" style={{ color: 'rgba(253,250,246,0.4)' }}>
            © 2026 Prism ·{" "}
            <Link
              href="/legal/privacy"
              className="transition-colors"
              style={{ color: 'rgba(253,250,246,0.4)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#FF857A')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(253,250,246,0.4)')}
            >
              Privacy
            </Link>
            {" · "}
            <Link
              href="/legal/terms"
              className="transition-colors"
              style={{ color: 'rgba(253,250,246,0.4)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#FF857A')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(253,250,246,0.4)')}
            >
              Terms
            </Link>
          </p>
          <p className="text-xs" style={{ color: 'rgba(253,250,246,0.25)' }}>
            Built for B2B SaaS teams who care about activation.
          </p>
        </div>
      </div>
    </footer>
  );
}
