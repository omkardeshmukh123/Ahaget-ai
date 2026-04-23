"use client";
import Link from "next/link";
import { Zap, Github, Twitter, Linkedin } from "lucide-react";

const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "http://localhost:3001";

const footerLinks = {
  Product: [
    { label: "Features", href: "/#features" },
    { label: "How it works", href: "/#how-it-works" },
    { label: "Pricing", href: "/pricing" },
    { label: "Changelog", href: "/changelog" },
    { label: "Roadmap", href: "/roadmap" },
  ],
  Developers: [
    { label: "Documentation", href: "/docs" },
    { label: "API Reference", href: "/docs/api" },
    { label: "SDK", href: "/docs/sdk" },
    { label: "MCP Connectors", href: "/docs/mcp" },
    { label: "Status", href: "/status" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Careers", href: "/careers" },
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ],
};

export default function Footer() {
  return (
    <footer style={{ background: 'var(--bg-dim)', borderTop: '1px solid rgba(74,68,85,.2)' }}>
      <div className="container py-16">
        {/* Top row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 pb-14"
          style={{ borderBottom: '1px solid rgba(74,68,85,.15)' }}>
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#7C3AED,#03B5D3)', boxShadow: '0 0 20px rgba(124,58,237,.35)' }}>
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold" style={{ color: '#e4e1e9', letterSpacing: '-0.03em' }}>Prism</span>
            </Link>
            <p className="text-sm mb-6 max-w-[200px]" style={{ color: '#958da1', lineHeight: 1.7 }}>
              AI-powered onboarding for B2B SaaS. Guide users autonomously.
            </p>
            <div className="flex gap-3">
              {[
                { icon: Github, href: "https://github.com" },
                { icon: Twitter, href: "https://twitter.com" },
                { icon: Linkedin, href: "https://linkedin.com" },
              ].map(({ icon: Icon, href }) => (
                <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                  style={{ background: 'rgba(31,31,37,.8)', border: '1px solid rgba(74,68,85,.25)', color: '#958da1' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,.4)'; e.currentTarget.style.color = '#d2bbff'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(74,68,85,.25)'; e.currentTarget.style.color = '#958da1'; }}
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#4a4455', letterSpacing: '.1em' }}>
                {group}
              </p>
              <ul className="space-y-2.5">
                {links.map(link => (
                  <li key={link.label}>
                    <Link href={link.href}
                      className="text-sm transition-colors"
                      style={{ color: '#958da1' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#ccc3d8')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#958da1')}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8">
          <p className="text-sm" style={{ color: '#4a4455' }}>
            © {new Date().getFullYear()} Prism AI, Inc. All rights reserved.
          </p>
          <p className="text-sm" style={{ color: '#4a4455' }}>
            Built with{" "}
            <span style={{ color: '#7C3AED' }}>♥</span>{" "}
            for SaaS teams that care about onboarding.
          </p>
        </div>
      </div>
    </footer>
  );
}
