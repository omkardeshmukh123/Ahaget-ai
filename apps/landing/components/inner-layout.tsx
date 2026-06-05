'use client';

import { useState } from 'react';

const DASHBOARD_URL =
  process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://ahaget-dashboard.onrender.com';
const SIGNUP_URL = `${DASHBOARD_URL}/register`;

// ─── Shared inner-page navbar ─────────────────────────────────────────────────

export function InnerNav() {
  const [open, setOpen] = useState(false);

  const navLinks = [
    { label: 'Features', href: '/#features' },
    { label: 'Docs', href: '/docs' },
    { label: 'Pricing', href: '/#pricing' },
    { label: 'Changelog', href: '/changelog' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-background/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 flex-shrink-0">
          <img src="/logo-mark.png" alt="Ahaget" width={28} height={28} style={{ objectFit: 'contain' }} />
          <span className="text-white font-bold text-lg">Ahaget</span>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((l) => (
            <a key={l.label} href={l.href} className="text-white/55 hover:text-white text-sm font-medium transition-colors duration-200">
              {l.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <a href={`${DASHBOARD_URL}/login`} className="text-white/55 hover:text-white text-sm font-medium transition-colors duration-200 px-3 py-1.5">
            Sign in
          </a>
          <a
            href={SIGNUP_URL}
            className="shimmer-btn bg-gradient-to-r from-[#8A2BE2] to-[#7B22C9] hover:from-[#9B42F0] hover:to-[#8A2BE2] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-200 shadow-glow hover:scale-[1.02]"
          >
            Get started free
          </a>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setOpen(!open)} className="md:hidden p-2 text-white/60 hover:text-white">
          {open ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-white/[0.06] bg-background/95 backdrop-blur-xl px-4 py-4 space-y-3">
          {navLinks.map((l) => (
            <a key={l.label} href={l.href} className="block text-white/60 hover:text-white text-sm font-medium py-1.5 transition-colors">
              {l.label}
            </a>
          ))}
          <div className="pt-3 border-t border-white/[0.06] flex flex-col gap-2">
            <a href={`${DASHBOARD_URL}/login`} className="text-center py-2.5 text-white/60 hover:text-white text-sm font-medium">Sign in</a>
            <a href={SIGNUP_URL} className="text-center py-2.5 bg-gradient-to-r from-[#8A2BE2] to-[#7B22C9] text-white text-sm font-semibold rounded-lg">
              Get started free
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}

// ─── Page hero (reusable across inner pages) ──────────────────────────────────

export function PageHero({
  eyebrow,
  title,
  description,
  badge,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: string;
  badge?: string;
}) {
  return (
    <section className="relative pt-32 pb-16 overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-20" />
      <div className="orb w-[500px] h-[500px] bg-[#8A2BE2]/12 left-1/2 top-0 -translate-x-1/2 -translate-y-1/3" />
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {eyebrow && (
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-5 border border-[#8A2BE2]/20">
            <span className="text-sm text-[#B06CF5] font-medium">{eyebrow}</span>
          </div>
        )}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-5 leading-tight">
          {title}
        </h1>
        {description && (
          <p className="text-white/50 text-lg max-w-2xl mx-auto leading-relaxed">{description}</p>
        )}
        {badge && (
          <span className="inline-block mt-5 glass rounded-full px-4 py-1.5 text-sm text-emerald-400 border border-emerald-500/20">
            {badge}
          </span>
        )}
      </div>
    </section>
  );
}

// ─── Shared footer ────────────────────────────────────────────────────────────

export function InnerFooter() {
  const columns = [
    {
      heading: 'Product',
      links: [
        { label: 'Features', href: '/#features' },
        { label: 'Pricing', href: '/#pricing' },
        { label: 'Changelog', href: '/changelog' },
        { label: 'Roadmap', href: '/roadmap' },
        { label: 'Status', href: 'https://status.ahaget.ai', external: true },
      ],
    },
    {
      heading: 'Developers',
      links: [
        { label: 'Documentation', href: '/docs' },
        { label: 'API Reference', href: '/docs#api-reference' },
        { label: 'SDKs', href: '/docs#sdks' },
        { label: 'Examples', href: '/docs#examples' },
        { label: 'GitHub', href: 'https://github.com/ahaget', external: true },
      ],
    },
    {
      heading: 'Company',
      links: [
        { label: 'About', href: '/about' },
        { label: 'Blog', href: '/blog' },
        { label: 'Careers', href: '/careers' },
        { label: 'Press', href: '/about#press' },
        { label: 'Contact', href: 'mailto:hello@ahaget.ai', external: true },
      ],
    },
    {
      heading: 'Legal',
      links: [
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
        { label: 'GDPR', href: '/privacy#gdpr' },
        { label: 'Security', href: '/security' },
        { label: 'Cookie Policy', href: '/privacy#cookies' },
      ],
    },
  ];

  return (
    <footer className="border-t border-white/[0.06] bg-surface/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <a href="/" className="flex items-center gap-2.5 mb-4">
              <img src="/logo-mark.png" alt="Ahaget" width={28} height={28} style={{ objectFit: 'contain' }} />
              <span className="text-white font-bold text-lg">Ahaget</span>
            </a>
            <p className="text-white/40 text-sm leading-relaxed mb-4">
              The AI employee for SaaS user lifecycle management.
            </p>
            <div className="flex gap-3">
              <a href="https://twitter.com/ahaget_ai" target="_blank" rel="noopener noreferrer" className="w-8 h-8 glass rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-colors border border-white/[0.08]">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.737l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="https://linkedin.com/company/ahaget" target="_blank" rel="noopener noreferrer" className="w-8 h-8 glass rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-colors border border-white/[0.08]">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.heading}>
              <h4 className="text-white font-semibold text-sm mb-4">{col.heading}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target={'external' in link && link.external ? '_blank' : undefined}
                      rel={'external' in link && link.external ? 'noopener noreferrer' : undefined}
                      className="text-white/40 hover:text-white text-sm transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/[0.06] mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/25 text-sm">
            © {new Date().getFullYear()} Ahaget, Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5 text-white/25 text-sm">
            <span>Made with</span>
            <span className="text-rose-500">♥</span>
            <span>in India</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
