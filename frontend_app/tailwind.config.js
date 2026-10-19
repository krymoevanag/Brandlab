/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ─── Brand Design Tokens ─────────────────────────────────────────────
      colors: {
        // Primary brand
        brand: {
          cyan:       "#08BCE5",   // A to Z Graphics accent
          cyanDeep:   "#087FA5",   // Accessible cyan (text / buttons)
          orange:     "#F7941D",   // A to Z CNC accent
          orangeDeep: "#B85C08",   // Accessible orange (text / buttons)
          charcoal:   "#202833",   // Sidebar, headings, nav surfaces
          charcoalMid:"#2D3748",   // Sidebar hover states
          surface:    "#F3F6F8",   // Main page background
          card:       "#FFFFFF",   // White card / form surfaces
          border:     "#E5E7EB",   // Separators, input borders
          text:       "#111827",   // Primary text
          muted:      "#64748B",   // Secondary / supporting text
        },
        // Business-unit aliases
        graphics: {
          DEFAULT:    "#08BCE5",
          deep:       "#087FA5",
          bg:         "#EFF9FD",
          border:     "#A5E1F3",
        },
        cnc: {
          DEFAULT:    "#F7941D",
          deep:       "#B85C08",
          bg:         "#FEF4E8",
          border:     "#F8C87A",
        },
      },

      // ─── Typography ───────────────────────────────────────────────────────
      fontFamily: {
        // Body: Manrope — navigation, forms, tables, buttons
        sans:  ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
        // Headings: Space Grotesk — titles, dashboard totals, metrics
        display: ["Space Grotesk", "ui-sans-serif", "sans-serif"],
        // Technical: IBM Plex Mono — job refs, invoice numbers, codes
        mono:  ["IBM Plex Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "1rem" }],         // 10px
        "xs":  ["0.75rem",  { lineHeight: "1.125rem" }],      // 12px
        "sm":  ["0.8125rem",{ lineHeight: "1.25rem" }],       // 13px
        "base":["0.9375rem",{ lineHeight: "1.5rem" }],        // 15px — body
      },

      // ─── Spacing & Radii ──────────────────────────────────────────────────
      borderRadius: {
        card: "12px",       // White content cards
        dialog: "14px",     // Modals / drawers
        btn:  "8px",        // All buttons
        badge:"6px",        // Status badges
        input:"8px",        // Form inputs
      },

      // ─── Shadows ──────────────────────────────────────────────────────────
      boxShadow: {
        card:     "0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px 0 rgba(0,0,0,0.04)",
        cardHover:"0 8px 20px -4px rgba(32,40,51,0.10), 0 4px 8px -2px rgba(32,40,51,0.06)",
        dialog:   "0 20px 60px -10px rgba(0,0,0,0.18)",
        input:    "0 1px 2px 0 rgba(0,0,0,0.05)",
      },

      // ─── Animation ────────────────────────────────────────────────────────
      transitionDuration: {
        DEFAULT: "160ms",
        fast:    "120ms",
        standard:"200ms",
      },
      keyframes: {
        "fade-in": {
          "0%":   { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-left": {
          "0%":   { opacity: "0", transform: "translateX(-8px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-in":       "fade-in 180ms ease-out",
        "slide-in-left": "slide-in-left 160ms ease-out",
      },
    },
  },
  plugins: [],
}
