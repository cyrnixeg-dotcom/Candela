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
        // Candela Brand Palette
        candela: {
          pink: "#F4A7B9",
          "pink-deep": "#E8728C",
          "pink-light": "#FDE8EE",
          "pink-pale": "#FFF0F5",
          cream: "#FFF9F5",
          ivory: "#F7F0E8",
          black: "#1A1A1A",
          charcoal: "#2D2D2D",
          gold: "#C9A96E",
          "gold-light": "#E8D5A3",
          "gold-shine": "#F0E6C8",
          blush: "#F9D5DF",
          rose: "#D4517A",
          petal: "#FFE4EE",
        },
      },
      fontFamily: {
        display: ["var(--font-cormorant)", "Georgia", "serif"],
        script: ["var(--font-great-vibes)", "cursive"],
        body: ["var(--font-jost)", "sans-serif"],
        sans: ["var(--font-jost)", "sans-serif"],
      },
      backgroundImage: {
        "candela-gradient":
          "linear-gradient(135deg, #FFF9F5 0%, #FDE8EE 50%, #F7F0E8 100%)",
        "pink-gradient":
          "linear-gradient(135deg, #FDE8EE 0%, #F4A7B9 100%)",
        "hero-gradient":
          "radial-gradient(ellipse at center, #FFF0F5 0%, #FDE8EE 40%, #F7F0E8 100%)",
        "gold-shimmer":
          "linear-gradient(90deg, transparent, #E8D5A3, transparent)",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "float-slow": "float 8s ease-in-out infinite",
        "float-fast": "float 4s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
        "spin-slow": "spin 8s linear infinite",
        "pulse-soft": "pulse-soft 3s ease-in-out infinite",
        "fade-up": "fadeUp 0.8s ease-out forwards",
        "scale-in": "scaleIn 0.6s ease-out forwards",
        "slide-up": "slideUp 0.5s ease-out forwards",
        particle: "particle 3s ease-in infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "33%": { transform: "translateY(-15px) rotate(1deg)" },
          "66%": { transform: "translateY(-8px) rotate(-1deg)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(30px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.8)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(100%)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        particle: {
          "0%": { opacity: "0", transform: "translateY(0) scale(0)" },
          "20%": { opacity: "1", transform: "translateY(-20px) scale(1)" },
          "100%": {
            opacity: "0",
            transform: "translateY(-80px) scale(0.5)",
          },
        },
      },
      boxShadow: {
        "candela-soft": "0 8px 32px rgba(244, 167, 185, 0.2)",
        "candela-glow": "0 0 30px rgba(244, 167, 185, 0.4)",
        "candela-product":
          "0 20px 60px rgba(244, 167, 185, 0.25), 0 8px 20px rgba(201, 169, 110, 0.1)",
        "candela-card":
          "0 4px 24px rgba(244, 167, 185, 0.15), 0 1px 4px rgba(0,0,0,0.05)",
        "candela-hover":
          "0 24px 80px rgba(244, 167, 185, 0.35), 0 12px 30px rgba(201, 169, 110, 0.15)",
        gold: "0 4px 20px rgba(201, 169, 110, 0.3)",
        glass: "inset 0 1px 0 rgba(255,255,255,0.6), 0 8px 32px rgba(0,0,0,0.08)",
      },
      backdropBlur: {
        xs: "2px",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
        "128": "32rem",
      },
    },
  },
  plugins: [],
};

export default config;
