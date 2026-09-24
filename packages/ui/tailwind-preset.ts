import type { Config } from "tailwindcss";

const c = (name: string) => `rgb(var(--color-${name}) / <alpha-value>)`;

/**
 * Sellly design system preset. Every app extends this so the dashboard,
 * storefront and admin share one token set. Colors resolve through CSS
 * variables (packages/ui/styles/globals.css) so dark mode is a remap, not a
 * second set of classes. See docs/design/04-colors.md.
 *
 * Token naming (kept stable so existing class names keep working):
 *   primary   → main text color      muted   → secondary text
 *   subtle    → muted/placeholder    brand   → electric blue accent
 *   secondary → subtle surface       accent  → alias of brand (merchant-overridable on storefront)
 */
const preset: Partial<Config> = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: c("background"),
        surface: c("surface"),
        secondary: c("surface-2"),
        primary: c("text"),
        muted: c("text-secondary"),
        subtle: c("text-muted"),
        border: c("border"),
        "border-strong": c("border-strong"),
        brand: {
          DEFAULT: c("primary"),
          hover: c("primary-hover"),
          deep: c("primary-deep"),
          soft: c("primary-soft"),
          border: c("primary-border"),
        },
        accent: c("primary"),
        success: { DEFAULT: c("success"), soft: c("success-soft") },
        warning: { DEFAULT: c("warning"), soft: c("warning-soft") },
        error: { DEFAULT: c("error"), soft: c("error-soft") },
      },
      borderColor: {
        DEFAULT: c("border"),
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      fontSize: {
        display: ["clamp(40px, 6vw, 64px)", { lineHeight: "1.05", fontWeight: "600", letterSpacing: "-0.04em" }],
        h1: ["clamp(32px, 4.4vw, 48px)", { lineHeight: "1.1", fontWeight: "600", letterSpacing: "-0.035em" }],
        h2: ["clamp(26px, 3.2vw, 36px)", { lineHeight: "1.15", fontWeight: "600", letterSpacing: "-0.025em" }],
        h3: ["24px", { lineHeight: "1.25", fontWeight: "600", letterSpacing: "-0.015em" }],
        title: ["26px", { lineHeight: "1.2", fontWeight: "600", letterSpacing: "-0.025em" }],
        "body-lg": ["18px", { lineHeight: "1.6", fontWeight: "400" }],
        body: ["15px", { lineHeight: "1.55", fontWeight: "400" }],
        small: ["13px", { lineHeight: "1.4", fontWeight: "400" }],
        caption: ["12px", { lineHeight: "1.4", fontWeight: "500" }],
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "scale-in": {
          from: { opacity: "0", transform: "translateY(8px) scale(0.98)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "menu-in": {
          from: { opacity: "0", transform: "translateY(-4px) scale(0.98)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "toast-in": {
          from: { opacity: "0", transform: "translateY(-10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-left": { from: { transform: "translateX(-100%)" }, to: { transform: "translateX(0)" } },
        "slide-in-right": { from: { transform: "translateX(100%)" }, to: { transform: "translateX(0)" } },
        shimmer: { to: { transform: "translateX(100%)" } },
        "page-enter": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 200ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "scale-in": "scale-in 300ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "menu-in": "menu-in 200ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "toast-in": "toast-in 200ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "slide-in-left": "slide-in-left 300ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "slide-in-right": "slide-in-right 300ms cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
};

export default preset;
