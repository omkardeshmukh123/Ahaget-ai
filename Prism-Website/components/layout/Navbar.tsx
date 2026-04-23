"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";

const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "http://localhost:3001";

const links = [
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Pricing", href: "/pricing" },
  { label: "Docs", href: "/docs" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <>
      {/* 1px violet top line */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 1, background: "var(--accent)", zIndex: 60, opacity: .7 }} />

      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: .4 }}
        style={{
          position: "fixed", top: 1, left: 0, right: 0, zIndex: 50,
          height: 60,
          background: scrolled ? "rgba(10,10,15,.88)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid var(--border)" : "none",
          transition: "background .2s, border-color .2s",
        }}
      >
        <div className="container" style={{ display: "flex", alignItems: "center", height: "100%", gap: 0 }}>
          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", flexShrink: 0, marginRight: 40 }}>
            <div style={{ width: 28, height: 28, background: "#FFFFFF", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" stroke="#0A0A0F" strokeWidth="1.5" fill="none"/>
                <path d="M7 4L10 5.5V8.5L7 10L4 8.5V5.5L7 4Z" fill="#0A0A0F"/>
              </svg>
            </div>
            <span style={{ fontFamily: "'Coolvetica', sans-serif", fontSize: 20, color: "#FFFFFF", fontWeight: 400, letterSpacing: "-0.02em" }}>Prism</span>
          </Link>

          {/* Desktop links */}
          <nav style={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }} className="hidden-mobile">
            {links.map(l => (
              <Link key={l.label} href={l.href} className="nav-link">{l.label}</Link>
            ))}
          </nav>

          {/* Right */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: "auto" }} className="hidden-mobile">
            <Link href={`${DASHBOARD_URL}/sign-in`} className="nav-link" style={{ color: "var(--text-4)" }}>Sign in</Link>
            <Link href={DASHBOARD_URL}>
              <button className="btn-primary" style={{ padding: "8px 18px", fontSize: 13 }}>
                Get started <ArrowRight size={13} />
              </button>
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(!open)}
            style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", padding: 4 }}
            className="show-mobile"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            style={{
              position: "fixed", top: 62, left: 0, right: 0, zIndex: 40,
              background: "var(--bg-2)", borderBottom: "1px solid var(--border)",
              padding: "12px 0",
            }}
          >
            {[...links, { label: "Sign in", href: `${DASHBOARD_URL}/sign-in` }].map(l => (
              <Link key={l.label} href={l.href} onClick={() => setOpen(false)}
                style={{ display: "block", padding: "12px 24px", fontSize: 15, color: "var(--text-3)" }}>
                {l.label}
              </Link>
            ))}
            <div style={{ padding: "12px 24px" }}>
              <Link href={DASHBOARD_URL} onClick={() => setOpen(false)}>
                <button className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>Get started</button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
        }
      `}</style>
    </>
  );
}
