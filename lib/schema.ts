import { z } from "zod";
import {
  ALIGNS, BORDERS, BUTTON_STYLES, DEFAULT_TOKENS, DENSITIES, FONTS, HEADING_WEIGHTS, MODES, SHADOWS,
  SURFACES_OPTIONS, TONES, TOKEN_KEYS,
} from "./tokens";
import type { BlockType, IconName, Node, ProfilePayload, Variant } from "./types";

const HEX = /^#[0-9a-fA-F]{6}$/;
export const NODE_TYPES = [
  "card", "heading", "text", "button", "input", "list", "badge", "stat", "rows", "steps", "divider",
  "avatar", "icon", "row", "progress", "toggle", "chips", "rating", "note",
] as const satisfies readonly BlockType[];

const ICON_NAMES = [
  "truck", "package", "check", "star", "zap", "heart", "shield", "clock", "card", "user",
  "mail", "pin", "gift", "sparkles", "bell", "bag", "dumbbell", "utensils", "calendar", "lock",
] as const satisfies readonly IconName[];

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

const MAX_TEXT = 120;
const MAX_LIST_ITEMS = 6;
const MAX_ROWS = 5;
const MAX_STEPS = 5;
const MAX_CARD_CHILDREN = 8;
const MAX_DEPTH = 3;

// Trim, require content, truncate (never fail on length).
const text = (max: number) =>
  z
    .string()
    .trim()
    .min(1, "must not be empty")
    .transform((s) => s.slice(0, max));

function hasKnownType(n: unknown): boolean {
  if (typeof n !== "object" || n === null || !("type" in n)) return false;
  return NODE_TYPES.some((t) => t === n.type);
}

// A row holds blocks side by side, so containers are not allowed inside it.
function fitsInRow(n: unknown): boolean {
  return hasKnownType(n) && typeof n === "object" && n !== null && "type" in n && n.type !== "card" && n.type !== "row";
}

function cardSchema(depth: number) {
  return z
    .object({
      type: z.literal("card"),
      children: z.preprocess(
        // Unknown node types are dropped here, before validation.
        (v) => (Array.isArray(v) ? v.filter(hasKnownType).slice(0, MAX_CARD_CHILDREN) : v),
        z.array(z.lazy(() => nodeSchema(depth + 1))).min(1, "a card needs at least one child"),
      ),
    })
    // A card at depth 3 could only hold depth-4 children.
    .refine(() => depth < MAX_DEPTH, { message: `layout is nested deeper than ${MAX_DEPTH} levels` });
}

