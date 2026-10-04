import type { CSSProperties } from "react";
import type {
  BorderStyle,
  ButtonStyle,
  CategoryKey,
  Density,
  FontName,
  HeadingWeight,
  Mode,
  Shadow,
  TokenKey,
  Tokens,
  Tone,
} from "./types";

// Option order matters: it breaks ties between equally scored options (SPEC §8.2).
export const DENSITIES = ["compact", "comfortable", "spacious"] as const satisfies readonly Density[];
export const SHADOWS = ["none", "soft", "strong"] as const satisfies readonly Shadow[];
export const FONTS = ["Inter", "DM Sans", "Space Grotesk"] as const satisfies readonly FontName[];
export const TONES = ["neutral", "friendly", "playful", "premium"] as const satisfies readonly Tone[];
export const MODES = ["light", "dark"] as const satisfies readonly Mode[];
export const BUTTON_STYLES = ["filled", "outline", "soft"] as const satisfies readonly ButtonStyle[];
export const BORDERS = ["none", "hairline", "bold"] as const satisfies readonly BorderStyle[];
export const HEADING_WEIGHTS = ["regular", "bold", "heavy"] as const satisfies readonly HeadingWeight[];

// The first six keep their original order, so change-log order is stable.
export const TOKEN_KEYS = [
  "radius", "primary", "density", "shadow", "font", "tone", "mode", "buttonStyle", "border", "headingWeight",
] as const satisfies readonly TokenKey[];
export const CATEGORY_KEYS = [
  "density", "shadow", "font", "tone", "mode", "buttonStyle", "border", "headingWeight",
] as const satisfies readonly CategoryKey[];

export const TOKEN_NAMES: Record<TokenKey, string> = {
  radius: "Radius",
  primary: "Color",
  density: "Density",
  shadow: "Shadow",
  font: "Font",
  tone: "Tone",
  mode: "Appearance",
  buttonStyle: "Buttons",
  border: "Border",
  headingWeight: "Headings",
};

export const CATEGORY_OPTIONS: { [K in CategoryKey]: readonly Tokens[K][] } = {
  density: DENSITIES,
  shadow: SHADOWS,
  font: FONTS,
  tone: TONES,
  mode: MODES,
  buttonStyle: BUTTON_STYLES,
  border: BORDERS,
  headingWeight: HEADING_WEIGHTS,
};

export const DEFAULT_TOKENS: Tokens = {
  radius: 8,
  primary: "#2563eb",
  density: "comfortable",
  shadow: "soft",
  font: "Inter",
  tone: "neutral",
  mode: "light",
  buttonStyle: "filled",
  border: "none",
  headingWeight: "bold",
};

// Round 1 seeds, fixed order: index 0, 1, 2. Deliberately different, including one dark card.
export const SEEDS: readonly { label: string; tokens: Tokens }[] = [
  {
    label: "Minimal",
    tokens: {
      radius: 4, primary: "#111827", density: "spacious", shadow: "none", font: "Inter", tone: "neutral",
      mode: "light", buttonStyle: "outline", border: "hairline", headingWeight: "regular",
    },
  },
  {
    label: "Bold",
    tokens: {
      radius: 6, primary: "#7c3aed", density: "compact", shadow: "strong", font: "Space Grotesk", tone: "premium",
      mode: "dark", buttonStyle: "filled", border: "bold", headingWeight: "heavy",
    },
  },
  {
    label: "Playful",
    tokens: {
      radius: 20, primary: "#16a34a", density: "comfortable", shadow: "soft", font: "DM Sans", tone: "playful",
      mode: "light", buttonStyle: "filled", border: "none", headingWeight: "bold",
    },
  },
];

const FONT_VARS: Record<FontName, string> = {
  Inter: "var(--font-inter)",
  "DM Sans": "var(--font-dm-sans)",
  "Space Grotesk": "var(--font-space-grotesk)",
};

