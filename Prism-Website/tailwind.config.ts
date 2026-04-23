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
        /* ── Lotus Garden palette ── */
        mint:     { DEFAULT: "#ADEBB3", dark: "#7dd687", light: "#d4f5d7" },
        coral:    { DEFAULT: "#FF857A", dark: "#e86a5e", light: "#ffc0ba" },
        lavender: { DEFAULT: "#EBAEE6", dark: "#d080c8", light: "#f5d8f3" },
        brown:    { DEFAULT: "#6B403C", light: "#9B6560", lighter: "#c4958f", pale: "#ecdad9" },
        cream:    { DEFAULT: "#FDFAF6", "2": "#F5F0E8" },
        /* semantic aliases — coral is now the primary brand */
        brand: {
          DEFAULT: "#FF857A",
          dark:    "#e86a5e",
          light:   "#ffc0ba",
          "50":    "#fff5f4",
          "100":   "#ffe4e1",
          "500":   "#FF857A",
          "600":   "#e86a5e",
          "700":   "#c94f44",
        },
        "bg-dark":   "#3d2320",
        "bg-dark-2": "#6B403C",
        "bg-light":  "#FDFAF6",
      },
      fontFamily: {
        sans:    ["var(--font-inter)", "system-ui", "sans-serif"],
        heading: ["var(--font-geist-sans)", "var(--font-inter)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "hero-gradient":   "radial-gradient(ellipse at 80% 10%, rgba(173,235,179,0.35) 0%, transparent 50%), radial-gradient(ellipse at 10% 80%, rgba(255,133,122,0.25) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, rgba(235,174,230,0.2) 0%, transparent 60%)",
        "purple-gradient": "linear-gradient(135deg, #FF857A 0%, #EBAEE6 100%)",
        "mint-gradient":   "linear-gradient(135deg, #ADEBB3 0%, #EBAEE6 100%)",
        "coral-gradient":  "linear-gradient(135deg, #FF857A 0%, #6B403C 100%)",
      },
      animation: {
        "fade-up":         "fadeUp 0.6s ease forwards",
        marquee:           "marquee 30s linear infinite",
        "marquee-reverse": "marquee-reverse 30s linear infinite",
        float:             "float 6s ease-in-out infinite",
        "pulse-slow":      "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow":       "spin 8s linear infinite",
      },
      keyframes: {
        fadeUp:            { "0%": { opacity: "0", transform: "translateY(40px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        marquee:           { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
        "marquee-reverse": { "0%": { transform: "translateX(-50%)" }, "100%": { transform: "translateX(0)" } },
        float:             { "0%, 100%": { transform: "translateY(0px)" }, "50%": { transform: "translateY(-12px)" } },
      },
      boxShadow: {
        brand:     "0 20px 60px rgba(255,133,122,0.28)",
        "brand-sm":"0 4px 20px rgba(255,133,122,0.22)",
        mint:      "0 12px 40px rgba(173,235,179,0.30)",
        lavender:  "0 12px 40px rgba(235,174,230,0.28)",
        glass:     "0 8px 32px rgba(107,64,60,0.10), inset 0 1px 0 rgba(255,255,255,0.6)",
      },
    },
  },
  plugins: [],
};

export default config;
