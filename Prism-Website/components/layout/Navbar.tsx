"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Menu, X } from "lucide-react";

const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "http://localhost:3001";

const links = [
  { label: "Features",    href: "/#features" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Pricing",     href: "/pricing" },
  { label: "Docs",        href: "/docs" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", fn, { passive: true });
    fn();
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <>
      <header
        className={`nav-bar ${scrolled ? "scrolled" : ""}`}
        style={{ zIndex: 200 }}
      >
        {/* Inner nav — Apple style: centered links, logo left, CTA right */}
        <div style={{
          width: "100%", maxWidth: 1100, margin: "0 auto",
          padding: "0 2rem",
          display: "flex", alignItems: "center", gap: 0,
        }}>
          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 7, textDecoration: "none", flexShrink: 0 }}>
            <div style={{
              width: 24, height: 24, background: "#FFFFFF", borderRadius: 5,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" stroke="#000" strokeWidth="1.5" fill="none"/>
                <path d="M7 4L10 5.5V8.5L7 10L4 8.5V5.5L7 4Z" fill="#000"/>
              </svg>
            </div>
            <span style={{ fontFamily: "'Coolvetica', sans-serif", fontSize: 18, color: "#FFFFFF", letterSpacing: "-0.02em", fontWeight: 400 }}>Prism</span>
          </Link>

          {/* Center links */}
          <nav style={{ display: "flex", alignItems: "center", gap: 0, flex: 1, justifyContent: "center" }} className="desktop-nav">
            {links.map(l => (
              <Link key={l.label} href={l.href} className="nav-link-item">{l.label}</Link>
            ))}
          </nav>

          {/* Right */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }} className="desktop-nav">
            <Link href={`${DASHBOARD_URL}/sign-in`} className="nav-link-item">Sign in</Link>
            <Link href={DASHBOARD_URL}>
              <button className="btn-primary" style={{ padding: "7px 18px", fontSize: 13, borderRadius: 100 }}>
                Get started
              </button>
            </Link>
          </div>

          {/* Mobile */}
          <button onClick={() => setOpen(!open)}
            style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--t3)", cursor: "pointer", padding: 6, display: "none" }}
            className="mobile-menu-btn">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            style={{
              position: "fixed", top: 52, left: 0, right: 0, zIndex: 190,
              background: "rgba(0,0,0,0.95)",
              backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
              borderBottom: "0.5px solid rgba(255,255,255,0.1)",
              padding: "8px 0 16px",
            }}>
            {[...links, { label: "Sign in", href: `${DASHBOARD_URL}/sign-in` }].map(l => (
              <Link key={l.label} href={l.href} onClick={() => setOpen(false)}
                style={{ display: "block", padding: "13px 24px", fontSize: 16, color: "var(--t3)" }}>
                {l.label}
              </Link>
            ))}
            <div style={{ padding: "12px 24px 0" }}>
              <Link href={DASHBOARD_URL} onClick={() => setOpen(false)}>
                <button className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>Get started</button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 768px) { .desktop-nav { display: none !important; } .mobile-menu-btn { display: flex !important; } }
        @media (min-width: 769px) { .mobile-menu-btn { display: none !important; } }
      `}</style>
    </>
  );
}
