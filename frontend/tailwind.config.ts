import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    fontFamily: {
      sans:  ["Inter", "system-ui", "sans-serif"],
      slab:  ["Inter", "system-ui", "sans-serif"], // alias kept for legacy JSX
      mono:  ["JetBrains Mono", "Fira Code", "monospace"],
    },
    extend: {
      colors: {
        /* ── Canvas / background layers ─────────────── */
        canvas:  "#0d0f14",
        surface: {
          DEFAULT:  "#13161e",
          elevated: "#1a1e28",
          overlay:  "#1f2433",
          subtle:   "#1e2230",
        },
        input: "#161921",

        /* ── Border shades ───────────────────────────── */
        border: {
          subtle:  "rgba(255,255,255,0.04)",
          DEFAULT: "rgba(255,255,255,0.08)",
          strong:  "rgba(255,255,255,0.14)",
          focus:   "#4f8ef7",
        },

        /* ── Text scale ──────────────────────────────── */
        ink: {
          DEFAULT:   "#f0f2f8",   // headings
          secondary: "#b8bdd0",   // body
          muted:     "#6b7494",   // placeholders
          disabled:  "#3d4460",
        },

        /* ── Brand accent — indigo-sky ───────────────── */
        accent: {
          300: "#a5c7fc",
          400: "#7aabfa",
          500: "#4f8ef7",   // DEFAULT actions
          subtle:  "rgba(79,142,247,0.10)",
          glow:    "rgba(79,142,247,0.20)",
          border:  "rgba(79,142,247,0.25)",
          DEFAULT: "#4f8ef7",
          foreground: "#ffffff",
        },

        /* ── Semantic ────────────────────────────────── */
        success:     { DEFAULT: "#34d399", foreground: "#052e16" },
        warning:     { DEFAULT: "#fbbf24", foreground: "#1c1400" },
        destructive: { DEFAULT: "#f87171", foreground: "#1c0202" },

        /* ── Legacy aliases (keep existing JSX working) ─ */
        primary: {
          DEFAULT:    "#4f8ef7",
          hover:      "#7aabfa",
          subtle:     "rgba(79,142,247,0.10)",
          glow:       "rgba(79,142,247,0.20)",
          foreground: "#ffffff",
        },
        app: {
          bg:       "#0d0f14",
          surface:  "#13161e",
          elevated: "#1a1e28",
          overlay:  "#1f2433",
        },
        neutral: {
          50:  "#f0f2f8",
          100: "#d8dcea",
          200: "#b8bdd0",
          300: "#8b91a8",
          400: "#6b7494",
          500: "#4e5570",
          600: "#363d55",
          700: "#252c40",
          800: "#1a1e28",
          900: "#13161e",
        },
        ring:  "#4f8ef7",
        muted: { DEFAULT: "#1a1e28", foreground: "#6b7494" },
      },

      /* ── Border radius ───────────────────────────── */
      borderRadius: {
        xs:   "3px",
        sm:   "6px",
        md:   "10px",
        lg:   "14px",
        xl:   "20px",
        "2xl":"28px",
        full: "9999px",
      },

      /* ── Typography scale ────────────────────────── */
      fontSize: {
        display:  ["44px", { lineHeight: "1.05", fontWeight: "700", letterSpacing: "-0.03em" }],
        h1:       ["34px", { lineHeight: "1.15", fontWeight: "700", letterSpacing: "-0.025em" }],
        h2:       ["26px", { lineHeight: "1.25", fontWeight: "600", letterSpacing: "-0.02em" }],
        h3:       ["20px", { lineHeight: "1.35", fontWeight: "600", letterSpacing: "-0.015em" }],
        h4:       ["16px", { lineHeight: "1.4",  fontWeight: "600", letterSpacing: "-0.01em" }],
        "body-lg":["18px", { lineHeight: "1.65", fontWeight: "400" }],
        body:     ["15px", { lineHeight: "1.65", fontWeight: "400" }],
        "body-sm":["13px", { lineHeight: "1.6",  fontWeight: "400" }],
        "label-lg":["15px",{ lineHeight: "1.4",  fontWeight: "500", letterSpacing: "0.005em" }],
        "label-md":["13px",{ lineHeight: "1.4",  fontWeight: "500", letterSpacing: "0.01em" }],
        "label-sm":["12px",{ lineHeight: "1.4",  fontWeight: "500", letterSpacing: "0.02em" }],
        micro:    ["11px", { lineHeight: "1.3",  fontWeight: "600", letterSpacing: "0.07em" }],
        /* Legacy aliases */
        "body-md":["15px", { lineHeight: "1.65", fontWeight: "400" }],
        "headline-display":["44px",{ lineHeight:"1.05", fontWeight:"700", letterSpacing:"-0.03em" }],
        "headline-lg":     ["34px",{ lineHeight:"1.15", fontWeight:"700", letterSpacing:"-0.025em" }],
        "headline-md":     ["26px",{ lineHeight:"1.25", fontWeight:"600", letterSpacing:"-0.02em" }],
        "headline-sm":     ["20px",{ lineHeight:"1.35", fontWeight:"600", letterSpacing:"-0.015em" }],
        "label-lg-alias":  ["16px",{ lineHeight:"1.5",  fontWeight:"500", letterSpacing:"0.01em" }],
      },

      /* ── Shadows ─────────────────────────────────── */
      boxShadow: {
        sm:       "0 1px 3px rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.25)",
        card:     "0 1px 3px rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.25)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.40), 0 2px 4px rgba(0,0,0,0.30)",
        md:       "0 4px 12px rgba(0,0,0,0.40), 0 2px 4px rgba(0,0,0,0.30)",
        elevated: "0 8px 28px rgba(0,0,0,0.50), 0 3px 8px rgba(0,0,0,0.35)",
        lg:       "0 8px 28px rgba(0,0,0,0.50), 0 3px 8px rgba(0,0,0,0.35)",
        dialog:   "0 20px 48px rgba(0,0,0,0.55), 0 6px 16px rgba(0,0,0,0.40)",
        xl:       "0 20px 48px rgba(0,0,0,0.55), 0 6px 16px rgba(0,0,0,0.40)",
        glow:     "0 0 20px rgba(79,142,247,0.18)",
        "glow-lg":"0 0 40px rgba(79,142,247,0.26)",
      },

      /* ── Animations ──────────────────────────────── */
      animation: {
        "fade-in":    "fadeIn 0.2s ease-out both",
        "slide-up":   "slideUp 0.25s ease-out both",
        "slide-down": "slideDown 0.2s ease-out both",
        "scale-in":   "scaleIn 0.2s ease-out both",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn:    { "0%": { opacity:"0" }, "100%": { opacity:"1" } },
        slideUp:   { "0%": { opacity:"0", transform:"translateY(10px)" }, "100%": { opacity:"1", transform:"translateY(0)" } },
        slideDown: { "0%": { opacity:"0", transform:"translateY(-8px)" }, "100%": { opacity:"1", transform:"translateY(0)" } },
        scaleIn:   { "0%": { opacity:"0", transform:"scale(0.96)" },      "100%": { opacity:"1", transform:"scale(1)" } },
        pulseSoft: { "0%, 100%": { opacity:"1" }, "50%": { opacity:"0.5" } },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
