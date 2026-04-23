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
        {/* Coolvetica from cdnfonts */}
        <link rel="preconnect" href="https://fonts.cdnfonts.com" />
        <link href="https://fonts.cdnfonts.com/css/coolvetica" rel="stylesheet" />
        {/* Inter from Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body style={{ background: "#0A0A0F", color: "#E4E1E9" }}>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