const SHADOW_CSS: Record<Shadow, string> = {
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

// Surface colours per appearance.
const SURFACES: Record<Mode, { surface: string; surface2: string; text: string; muted: string; line: string; inputLine: string; placeholder: string }> = {
  light: { surface: "#ffffff", surface2: "#f4f4f5", text: "#18181b", muted: "#71717a", line: "#e4e4e7", inputLine: "#d4d4d8", placeholder: "#a1a1aa" },
  dark: { surface: "#18181b", surface2: "#27272a", text: "#fafafa", muted: "#a1a1aa", line: "#3f3f46", inputLine: "#52525b", placeholder: "#71717a" },
};

const HEADING_WEIGHT: Record<HeadingWeight, string> = { regular: "400", bold: "600", heavy: "800" };

// A very dark colour would vanish on a dark card, so it is swapped for near-white there.
export function effectivePrimary(tokens: Tokens): string {
  return tokens.mode === "dark" && luminance(tokens.primary) < 0.08 ? "#fafafa" : tokens.primary;
}

// CSS variables for the Render root. Inline styles are allowed only in the renderer.
export function tokensToStyle(tokens: Tokens): CSSProperties {
  const d = DENSITY[tokens.density];
  const c = SURFACES[tokens.mode];
  const primary = effectivePrimary(tokens);
  const tint = `color-mix(in srgb, ${primary} 14%, transparent)`;
  const bold = `2px solid ${c.text}`;

  // The primary button follows the button style. The secondary button takes a contrasting look.
  const button: Record<ButtonStyle, { bg: string; fg: string; line: string }> = {
    filled: { bg: primary, fg: contrastText(primary), line: "transparent" },
    outline: { bg: "transparent", fg: primary, line: primary },
    soft: { bg: tint, fg: primary, line: "transparent" },
  };
  const main = button[tokens.buttonStyle];
  const second = tokens.buttonStyle === "outline" ? button.soft : button.outline;

  const vars: Record<string, string> = {
    "--st-radius": `${tokens.radius}px`,
    "--st-radius-sm": `${Math.round(tokens.radius * 0.6)}px`,
    "--st-primary": primary,
    "--st-on-primary": contrastText(primary),
    "--st-tint": tint,
    "--st-font": FONT_VARS[tokens.font],
    "--st-shadow": SHADOW_CSS[tokens.shadow],
    "--st-pad": d.pad,
    "--st-gap": d.gap,
    "--st-btn-pad": d.btn,
    "--st-size": d.size,
    "--st-surface": c.surface,
    "--st-surface-2": c.surface2,
    "--st-text": c.text,
    "--st-muted": c.muted,
    "--st-line": c.line,
    "--st-placeholder": c.placeholder,
    "--st-border-card": tokens.border === "none" ? "0 solid transparent" : tokens.border === "bold" ? bold : `1px solid ${c.line}`,
    "--st-border-input": tokens.border === "bold" ? bold : `1px solid ${c.inputLine}`,
    "--st-btn-bg": main.bg,
    "--st-btn-fg": main.fg,
    "--st-btn-line": main.line,
    "--st-btn2-bg": second.bg,
    "--st-btn2-line": second.line,
    "--st-heading-weight": HEADING_WEIGHT[tokens.headingWeight],
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

// Typed write of one token. Works on full or partial token objects.
export function setToken<K extends TokenKey>(target: Partial<Tokens>, key: K, value: Tokens[K]): void {
  target[key] = value;
}

// The one token `key` from `tokens`, as a patch.
export function pickToken(tokens: Tokens, key: TokenKey): Partial<Tokens> {
  const patch: Partial<Tokens> = {};
  setToken(patch, key, tokens[key]);
  return patch;
}

// Only the tokens in `keys` whose value differs between `from` and `to`.
export function diffTokens(from: Tokens, to: Tokens, keys: readonly TokenKey[] = TOKEN_KEYS): Partial<Tokens> {
  const patch: Partial<Tokens> = {};
  for (const key of keys) if (from[key] !== to[key]) setToken(patch, key, to[key]);
  return patch;
}
