"use client";
import { useState, useEffect, useRef } from "react";
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
  const barRef = useRef<HTMLDivElement>(null);

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
    if (barRef.current) {
      barRef.current.style.width = `${progress}%`;
    }
  }, [progress]);

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      {/* Progress bar */}
      <div
        ref={barRef}
        className={`fixed top-0 left-0 h-[2px] z-[9999] transition-opacity duration-300 ${scrolled ? 'opacity-100' : 'opacity-0'}`}
        style={{ background: 'linear-gradient(90deg, #FF857A, #EBAEE6)', width: `${progress}%` }}
      />

      <header
        className={`fixed top-0 left-0 right-0 z-[100] h-16 transition-all duration-300 ${
          scrolled
            ? "backdrop-blur-md border-b shadow-sm" 
            : "bg-transparent"
        }`}
        style={scrolled ? { background: 'rgba(253,250,246,0.88)', borderColor: 'rgba(107,64,60,0.12)' } : {}}
      >
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center shadow-brand-sm group-hover:scale-105 transition-transform">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-lg text-brand tracking-tight">Prism</span>
              <span className="text-[10px] font-medium tracking-wide transition-colors" style={{ color: '#9B6560' }}>AI Onboarding</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  scrolled ? "text-brown hover:bg-brown/8" : "text-brown/80 hover:bg-brown/8"
                }`}
                style={{ color: scrolled ? '#6B403C' : '#6B403C' }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href={`${DASHBOARD_URL}/login`}
              className="text-sm font-medium transition-colors"
              style={{ color: '#6B403C' }}
            >
              Sign in
            </Link>
            <Link
              href={`${DASHBOARD_URL}/register`}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg,#FF857A,#EBAEE6)', color: '#3d1008', boxShadow: '0 4px 16px rgba(255,133,122,0.25)' }}
            >
              Start free
              <span>→</span>
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`md:hidden p-2 rounded-lg transition-colors`} style={{ color: scrolled ? '#6B403C' : '#6B403C' }}
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
            style={{ background: 'var(--cream)' }}
          >
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
                    className="block text-3xl font-bold transition-colors py-2"
                    style={{ color: '#6B403C' }}
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
                  style={{ color: '#9B6560' }}
                >
                  Sign in
                </Link>
                <Link
                  href={`${DASHBOARD_URL}/register`}
                  onClick={() => setMobileOpen(false)}
                  className="px-8 py-3 bg-brand hover:bg-brand-dark text-white font-bold text-lg rounded-xl transition-all shadow-brand"
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
