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
        display: ["var(--font-syne)", "sans-serif"],
        body:    ["var(--font-dm-sans)", "sans-serif"],
        sans:    ["var(--font-dm-sans)", "sans-serif"],
      },

      colors: {
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
        raised: "var(--bg-raised)",
        primary: {
          DEFAULT:    "var(--accent)",
          foreground: "var(--accent-text)",
        },
        secondary: {
          DEFAULT:    "var(--bg-raised)",
          foreground: "var(--text-secondary)",
        },
        muted: {
          DEFAULT:    "var(--bg-raised)",
          foreground: "var(--text-muted)",
        },
        accent: {
          DEFAULT:    "var(--accent)",
          foreground: "var(--accent-text)",
          text:       "var(--accent-text)",
          hover:      "var(--accent-hover)",
          muted:      "var(--accent-muted)",
          border:     "var(--accent-border)",
        },
        text: {
          primary:   "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted:     "var(--text-muted)",
          inverse:   "var(--text-inverse)",
        },
        destructive: {
          DEFAULT:    "var(--destructive)",
          foreground: "#ffffff",
        },
        border: {
          DEFAULT: "var(--border)",
          strong:  "var(--border-strong)",
        },
        input:  "var(--border)",
        ring:   "var(--accent)",
      },

      borderRadius: {
        sm:   "var(--r-sm)",
        md:   "var(--r-md)",
        lg:   "var(--r-lg)",
        xl:   "var(--r-xl)",
        full: "var(--r-full)",
        DEFAULT: "var(--r-md)",
      },

      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
      },

      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
      },

      screens: {
        xs:  "375px",
        sm:  "480px",
        md:  "768px",
        lg:  "1024px",
        xl:  "1200px",
        "2xl": "1440px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
