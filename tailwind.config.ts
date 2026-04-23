import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Syne", "sans-serif"],
        body:    ["DM Sans", "sans-serif"],
        sans:    ["DM Sans", "sans-serif"],
      },

      colors: {
        /* ── Semantic tokens (map to CSS vars) ── */
        background:  "var(--bg)",
        foreground:  "var(--text-primary)",

        card: {
          DEFAULT:    "var(--bg-card)",
          foreground: "var(--text-primary)",
        },
        popover: {
          DEFAULT:    "var(--bg-card)",
          foreground: "var(--text-primary)",
        },
        primary: {
          DEFAULT:    "var(--accent)",
          foreground: "var(--accent-text)",
        },
        secondary: {
          DEFAULT:    "var(--bg-raised)",
          foreground: "var(--text-secondary)",
        },
        muted: {
          DEFAULT:    "var(--bg-input)",
          foreground: "var(--text-muted)",
        },
        accent: {
          DEFAULT:    "var(--accent)",
          foreground: "var(--accent-text)",
        },
        destructive: {
          DEFAULT:    "#c85050",
          foreground: "#ffffff",
        },
        border: "var(--border)",
        input:  "var(--bg-input)",
        ring:   "var(--accent)",

        /* ── Raw palette (for direct use) ── */
        gold: {
          50:  "#faf6ee",
          100: "#f0e8d0",
          200: "#e2d0a0",
          300: "#d4b870",
          400: "#c8a96e",  // primary accent
          500: "#b8965c",
          600: "#9a7a44",
          700: "#7c5e30",
          800: "#5e4420",
          900: "#3e2c10",
        },
        warm: {
          50:  "#f7f5f2",  // light bg
          100: "#f0ebe3",  // raised
          200: "#eee9e1",  // input
          300: "#e8e3db",  // border
          400: "#ddd8cf",  // border strong
          500: "#b0a898",  // nav icon
          600: "#9a9088",  // muted text
          700: "#6b5f52",  // secondary text
          800: "#2c2620",  // banner bg
          900: "#1a1714",  // primary text
        },
        ink: {
          50:  "#f0ece5",  // dark text primary
          100: "#d8d0c6",
          200: "#8a8070",  // dark secondary
          300: "#5a5448",  // dark muted
          400: "#4a4840",  // dark nav icon
          500: "#2e2b24",  // dark border strong
          600: "#252318",  // dark border
          700: "#201e18",  // dark raised
          800: "#1a1814",  // dark card
          900: "#131210",  // dark bg
          950: "#0e0d0a",  // dark nav
        },
      },

      borderRadius: {
        sm:   "var(--r-sm)",
        md:   "var(--r-md)",
        lg:   "var(--r-lg)",
        xl:   "var(--r-xl)",
        full: "var(--r-full)",
        /* shadcn compat */
        DEFAULT: "var(--r-md)",
      },

      spacing: {
        xs:  "var(--space-xs)",
        sm:  "var(--space-sm)",
        md:  "var(--space-md)",
        lg:  "var(--space-lg)",
        xl:  "var(--space-xl)",
        "2xl": "var(--space-2xl)",
      },

      transitionTimingFunction: {
        smooth: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      },

      transitionDuration: {
        fast:   "150ms",
        base:   "200ms",
        slow:   "350ms",
      },

      keyframes: {
        /* accordion (shadcn) */
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        /* custom */
        fadeUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        shimmer: {
          "0%, 100%": { opacity: "0.5" },
          "50%":      { opacity: "1" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.95)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
        slideUp: {
          from: { transform: "translateY(100%)" },
          to:   { transform: "translateY(0)" },
        },
      },

      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "fade-up":   "fadeUp 300ms cubic-bezier(0.25,0.46,0.45,0.94) both",
        "fade-in":   "fadeIn 250ms cubic-bezier(0.25,0.46,0.45,0.94) both",
        "shimmer":   "shimmer 1.5s ease-in-out infinite",
        "scale-in":  "scaleIn 200ms cubic-bezier(0.25,0.46,0.45,0.94) both",
        "slide-up":  "slideUp 300ms cubic-bezier(0.25,0.46,0.45,0.94) both",
      },

      screens: {
        xs:  "375px",
        sm:  "480px",
        md:  "768px",
        lg:  "1024px",
        xl:  "1200px",
        "2xl": "1440px",
      },

      maxWidth: {
        mobile:  "480px",
        content: "800px",
        wide:    "1200px",
      },

      boxShadow: {
        card:   "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        raised: "0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)",
        gold:   "0 4px 16px rgba(200,169,110,0.2)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
