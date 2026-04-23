"use client";
import Link from "next/link";

const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "http://localhost:3001";

const cols = {
  Product:    [{ l: "Features", h: "/#features" }, { l: "How it works", h: "/#how-it-works" }, { l: "Pricing", h: "/pricing" }, { l: "Changelog", h: "/changelog" }],
  Developers: [{ l: "Documentation", h: "/docs" }, { l: "API Reference", h: "/docs/api" }, { l: "SDK", h: "/docs/sdk" }, { l: "Status", h: "/status" }],
  Company:    [{ l: "About", h: "/about" }, { l: "Blog", h: "/blog" }, { l: "Careers", h: "/careers" }, { l: "Privacy", h: "/privacy" }, { l: "Terms", h: "/terms" }],
};

export default function Footer() {
  return (
    <footer style={{ background: "#000000", borderTop: "0.5px solid rgba(255,255,255,0.08)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 2rem 32px" }}>
        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr repeat(3,1fr)", gap: 40, marginBottom: 52 }}>
          {/* Brand */}
          <div>
            <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 7, marginBottom: 18, textDecoration: "none" }}>
              <div style={{ width: 22, height: 22, background: "#fff", borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" stroke="#000" strokeWidth="1.5" fill="none"/>
                  <path d="M7 4L10 5.5V8.5L7 10L4 8.5V5.5L7 4Z" fill="#000"/>
                </svg>
              </div>
              <span style={{ fontFamily: "'Coolvetica', sans-serif", fontSize: 17, color: "#FFFFFF", letterSpacing: "-0.02em" }}>Prism</span>
            </Link>
            <p style={{ fontSize: 13, color: "var(--t4)", lineHeight: 1.7, maxWidth: 200 }}>
              AI-powered onboarding for B2B SaaS.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(cols).map(([group, links]) => (
            <div key={group}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--t5)", marginBottom: 18 }}>{group}</p>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
                {links.map(l => (
                  <li key={l.l}>
                    <Link href={l.h} style={{ fontSize: 14, color: "var(--t4)", transition: "color .12s", textDecoration: "none" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "var(--t1)")}
                      onMouseLeave={e => (e.currentTarget.style.color = "var(--t4)")}>
                      {l.l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 24, borderTop: "0.5px solid rgba(255,255,255,0.06)", flexWrap: "wrap", gap: 12 }}>
          <p style={{ fontSize: 12, color: "var(--t5)" }}>© {new Date().getFullYear()} Prism AI, Inc. All rights reserved.</p>
          <p style={{ fontSize: 12, color: "var(--t5)" }}>Made for teams that care about activation.</p>
        </div>
      </div>
    </footer>
  );
}
