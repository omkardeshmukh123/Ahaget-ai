import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://useahaget.ai"),
  title: { default: "Ahaget — AI Onboarding Agent for SaaS", template: "%s — Ahaget" },
  description: "Embed an AI agent in your SaaS in 2 lines of code. Ahaget guides users through onboarding, executes actions in your UI, and shows you exactly where they get stuck.",
  openGraph: { type: "website", siteName: "Ahaget", locale: "en_US" },
  twitter: { card: "summary_large_image", site: "@useahaget" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body text-on-background antialiased selection:bg-primary/30" style={{ background: "#131313", color: "#e2e2e2", overflowX: "hidden" }}>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
