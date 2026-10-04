export type Density = "compact" | "comfortable" | "spacious";
export type Shadow = "none" | "soft" | "strong";
export type FontName = "Inter" | "DM Sans" | "Space Grotesk";
export type Tone = "neutral" | "friendly" | "playful" | "premium";
export type Mode = "light" | "dark";
export type ButtonStyle = "filled" | "outline" | "soft";
export type BorderStyle = "none" | "hairline" | "bold";
export type HeadingWeight = "regular" | "bold" | "heavy";
export type Align = "left" | "center";
export type Surface = "plain" | "tinted" | "gradient";

export type IconName =
  | "truck" | "package" | "check" | "star" | "zap" | "heart" | "shield" | "clock" | "card" | "user"
  | "mail" | "pin" | "gift" | "sparkles" | "bell" | "bag" | "dumbbell" | "utensils" | "calendar" | "lock";

export interface Tokens {
  radius: number; // 0–24, even integers
  primary: string; // "#RRGGBB"
  density: Density;
  shadow: Shadow;
  font: FontName;
  tone: Tone;
  mode: Mode; // light or dark card
  buttonStyle: ButtonStyle; // how primary buttons are drawn
  border: BorderStyle; // card and input borders
  headingWeight: HeadingWeight;
  align: Align; // text and block alignment inside the card
  surface: Surface; // card background treatment
}
export type TokenKey = keyof Tokens;
// Every token except radius and primary is a category: a fixed set of options with scores.
export type CategoryKey = Exclude<TokenKey, "radius" | "primary">;

export type Node =
  | { type: "card"; children: Node[] }
  | { type: "heading"; text: string; level?: 1 | 2 | 3 }
  | { type: "text"; text: string; muted?: boolean }
  | { type: "button"; text: string; variant?: "primary" | "secondary" | "ghost" }
  | { type: "input"; label: string; placeholder?: string }
  | { type: "list"; items: string[] }
  | { type: "badge"; text: string } // small highlight, e.g. "Most popular"
  | { type: "stat"; value: string; caption?: string } // a price or key number
  | { type: "rows"; items: { label: string; value: string }[] } // label-value details
  | { type: "steps"; items: string[]; current: number } // progress; current is a 0-based index
  | { type: "divider" }
  | { type: "avatar"; name: string; caption?: string } // a person: initials, name, optional line
  | { type: "icon"; name: IconName } // a single icon in a tinted tile
  | { type: "row"; children: Node[] } // 2-3 blocks side by side; no cards or rows inside
  | { type: "progress"; value: number; label?: string } // 0-100
  | { type: "toggle"; label: string; on: boolean } // a setting with a switch
  | { type: "chips"; items: string[]; selected: number } // selectable options; selected is a 0-based index
  | { type: "rating"; value: number; caption?: string } // 0-5 stars
  | { type: "note"; text: string }; // a tinted callout

export type BlockType = Node["type"];

// What the designer's picks and rejects say about layout, beyond style tokens (see lib/taste.ts).
export interface LayoutTaste {
  liked: BlockType[]; // blocks in picked variants, most favoured first
  avoided: BlockType[]; // blocks that only appeared in rejected variants
  size: "lean" | "balanced" | "rich" | null; // how many blocks picked cards have; null until a pick
}

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
  scores: { [K in CategoryKey]: Record<Tokens[K], number> };
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
  layout?: LayoutTaste; // guidance for the AI; never enforced in code
}
