import type { SummaryAction } from "./schema";
import type { ProfilePayload, TokenKey } from "./types";

export const GENERATION_SYSTEM = `You are Style Twin, a UI co-designer. You design small UI components as JSON specs.

Return ONLY a JSON object: {"variants":[V,V,V]}. No markdown, no commentary.

Each V is:
{"label": string (max 24 chars), "applied": string (max 90 chars), "tokens": Tokens, "layout": Node}

Tokens:
{"radius": 0-24, "primary": "#RRGGBB", "density": "compact"|"comfortable"|"spacious",
 "shadow": "none"|"soft"|"strong", "font": "Inter"|"DM Sans"|"Space Grotesk",
 "tone": "neutral"|"friendly"|"playful"|"premium"}

Node is one of:
{"type":"card","children":[Node, ...]}   root must be a card, 1-8 children, may contain one nested card
{"type":"heading","text":string,"level":1|2|3}
{"type":"text","text":string,"muted":boolean}
{"type":"button","text":string,"variant":"primary"|"secondary"|"ghost"}
{"type":"input","label":string,"placeholder":string}
{"type":"list","items":[string, ...]}    max 6 items

Rules:
- Max nesting depth 3. Every text under 120 characters.
- Realistic copy for the brief. Never lorem ipsum.
- Write copy in the variant's tone: neutral = plain and clear; friendly = warm and short;
  playful = fun, light wordplay; premium = confident and refined.
- Use the component types only as described. No other fields.`;

const TOKEN_ORDER: TokenKey[] = ["radius", "primary", "density", "shadow", "font", "tone"];

function seedPrompt(brief: string): string {
  return `Brief: ${brief}

Design 3 variants in this exact order, using exactly these tokens:
1. "Minimal": radius 4, #111827, spacious, no shadow, Inter, neutral tone. Sparse, lots of breathing room.
2. "Bold": radius 6, #7c3aed, compact, strong shadow, Space Grotesk, premium tone. Dense, confident hierarchy.
3. "Playful": radius 20, #16a34a, comfortable, soft shadow, DM Sans, playful tone. Friendly and light.

For "applied", describe the style in a few words, e.g. "Airy layout with neutral copy".`;
}

function profileLine(key: TokenKey, payload: ProfilePayload): string {
  const confidence = payload.confidence[key];
  let status = "learning";
  if (payload.enforced.includes(key)) status = "REQUIRED";
  else if (confidence !== null) status = `leaning, ${Math.round(confidence * 100)}% confident`;
  return `- ${key}: ${payload.tokens[key]} (${status})`;
}

function profilePrompt(brief: string, payload: ProfilePayload): string {
  return `Brief: ${brief}

The designer's style profile:
${TOKEN_ORDER.map((key) => profileLine(key, payload)).join("\n")}
Taste: ${payload.summary ?? "not summarized yet"}

All 3 variants share this style. Tokens marked REQUIRED must be used exactly.
For the others, stay close to the profile value.
Make the 3 variants differ in layout, hierarchy, and copy, not style.
"label" names the layout, e.g. "Stacked", "Feature list", "Compact row".
"applied" names the profile values you used, e.g. "Your 16px radius, compact spacing and friendly copy".`;
}

export function buildUserPrompt(brief: string, payload: ProfilePayload | null): string {
  return payload === null ? seedPrompt(brief) : profilePrompt(brief, payload);
}

// ---------- Summary (SPEC 10.4) ----------

export const SUMMARY_SYSTEM = `You describe a designer's visual taste from their actions on UI variants.
Return ONLY JSON: {"summary": string}.
One sentence, under 15 words, plain words. No raw values like "radius 16" or hex codes.
Picks and tweaks are likes. Rejects are dislikes.`;

function describeTokens(t: SummaryAction["tokens"]): string {
  const parts: string[] = [];
  if (t.radius !== undefined) parts.push(`radius ${t.radius}`);
  if (t.primary !== undefined) parts.push(`color ${t.primary}`);
  if (t.density !== undefined) parts.push(t.density);
  if (t.shadow !== undefined) parts.push(`${t.shadow} shadow`);
  if (t.font !== undefined) parts.push(t.font);
  if (t.tone !== undefined) parts.push(`${t.tone} tone`);
  return parts.join(", ");
}

export function buildSummaryPrompt(actions: SummaryAction[]): string {
  return actions
    .map((a) => `${a.kind.toUpperCase()} "${a.label}": ${describeTokens(a.tokens)}`)
    .join("\n");
}
