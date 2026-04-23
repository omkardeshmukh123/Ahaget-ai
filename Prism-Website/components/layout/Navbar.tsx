"use client";
import { useState, useEffect } from "react";
import { DASHBOARD_URL } from "../../lib/config";
import Link from "next/link";
import { Menu, X, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "Product", href: "/product" },
  { label: "Use Cases", href: "/use-cases" },
  { label: "Pricing", href: "/pricing" },
  { label: "Docs", href: "/docs" },
  { label: "Blog", href: "/blog" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 20);
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docH > 0 ? (y / docH) * 100 : 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      {/* Scroll progress bar */}
      <div
        className="fixed top-0 left-0 h-[2px] z-[9999] transition-opacity duration-300"
        style={{
          background: 'linear-gradient(90deg, #8B5CF6, #22D3EE)',
          width: `${progress}%`,
          opacity: scrolled ? 1 : 0,
        }}
      />

      <header
        className={`fixed top-0 left-0 right-0 z-[100] h-16 transition-all duration-300`}
        style={scrolled ? {
          background: 'rgba(7, 7, 13, 0.88)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(139,92,246,0.15)',
          boxShadow: '0 0 40px rgba(139,92,246,0.08)',
        } : { background: 'transparent' }}
      >
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform"
              style={{ background: 'linear-gradient(135deg, #8B5CF6, #22D3EE)', boxShadow: '0 0 16px rgba(139,92,246,0.5)' }}
            >
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-lg tracking-tight text-white">Prism</span>
              <span className="text-[10px] font-medium tracking-wide" style={{ color: '#475569' }}>AI Onboarding</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:text-white"
                style={{ color: '#94A3B8' }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(139,92,246,0.08)'; (e.currentTarget as HTMLAnchorElement).style.color = '#fff'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; (e.currentTarget as HTMLAnchorElement).style.color = '#94A3B8'; }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href={`${DASHBOARD_URL}/login`}
              className="text-sm font-medium transition-colors hover:text-white"
              style={{ color: '#94A3B8' }}
            >
              Sign in
            </Link>
            <Link
              href={`${DASHBOARD_URL}/register`}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg text-white transition-all duration-200 hover:scale-[1.03] hover:opacity-90"
              style={{
                background: 'linear-gradient(135deg,#8B5CF6,#6366F1)',
                boxShadow: '0 0 20px rgba(139,92,246,0.4), 0 4px 12px rgba(0,0,0,0.3)',
                border: '1px solid rgba(139,92,246,0.4)',
              }}
            >
              Join waitlist →
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: '#94A3B8' }}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[90] flex flex-col"
            style={{ background: '#07070d', borderRight: '1px solid rgba(139,92,246,0.12)' }}
          >
            {/* Ambient glow */}
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(139,92,246,0.12)' }} />
            <div className="h-16" />
            <div className="flex-1 flex flex-col items-center justify-center gap-2 p-8">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block text-3xl font-bold py-2 text-white hover:text-violet-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: navLinks.length * 0.07 + 0.1 }}
                className="mt-8 flex flex-col items-center gap-4"
              >
                <Link
                  href={`${DASHBOARD_URL}/login`}
                  onClick={() => setMobileOpen(false)}
                  className="text-lg transition-colors"
                  style={{ color: '#94A3B8' }}
                >
                  Sign in
                </Link>
                <Link
                  href={`${DASHBOARD_URL}/register`}
                  onClick={() => setMobileOpen(false)}
                  className="px-8 py-3 font-bold text-lg rounded-xl text-white transition-all"
                  style={{ background: 'linear-gradient(135deg,#8B5CF6,#6366F1)', boxShadow: '0 0 30px rgba(139,92,246,0.4)' }}
                >
                  Start for free →
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
