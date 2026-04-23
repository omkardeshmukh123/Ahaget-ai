"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Menu, X, ChevronDown, ArrowRight } from "lucide-react";

const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "http://localhost:3001";

const navLinks = [
  { label: "Product", href: "#features" },
  { label: "Use Cases", href: "#how-it-works" },
  { label: "Pricing", href: "/pricing" },
  { label: "Docs", href: "/docs" },
  { label: "Blog", href: "/blog" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: .5, ease: [.16,.77,.25,1] }}
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(14,14,19,.85)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(74,68,85,.2)' : 'none',
          boxShadow: scrolled ? '0 0 40px rgba(124,58,237,.06)' : 'none',
        }}
      >
        {/* Top violet accent line */}
        <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(124,58,237,.5), rgba(3,181,211,.3), transparent)' }} />

        <nav className="container flex items-center h-16 gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#7C3AED,#03B5D3)', boxShadow: '0 0 20px rgba(124,58,237,.4)' }}>
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight" style={{ color: '#e4e1e9', letterSpacing: '-0.03em' }}>
              Prism
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1 flex-1">
            {navLinks.map(link => (
              <Link key={link.label} href={link.href}
                className="px-3.5 py-2 rounded-lg text-sm font-medium transition-colors duration-150"
                style={{ color: '#958da1' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#e4e1e9', e.currentTarget.style.background = 'rgba(31,31,37,.6)')}
                onMouseLeave={e => (e.currentTarget.style.color = '#958da1', e.currentTarget.style.background = 'transparent')}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-3 ml-auto">
            <Link href={`${DASHBOARD_URL}/sign-in`}
              className="px-4 py-2 text-sm font-medium transition-colors"
              style={{ color: '#958da1' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#e4e1e9')}
              onMouseLeave={e => (e.currentTarget.style.color = '#958da1')}
            >
              Sign in
            </Link>
            <Link href={DASHBOARD_URL}>
              <button className="btn-primary btn-sm flex items-center gap-1.5">
                Start free <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden ml-auto p-2 rounded-lg transition-colors"
            style={{ color: '#958da1' }}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </nav>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: .2 }}
            className="fixed top-[65px] left-0 right-0 z-40 px-4 pb-4"
          >
            <div className="glass-prism rounded-2xl p-4 space-y-1">
              {navLinks.map(link => (
                <Link key={link.label} href={link.href}
                  className="flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors"
                  style={{ color: '#ccc3d8' }}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-2 border-t" style={{ borderColor: 'rgba(74,68,85,.2)' }}>
                <Link href={DASHBOARD_URL} onClick={() => setMobileOpen(false)}>
                  <button className="btn-primary w-full justify-center mt-2">
                    Start for free <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