function nodeSchema(depth: number): z.ZodType<Node> {
  return z.discriminatedUnion("type", [
    cardSchema(depth),
    z.object({
      type: z.literal("heading"),
      text: text(MAX_TEXT),
      level: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional().catch(undefined),
    }),
    z.object({
      type: z.literal("text"),
      text: text(MAX_TEXT),
      muted: z.boolean().optional().catch(undefined),
    }),
    z.object({
      type: z.literal("button"),
      text: text(MAX_TEXT),
      variant: z.enum(["primary", "secondary", "ghost"]).optional().catch("primary"),
    }),
    z.object({
      type: z.literal("input"),
      label: text(MAX_TEXT),
      placeholder: z
        .string()
        .transform((s) => s.trim().slice(0, MAX_TEXT))
        .optional()
        .catch(undefined),
    }),
    z.object({
      type: z.literal("list"),
      items: z.preprocess(
        (v) => (Array.isArray(v) ? v.slice(0, MAX_LIST_ITEMS) : v),
        z.array(text(MAX_TEXT)).min(1, "a list needs at least one item"),
      ),
    }),
    z.object({ type: z.literal("badge"), text: text(28) }),
    z.object({
      type: z.literal("stat"),
      value: text(20),
      caption: z.string().transform((s) => s.trim().slice(0, 40)).optional().catch(undefined),
    }),
    z.object({
      type: z.literal("rows"),
      items: z.preprocess(
        (v) => (Array.isArray(v) ? v.slice(0, MAX_ROWS) : v),
        z.array(z.object({ label: text(40), value: text(60) })).min(1, "rows needs at least one item"),
      ),
    }),
    z
      .object({
        type: z.literal("steps"),
        items: z.preprocess(
          (v) => (Array.isArray(v) ? v.slice(0, MAX_STEPS) : v),
          z.array(text(60)).min(2, "steps needs at least two items"),
        ),
        current: z.coerce.number().catch(0),
      })
      // Keep the current step inside the list.
      .transform((n) => ({ ...n, current: Math.min(n.items.length - 1, Math.max(0, Math.round(n.current))) })),
    z.object({ type: z.literal("divider") }),
    z.object({
      type: z.literal("avatar"),
      name: text(40),
      caption: z.string().transform((s) => s.trim().slice(0, 60)).optional().catch(undefined),
    }),
    z.object({ type: z.literal("icon"), name: z.enum(ICON_NAMES).catch("sparkles") }),
    z.object({
      type: z.literal("row"),
      // Same depth as its parent: a row is a layout helper, not a nesting level.
      children: z.preprocess(
        (v) => (Array.isArray(v) ? v.filter(fitsInRow).slice(0, 3) : v),
        z.array(z.lazy(() => nodeSchema(depth))).min(1, "a row needs at least one block"),
      ),
    }),
    z.object({
      type: z.literal("progress"),
      value: z.coerce.number().catch(0).transform((n) => Math.round(clamp(n, 0, 100))),
      label: z.string().transform((s) => s.trim().slice(0, 40)).optional().catch(undefined),
    }),
    z.object({ type: z.literal("toggle"), label: text(60), on: z.boolean().catch(false) }),
    z
      .object({
        type: z.literal("chips"),
        items: z.preprocess(
          (v) => (Array.isArray(v) ? v.slice(0, 5) : v),
          z.array(text(24)).min(2, "chips needs at least two items"),
        ),
        selected: z.coerce.number().catch(0),
      })
      .transform((n) => ({ ...n, selected: clamp(Math.round(n.selected), 0, n.items.length - 1) })),
    z.object({
      type: z.literal("rating"),
      // Half stars are allowed.
      value: z.coerce.number().catch(5).transform((n) => Math.round(clamp(n, 0, 5) * 2) / 2),
      caption: z.string().transform((s) => s.trim().slice(0, 40)).optional().catch(undefined),
    }),
    z.object({ type: z.literal("note"), text: text(MAX_TEXT) }),
  ]);
}

const tokensSchema = z.object({
  radius: z
    .coerce.number()
    .transform((n) => Math.round(Math.min(24, Math.max(0, n)) / 2) * 2)
    .catch(DEFAULT_TOKENS.radius),
  primary: z.string().regex(HEX).catch(DEFAULT_TOKENS.primary),
  density: z.enum(DENSITIES).catch(DEFAULT_TOKENS.density),
  shadow: z.enum(SHADOWS).catch(DEFAULT_TOKENS.shadow),
  font: z.enum(FONTS).catch(DEFAULT_TOKENS.font),
  tone: z.enum(TONES).catch(DEFAULT_TOKENS.tone),
  mode: z.enum(MODES).catch(DEFAULT_TOKENS.mode),
  buttonStyle: z.enum(BUTTON_STYLES).catch(DEFAULT_TOKENS.buttonStyle),
  border: z.enum(BORDERS).catch(DEFAULT_TOKENS.border),
  headingWeight: z.enum(HEADING_WEIGHTS).catch(DEFAULT_TOKENS.headingWeight),
  align: z.enum(ALIGNS).catch(DEFAULT_TOKENS.align),
  surface: z.enum(SURFACES_OPTIONS).catch(DEFAULT_TOKENS.surface),
});

const variantSchema = z.object({
  label: text(24),
  applied: text(90),
  tokens: tokensSchema,
  layout: cardSchema(1),
});

const responseSchema = z.object({
  variants: z.preprocess(
    (v) => (Array.isArray(v) ? v.slice(0, 3) : v),
    z.array(variantSchema).min(3, "expected 3 variants"),
  ),
});

