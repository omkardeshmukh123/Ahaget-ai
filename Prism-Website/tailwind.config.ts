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
        /* ── Stitch "Chromatic Obsidian" Palette ── */
        brand: {
          DEFAULT:  "#7C3AED",
          bright:   "#A78BFA",
          dim:      "#d2bbff",
          on:       "#ede0ff",
          "50":     "rgba(124,58,237,0.05)",
          "100":    "rgba(124,58,237,0.10)",
          "200":    "rgba(124,58,237,0.20)",
          "300":    "rgba(124,58,237,0.30)",
          "500":    "#7C3AED",
          "600":    "#6D28D9",
        },
        accent: {
          DEFAULT:  "#03B5D3",
          bright:   "#4cd7f6",
          dim:      "#acedff",
          "100":    "rgba(3,181,211,0.10)",
          "200":    "rgba(3,181,211,0.20)",
        },
        surface: {
          bg:       "#0e0e13",
          dim:      "#131318",
          low:      "#1b1b20",
          DEFAULT:  "#1f1f25",
          high:     "#2a292f",
          highest:  "#35343a",
          bright:   "#39383e",
        },
        "on-surface":         "#e4e1e9",
        "on-surface-variant": "#ccc3d8",
        "outline":            "#958da1",
        "outline-variant":    "rgba(74,68,85,0.25)",
      },
      fontFamily: {
        sans:    ["Inter", "system-ui", "sans-serif"],
        mono:    ["'JetBrains Mono'", "'Fira Code'", "'Cascadia Code'", "monospace"],
      },
      backgroundImage: {
        "grad-primary": "linear-gradient(135deg, #7C3AED 0%, #03B5D3 100%)",
        "grad-hero":    "linear-gradient(135deg, #7C3AED 0%, #D946EF 50%, #03B5D3 100%)",
        "grad-text":    "linear-gradient(90deg, #d2bbff 0%, #f0abfc 50%, #4cd7f6 100%)",
        "bg-grid":      "linear-gradient(rgba(124,58,237,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.06) 1px, transparent 1px)",
      },
      animation: {
        "fade-up":     "fadeUp 0.6s ease forwards",
        "marquee":     "marquee 30s linear infinite",
        "float":       "floatY 6s ease-in-out infinite",
        "pulse-slow":  "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow":   "spin 20s linear infinite",
        "pulse-glow":  "pulseGlow 3s ease-in-out infinite",
      },
      keyframes: {
        fadeUp:    { "0%": { opacity: "0", transform: "translateY(24px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        marquee:   { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
        floatY:    { "0%, 100%": { transform: "translateY(0px)" }, "50%": { transform: "translateY(-14px)" } },
        pulseGlow: { "0%, 100%": { opacity: "0.6" }, "50%": { opacity: "1" } },
      },
      boxShadow: {
        brand:       "0 0 40px rgba(124,58,237,0.4), 0 8px 24px rgba(0,0,0,0.4)",
        "brand-sm":  "0 0 20px rgba(124,58,237,0.25), 0 4px 12px rgba(0,0,0,0.3)",
        "brand-lg":  "0 0 80px rgba(124,58,237,0.5), 0 20px 60px rgba(0,0,0,0.6)",
        "accent":    "0 0 30px rgba(3,181,211,0.3)",
        "glass":     "0 0 0 1px rgba(74,68,85,0.25), 0 16px 48px rgba(0,0,0,0.5)",
        "card":      "0 0 0 1px rgba(74,68,85,0.2), 0 8px 32px rgba(0,0,0,0.4)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};

export default config;
