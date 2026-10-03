export type Density = "compact" | "comfortable" | "spacious";
export type Shadow = "none" | "soft" | "strong";
export type FontName = "Inter" | "DM Sans" | "Space Grotesk";
export type Tone = "neutral" | "friendly" | "playful" | "premium";

export interface Tokens {
  radius: number; // 0–24, even integers
  primary: string; // "#RRGGBB"
  density: Density;
  shadow: Shadow;
  font: FontName;
  tone: Tone;
}
export type TokenKey = keyof Tokens;
export type CategoryKey = "density" | "shadow" | "font" | "tone";

export type Node =
  | { type: "card"; children: Node[] }
  | { type: "heading"; text: string; level?: 1 | 2 | 3 }
  | { type: "text"; text: string; muted?: boolean }
  | { type: "button"; text: string; variant?: "primary" | "secondary" | "ghost" }
  | { type: "input"; label: string; placeholder?: string }
  | { type: "list"; items: string[] };

export interface Variant {
  id: string;
  label: string;
  applied: string; // one-line "what I applied" note
  tokens: Tokens;
  layout: Node; // root is always a card
  enforced: TokenKey[]; // tokens overwritten by code (shown as chips)
}

export type ActionKind = "pick" | "reject" | "tweak" | "edit";

export interface Action {
  id: string;
  kind: ActionKind;
  round: number;
  variantLabel: string; // "" for edit
  tokens: Partial<Tokens>; // full tokens for pick/reject; changed tokens only for tweak/edit
  at: number; // Date.now()
}

export interface ChangeLogEntry {
  id: string;
  token: TokenKey;
  from: string; // display string, e.g. "8px", "#2563eb", "Inter"
  to: string;
  reason: string;
  at: number;
}

export interface Profile {
  tokens: Tokens;
  locked: Record<TokenKey, boolean>;
  scores: {
    density: Record<Density, number>;
    shadow: Record<Shadow, number>;
    font: Record<FontName, number>;
    tone: Record<Tone, number>;
  };
  radiusSamples: { value: number; weight: number }[];
  actions: Action[];
  summary: string | null;
  log: ChangeLogEntry[]; // newest first
}

// Sent to /api/generate. null means "no profile yet, use seeds".
export interface ProfilePayload {
  tokens: Tokens;
  enforced: TokenKey[];
  confidence: Record<TokenKey, number | null>;
  summary: string | null;
}
