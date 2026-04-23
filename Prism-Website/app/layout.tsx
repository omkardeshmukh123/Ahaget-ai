import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://useprism.ai"),
  title: { default: "Prism — AI Onboarding Agent for SaaS", template: "%s — Prism" },
  description: "Embed an AI agent in your SaaS in 2 lines of code. Prism guides users through onboarding, executes actions in your UI, and shows you exactly where they get stuck.",
  openGraph: { type: "website", siteName: "Prism", locale: "en_US" },
  twitter: { card: "summary_large_image", site: "@useprism" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,300;0,14..32,400;0,14..32,500;0,14..32,600;0,14..32,700;0,14..32,800;1,14..32,400&display=swap" rel="stylesheet" />
        <link rel="preconnect" href="https://fonts.cdnfonts.com" />
        <link href="https://fonts.cdnfonts.com/css/coolvetica" rel="stylesheet" />
      </head>
      <body style={{ background: "#000000", color: "#f5f5f7", overflowX: "hidden" }}>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
