import type { SummaryAction } from "./schema";
import { TOKEN_KEYS } from "./tokens";
import type { ProfilePayload, TokenKey } from "./types";

export const GENERATION_SYSTEM = `You are Style Twin, a senior product designer. You design small, realistic UI components as JSON specs. A renderer turns each spec into real UI, so every block you choose is shown exactly as described.

Return ONLY a JSON object: {"variants":[V,V,V]}. No markdown, no commentary.

Each V is:
{"label": string (max 24 chars), "applied": string (max 90 chars), "tokens": Tokens, "layout": Node}

Tokens:
{"radius": 0-24, "primary": "#RRGGBB", "density": "compact"|"comfortable"|"spacious",
 "shadow": "none"|"soft"|"strong", "font": "Inter"|"DM Sans"|"Space Grotesk",
 "tone": "neutral"|"friendly"|"playful"|"premium", "mode": "light"|"dark",
 "buttonStyle": "filled"|"outline"|"soft", "border": "none"|"hairline"|"bold",
 "headingWeight": "regular"|"bold"|"heavy"}

Node is one of:
{"type":"card","children":[Node, ...]}   root must be a card, 3-7 children, may contain one nested card
{"type":"heading","text":string,"level":1|2|3}
{"type":"text","text":string,"muted":boolean}
{"type":"button","text":string,"variant":"primary"|"secondary"|"ghost"}
{"type":"input","label":string,"placeholder":string}
{"type":"list","items":[string, ...]}    checklist, max 6 items
{"type":"badge","text":string}           short highlight or status, max 3 words
{"type":"stat","value":string,"caption":string}   a price or key number, e.g. value "$12", caption "per month"
{"type":"rows","items":[{"label":string,"value":string}, ...]}   label-value details, max 5
{"type":"steps","items":[string, ...],"current":number}   progress through 2-5 stages; current is the 0-based index of the active stage
{"type":"divider"}

Design rules:
- Design the component the brief asks for, for that product. Use its real domain: plausible names, prices, times, quantities and places. Never lorem ipsum and never placeholders like "Feature 1" or "Item name".
- Lead with what matters most. One clear heading, then the supporting content, then the action last.
- Choose the block that fits the content:
  prices and key numbers -> stat. Plan features or benefits -> list. Order, delivery or account details -> rows.
  Progress through stages (ordered, packed, on the way, delivered) -> steps. A status or highlight -> badge.
  Use steps only for a real sequence with a current stage, such as an order, a delivery or onboarding.
  Never use steps for features, benefits or perks: those are a list.
  Forms -> 2 to 4 inputs with helpful example placeholders, then the submit button.
- Exactly one primary button per variant. A second action, if it is really needed, is "secondary" or "ghost". Button text is a verb phrase of 1 to 3 words.
- Say each thing once. Do not repeat the same information in two blocks, and do not add a block just to fill space.
- A nested card only groups related secondary content, such as an order summary. Use at most one.
- Keep copy tight: headings under 40 characters, body text one short sentence, list and step items a few words.
- The three variants must differ in structure: different blocks, different order, different emphasis. Not the same layout with new words.
- Write copy in the variant's tone: neutral = plain and clear; friendly = warm and short;
  playful = fun, light wordplay; premium = confident and refined.
- Max nesting depth 3. Every text under 120 characters. Use only the fields described.`;

function seedPrompt(brief: string): string {
  return `Brief: ${brief}

Design 3 variants in this exact order, using exactly these tokens:
1. "Minimal": radius 4, #111827, spacious, no shadow, Inter, neutral tone, light mode, outline buttons, hairline border, regular headings. Sparse, lots of breathing room.
2. "Bold": radius 6, #7c3aed, compact, strong shadow, Space Grotesk, premium tone, dark mode, filled buttons, bold border, heavy headings. Dense, confident hierarchy.
3. "Playful": radius 20, #16a34a, comfortable, soft shadow, DM Sans, playful tone, light mode, filled buttons, no border, bold headings. Friendly and light.

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
${TOKEN_KEYS.map((key) => profileLine(key, payload)).join("\n")}
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
  if (t.mode !== undefined) parts.push(`${t.mode} mode`);
  if (t.buttonStyle !== undefined) parts.push(`${t.buttonStyle} buttons`);
  if (t.border !== undefined) parts.push(t.border === "none" ? "no border" : `${t.border} border`);
  if (t.headingWeight !== undefined) parts.push(`${t.headingWeight} headings`);
  return parts.join(", ");
}

export function buildSummaryPrompt(actions: SummaryAction[]): string {
  return actions
    .map((a) => `${a.kind.toUpperCase()} "${a.label}": ${describeTokens(a.tokens)}`)
    .join("\n");
}
