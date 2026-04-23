import type { Metadata } from "next";
import Hero from "@/components/home/Hero";
import LogoBar from "@/components/home/LogoBar";
import TheProblem from "@/components/home/TheProblem";
import HowItWorks from "@/components/home/HowItWorks";
import FeatureBento from "@/components/home/FeatureBento";
import IntegrationLogos from "@/components/home/IntegrationLogos";
import PricingTeaser from "@/components/home/PricingTeaser";
import FinalCTA from "@/components/home/FinalCTA";

export const metadata: Metadata = {
  title: "Prism — AI Onboarding Agent for SaaS",
  description: "Embed an AI agent in your SaaS in 2 lines of code. Prism guides users through onboarding, executes actions in your UI, and shows you exactly where they get stuck.",
  openGraph: {
    title: "Prism — AI Onboarding Agent for SaaS",
    description: "Embed an AI agent in your SaaS in 2 lines of code.",
    url: "https://useprism.ai",
  },
};

export default function HomePage() {
  return (
    <>
      {/* z-index ladder: each section stacks above the previous */}
      <div style={{ position: "relative", zIndex: 0 }}><Hero /></div>
      <div style={{ position: "relative", zIndex: 1 }}><LogoBar /></div>
      <div style={{ position: "relative", zIndex: 2 }}><TheProblem /></div>
      <div style={{ position: "relative", zIndex: 3 }}><HowItWorks /></div>
      <div style={{ position: "relative", zIndex: 4 }}><FeatureBento /></div>
      <div style={{ position: "relative", zIndex: 5 }}><IntegrationLogos /></div>
      <div style={{ position: "relative", zIndex: 6 }}><PricingTeaser /></div>
      <div style={{ position: "relative", zIndex: 7 }}><FinalCTA /></div>
    </>
  );
}
