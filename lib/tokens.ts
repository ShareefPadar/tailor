import type { CSSProperties } from "react";
import type { Density, FontName, Shadow, TokenKey, Tokens } from "./types";

export const DEFAULT_TOKENS: Tokens = {
  radius: 8,
  primary: "#2563eb",
  density: "comfortable",
  shadow: "soft",
  font: "Inter",
  tone: "neutral",
};

// Round 1 seeds, fixed order: index 0, 1, 2.
export const SEEDS: readonly { label: string; tokens: Tokens }[] = [
  {
    label: "Minimal",
    tokens: {
      radius: 4,
      primary: "#111827",
      density: "spacious",
      shadow: "none",
      font: "Inter",
      tone: "neutral",
    },
  },
  {
    label: "Bold",
    tokens: {
      radius: 6,
      primary: "#7c3aed",
      density: "compact",
      shadow: "strong",
      font: "Space Grotesk",
      tone: "premium",
    },
  },
  {
    label: "Playful",
    tokens: {
      radius: 20,
      primary: "#16a34a",
      density: "comfortable",
      shadow: "soft",
      font: "DM Sans",
      tone: "playful",
    },
  },
];

const FONT_VARS: Record<FontName, string> = {
  Inter: "var(--font-inter)",
  "DM Sans": "var(--font-dm-sans)",
  "Space Grotesk": "var(--font-space-grotesk)",
};

const SHADOWS: Record<Shadow, string> = {
  none: "none",
  soft: "0 1px 3px rgba(0,0,0,.08), 0 4px 12px rgba(0,0,0,.06)",
  strong: "0 10px 30px rgba(0,0,0,.18)",
};

const DENSITY: Record<
  Density,
  { pad: string; gap: string; btn: string; size: string }
> = {
  compact: { pad: "16px", gap: "8px", btn: "8px 14px", size: "14px" },
  comfortable: { pad: "24px", gap: "12px", btn: "10px 18px", size: "15px" },
  spacious: { pad: "32px", gap: "16px", btn: "12px 22px", size: "16px" },
};

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastText(hex: string): string {
  return luminance(hex) > 0.5 ? "#111827" : "#ffffff";
}

// CSS variables for the Render root. Inline styles are allowed only in the renderer.
export function tokensToStyle(tokens: Tokens): CSSProperties {
  const d = DENSITY[tokens.density];
  const vars: Record<string, string> = {
    "--st-radius": `${tokens.radius}px`,
    "--st-radius-sm": `${Math.round(tokens.radius * 0.6)}px`,
    "--st-primary": tokens.primary,
    "--st-on-primary": contrastText(tokens.primary),
    "--st-font": FONT_VARS[tokens.font],
    "--st-shadow": SHADOWS[tokens.shadow],
    "--st-pad": d.pad,
    "--st-gap": d.gap,
    "--st-btn-pad": d.btn,
    "--st-size": d.size,
  };
  return vars as CSSProperties;
}

// Display string for change log rows and enforced chips (SPEC §8.6, §12.2).
export function displayValue(key: TokenKey, value: string | number): string {
  if (key === "radius") return `${value}px`;
  if (key === "primary") return String(value);
  const s = String(value);
  return s.charAt(0).toUpperCase() + s.slice(1);
}
