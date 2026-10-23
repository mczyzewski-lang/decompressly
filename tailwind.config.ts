import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-2": "rgb(var(--surface-2) / <alpha-value>)",
        sand: "rgb(var(--sand) / <alpha-value>)",
        sage: "rgb(var(--sage) / <alpha-value>)",
        "sage-soft": "rgb(var(--sage-soft) / <alpha-value>)",
        "sage-deep": "rgb(var(--sage-deep) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        "ink-2": "rgb(var(--ink-2) / <alpha-value>)",
        "ink-3": "rgb(var(--ink-3) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        clay: "rgb(var(--clay) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", '"SF Pro Text"', '"Inter"', '"Segoe UI"', "Roboto", "Helvetica", "Arial", "sans-serif"],
        display: ["ui-serif", '"New York"', '"Iowan Old Style"', '"Source Serif Pro"', "Georgia", "serif"],
        mono: ["ui-monospace", '"SF Mono"', "Menlo", "monospace"],
      },
      borderRadius: { xl: "1rem", "2xl": "1.375rem", "3xl": "1.75rem" },
      boxShadow: {
        soft: "0 1px 2px rgb(var(--shadow) / 0.04), 0 6px 24px -8px rgb(var(--shadow) / 0.10)",
        lift: "0 2px 4px rgb(var(--shadow) / 0.05), 0 18px 40px -16px rgb(var(--shadow) / 0.18)",
      },
      transitionTimingFunction: { calm: "cubic-bezier(0.22, 0.61, 0.36, 1)" },
      keyframes: {
        "fade-up": { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "none" } },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "fade-out": { from: { opacity: "1" }, to: { opacity: "0" } },
        "sheet-up": { from: { transform: "translateY(100%)" }, to: { transform: "translateY(0)" } },
        "sheet-down": { from: { transform: "translateY(0)" }, to: { transform: "translateY(100%)" } },
      },
      animation: {
        "fade-up": "fade-up 520ms cubic-bezier(0.22,0.61,0.36,1) both",
        "fade-in": "fade-in 700ms ease both",
        "overlay-in": "fade-in 220ms ease-out both",
        "overlay-out": "fade-out 200ms ease-in both",
        "sheet-up": "sheet-up 340ms cubic-bezier(0.32,0.72,0,1) both",
        "sheet-down": "sheet-down 240ms cubic-bezier(0.4,0,1,1) both",
      },
    },
  },
  plugins: [],
};
export default config;
