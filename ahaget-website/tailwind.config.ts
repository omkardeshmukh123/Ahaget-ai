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
        /* ── Stitch "Refracted Void" Palette ── */
        "secondary-fixed": "#e2dfff",
        "tertiary-fixed-dim": "#ffb877",
        "inverse-surface": "#e2e2e2",
        "inverse-primary": "#4d4bd1",
        "on-primary": "#1804a5",
        "on-secondary-fixed-variant": "#414175",
        "surface-bright": "#393939",
        "on-surface-variant": "#c7c4d6",
        "tertiary-fixed": "#ffdcc1",
        "on-error": "#690005",
        "on-secondary": "#2a2b5d",
        "surface-container-lowest": "#0e0e0e",
        "outline-variant": "#464554",
        "primary": "#c1c1ff",
        "on-tertiary-fixed-variant": "#6c3a00",
        "on-tertiary": "#4c2700",
        "surface": "#131313",
        "secondary-container": "#414175",
        "primary-fixed-dim": "#c1c1ff",
        "on-error-container": "#ffdad6",
        "primary-container": "#8283ff",
        "on-tertiary-fixed": "#2e1500",
        "surface-dim": "#131313",
        "secondary-fixed-dim": "#c2c1fd",
        "on-secondary-container": "#b0b0eb",
        "on-primary-container": "#130094",
        "tertiary-container": "#d27c1b",
        "on-primary-fixed-variant": "#332fb9",
        "tertiary": "#ffb877",
        "surface-container-high": "#2a2a2a",
        "on-primary-fixed": "#0a006b",
        "surface-container": "#1f1f1f",
        "inverse-on-surface": "#303030",
        "on-tertiary-container": "#422200",
        "on-background": "#e2e2e2",
        "primary-fixed": "#e2dfff",
        "surface-tint": "#c1c1ff",
        "surface-variant": "#353535",
        "on-secondary-fixed": "#151447",
        "background": "#131313",
        "error": "#ffb4ab",
        "error-container": "#93000a",
        "secondary": "#c2c1fd",
        "surface-container-highest": "#353535",
        "surface-container-low": "#1b1b1b",
        "outline": "#918fa0",
        "on-surface": "#e2e2e2"
      },
      borderRadius: {
        "DEFAULT": "1rem",
        "lg": "2rem",
        "xl": "3rem",
        "full": "9999px"
      },
      fontFamily: {
        "headline": ["Manrope", "sans-serif"],
        "display": ["Manrope", "sans-serif"],
        "body": ["Inter", "sans-serif"],
        "label": ["Inter", "sans-serif"],
        "manrope": ["Manrope", "sans-serif"],
        "inter": ["Inter", "sans-serif"]
      },
      backgroundImage: {
        "grad-primary": "linear-gradient(135deg, #6e6ef4 0%, #c1c1ff 100%)",
        "grad-hero":    "linear-gradient(135deg, #1f1f1f 0%, #131313 100%)",
      },
      animation: {
        "fade-up":     "fadeUp 0.6s ease forwards",
        "pulse-slow":  "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-glow":  "pulseGlow 3s ease-in-out infinite",
      },
      keyframes: {
        fadeUp:    { "0%": { opacity: "0", transform: "translateY(24px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        pulseGlow: { "0%, 100%": { opacity: "0.6" }, "50%": { opacity: "1" } },
      },
    },
  },
  plugins: [],
};

export default config;
