"use client";
import Link from "next/link";

const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "http://localhost:3001";

const cols = {
  Product:    [{ l:"Features", h:"/#features"}, {l:"How it works", h:"/#how-it-works"}, {l:"Pricing",h:"/pricing"}, {l:"Changelog",h:"/changelog"}],
  Developers: [{ l:"Documentation",h:"/docs"}, {l:"API Reference",h:"/docs/api"}, {l:"SDK",h:"/docs/sdk"}, {l:"Status",h:"/status"}],
  Company:    [{ l:"About",h:"/about"}, {l:"Blog",h:"/blog"}, {l:"Careers",h:"/careers"}, {l:"Privacy",h:"/privacy"}, {l:"Terms",h:"/terms"}],
};

export default function Footer() {
  return (
    <footer style={{ background: "var(--bg-2)", borderTop: "1px solid var(--border)" }}>
      <div className="container" style={{ padding: "3.5rem 2rem 2rem" }}>
        {/* Top */}
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr repeat(3, 1fr)", gap: 40, marginBottom: 48, flexWrap: "wrap" }}
          className="footer-grid">
          {/* Brand */}
          <div>
            <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 16, textDecoration: "none" }}>
              <div style={{ width: 24, height: 24, background: "#FFFFFF", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" stroke="#0A0A0F" strokeWidth="1.5" fill="none"/>
                  <path d="M7 4L10 5.5V8.5L7 10L4 8.5V5.5L7 4Z" fill="#0A0A0F"/>
                </svg>
              </div>
              <span style={{ fontFamily: "'Coolvetica', sans-serif", fontSize: 17, color: "#FFFFFF", letterSpacing: "-0.02em" }}>Prism</span>
            </Link>
            <p style={{ fontSize: 13, color: "var(--text-4)", lineHeight: 1.7, maxWidth: 200, marginBottom: 20 }}>
              AI-powered onboarding for B2B SaaS. Guide users autonomously.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(cols).map(([group, links]) => (
            <div key={group}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--text-5)", marginBottom: 16 }}>{group}</p>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                {links.map(l => (
                  <li key={l.l}>
                    <Link href={l.h} style={{ fontSize: 13, color: "var(--text-4)", transition: "color .12s" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "var(--text-2)")}
                      onMouseLeave={e => (e.currentTarget.style.color = "var(--text-4)")}>
                      {l.l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 20, borderTop: "1px solid var(--border)", flexWrap: "wrap", gap: 12 }}>
          <p style={{ fontSize: 12, color: "var(--text-5)" }}>© {new Date().getFullYear()} Prism AI, Inc.</p>
          <p style={{ fontSize: 12, color: "var(--text-5)" }}>Built for teams that care about onboarding.</p>
        </div>
      </div>
      <style>{`@media(max-width:768px){.footer-grid{grid-template-columns:1fr 1fr!important}}`}</style>
    </footer>
  );
}
