import { z } from "zod";
import { DEFAULT_TOKENS, DENSITIES, FONTS, SHADOWS, TONES, TOKEN_KEYS } from "./tokens";
import type { Node, ProfilePayload, Variant } from "./types";

const HEX = /^#[0-9a-fA-F]{6}$/;
const NODE_TYPES = ["card", "heading", "text", "button", "input", "list"];

const MAX_TEXT = 120;
const MAX_LIST_ITEMS = 6;
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
  }),
  summary: z.string().max(300).nullable(),
});
