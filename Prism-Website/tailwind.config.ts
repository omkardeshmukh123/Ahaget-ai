import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* ── AI Startup Obsidian Palette ── */
        violet:  { DEFAULT: "#8B5CF6", bright: "#A78BFA", dim: "#7C3AED", subtle: "rgba(139,92,246,0.08)" },
        cyan:    { DEFAULT: "#22D3EE", dim: "#06B6D4",    subtle: "rgba(34,211,238,0.08)" },
        fuchsia: { DEFAULT: "#D946EF" },
        indigo:  { DEFAULT: "#6366F1" },

        /* ── Semantic brand alias ── */
        brand: {
          DEFAULT: "#8B5CF6",
          dark:    "#7C3AED",
          light:   "#A78BFA",
          "50":    "rgba(139,92,246,0.05)",
          "100":   "rgba(139,92,246,0.1)",
          "200":   "rgba(139,92,246,0.2)",
          "500":   "#8B5CF6",
          "600":   "#7C3AED",
          "700":   "#6D28D9",
        },

        /* ── Surfaces ── */
        surface: {
          void:     "#030306",
          deep:     "#07070d",
          DEFAULT:  "#0d0d18",
          elevated: "#12121f",
          card:     "#16162a",
          hover:    "#1c1c30",
        },
      },
      fontFamily: {
        sans:    ["var(--font-inter)", "system-ui", "sans-serif"],
        heading: ["var(--font-geist-sans)", "var(--font-inter)", "system-ui", "sans-serif"],
        mono:    ["'Fira Code'", "'JetBrains Mono'", "'Cascadia Code'", "monospace"],
      },
      backgroundImage: {
        "hero-gradient":    "radial-gradient(ellipse at 60% 0%, rgba(139,92,246,0.5) 0%, transparent 55%), radial-gradient(ellipse at 90% 80%, rgba(34,211,238,0.2) 0%, transparent 50%), radial-gradient(ellipse at 10% 90%, rgba(217,70,239,0.2) 0%, transparent 50%)",
        "violet-gradient":  "linear-gradient(135deg, #7C3AED 0%, #D946EF 100%)",
        "cta-gradient":     "linear-gradient(135deg, #8B5CF6 0%, #22D3EE 100%)",
        "hero-text":        "linear-gradient(135deg, #A78BFA 0%, #D946EF 40%, #22D3EE 100%)",
        "card-gradient":    "linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(34,211,238,0.04) 100%)",
        "border-gradient":  "linear-gradient(135deg, rgba(139,92,246,0.6), rgba(34,211,238,0.3))",
      },
      animation: {
        "fade-up":         "fadeUp 0.6s ease forwards",
        marquee:           "marquee 30s linear infinite",
        "marquee-reverse": "marquee-reverse 30s linear infinite",
        float:             "floatY 6s ease-in-out infinite",
        "pulse-slow":      "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow":       "spin 10s linear infinite",
        "border-pulse":    "borderPulse 3s ease-in-out infinite",
      },
      keyframes: {
        fadeUp:            { "0%": { opacity: "0", transform: "translateY(32px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        marquee:           { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
        "marquee-reverse": { "0%": { transform: "translateX(-50%)" }, "100%": { transform: "translateX(0)" } },
        floatY:            { "0%, 100%": { transform: "translateY(0px)" }, "50%": { transform: "translateY(-14px)" } },
        borderPulse:       { "0%, 100%": { borderColor: "rgba(139,92,246,0.2)" }, "50%": { borderColor: "rgba(139,92,246,0.6)" } },
      },
      boxShadow: {
        brand:        "0 0 40px rgba(139,92,246,0.35), 0 8px 24px rgba(0,0,0,0.3)",
        "brand-sm":   "0 0 20px rgba(139,92,246,0.25), 0 4px 12px rgba(0,0,0,0.2)",
        "brand-lg":   "0 0 80px rgba(139,92,246,0.45), 0 20px 60px rgba(0,0,0,0.5)",
        cyan:         "0 0 30px rgba(34,211,238,0.3)",
        glass:        "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