// Design rules enforced in code, so they hold whatever the model returns:
// exactly one primary button per variant that has buttons (the first primary keeps it; if there is
// none, the first button is promoted), and no leading, trailing or doubled dividers.
function tidy(node: Node, state: { primaryUsed: boolean }): Node {
  if (node.type === "button") {
    const variant = node.variant ?? "primary";
    if (variant !== "primary") return node;
    if (state.primaryUsed) return { ...node, variant: "secondary" };
    state.primaryUsed = true;
    return { ...node, variant: "primary" };
  }
  if (node.type === "row") return { ...node, children: node.children.map((child) => tidy(child, state)) };
  if (node.type !== "card") return node;
  const children = node.children
    .map((child) => tidy(child, state))
    .filter((child, i, all) => child.type !== "divider" || (i > 0 && all[i - 1].type !== "divider"));
  while (children.length > 1 && children[children.length - 1].type === "divider") children.pop();
  return { ...node, children };
}

// If a variant has buttons but none is primary, the first one becomes the primary action.
function promoteFirstButton(node: Node, state: { done: boolean }): Node {
  if (state.done) return node;
  if (node.type === "button") {
    state.done = true;
    return { ...node, variant: "primary" };
  }
  if (node.type !== "card" && node.type !== "row") return node;
  return { ...node, children: node.children.map((child) => promoteFirstButton(child, state)) };
}

function applyDesignRules(layout: Node): Node {
  const state = { primaryUsed: false };
  const tidied = tidy(layout, state);
  return state.primaryUsed ? tidied : promoteFirstButton(tidied, { done: false });
}

export type ValidationResult =
  | { ok: true; variants: Variant[] }
  | { ok: false; error: string };

export function validateVariants(raw: unknown): ValidationResult {
  const result = responseSchema.safeParse(raw);
  if (!result.success) {
    const issue = result.error.issues[0];
    const path = issue.path.map(String).join(".");
    return { ok: false, error: path ? `${path}: ${issue.message}` : issue.message };
  }
  return {
    ok: true,
    variants: result.data.variants.map((v) => ({
      ...v,
      layout: applyDesignRules(v.layout),
      id: crypto.randomUUID(),
      enforced: [],
    })),
  };
}

// Strict: this comes from our own client, so bad values are a 400, not a default.
const strictTokens = z.object({
  radius: z.number().min(0).max(24),
  primary: z.string().regex(HEX),
  density: z.enum(DENSITIES),
  shadow: z.enum(SHADOWS),
  font: z.enum(FONTS),
  tone: z.enum(TONES),
  mode: z.enum(MODES),
  buttonStyle: z.enum(BUTTON_STYLES),
  border: z.enum(BORDERS),
  headingWeight: z.enum(HEADING_WEIGHTS),
  align: z.enum(ALIGNS),
  surface: z.enum(SURFACES_OPTIONS),
});

const confidence = z.number().min(0).max(1).nullable();

export const profilePayloadSchema: z.ZodType<ProfilePayload> = z.object({
  tokens: strictTokens,
  enforced: z.array(z.enum(TOKEN_KEYS)),
  confidence: z.object({
    radius: confidence,
    primary: confidence,
    density: confidence,
    shadow: confidence,
    font: confidence,
    tone: confidence,
    mode: confidence,
    buttonStyle: confidence,
    border: confidence,
    headingWeight: confidence,
    align: confidence,
    surface: confidence,
  }),
  summary: z.string().max(300).nullable(),
  layout: z
    .object({
      liked: z.array(z.enum(NODE_TYPES)).max(8),
      avoided: z.array(z.enum(NODE_TYPES)).max(8),
      size: z.enum(["lean", "balanced", "rich"]).nullable(),
    })
    .optional(),
});

// ---------- /api/summarize ----------

const summaryAction = z.object({
  kind: z.enum(["pick", "reject", "tweak"]),
  label: z.string().max(40),
  tokens: strictTokens.partial(),
});

export type SummaryAction = z.infer<typeof summaryAction>;

// The client sends the last 10 actions, oldest first; keep the last 10 if more arrive.
export const summarizeRequestSchema = z.object({
  actions: z
    .array(summaryAction)
    .min(1)
    .max(100)
    .transform((actions) => actions.slice(-10)),
});

const MAX_SUMMARY = 140;

// null for anything that is not a usable one-line summary.
export function parseSummary(raw: unknown): string | null {
  const parsed = z.object({ summary: z.string() }).safeParse(raw);
  if (!parsed.success) return null;
  const summary = parsed.data.summary.trim().slice(0, MAX_SUMMARY);
  return summary === "" ? null : summary;
}
