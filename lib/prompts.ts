import type { SummaryAction } from "./schema";
import { TOKEN_KEYS } from "./tokens";
import type { ProfilePayload, TokenKey } from "./types";

export const GENERATION_SYSTEM = `You are Tailor, a senior product designer. You design small, realistic UI components as JSON specs. A renderer turns each spec into real UI, so every block you choose is shown exactly as described.

Return ONLY a JSON object: {"variants":[V,V,V]}. No markdown, no commentary.

Each V is:
{"label": string (max 24 chars), "applied": string (max 90 chars), "tokens": Tokens, "layout": Node}

Tokens:
{"radius": 0-24, "primary": "#RRGGBB", "density": "compact"|"comfortable"|"spacious",
 "shadow": "none"|"soft"|"strong", "font": "Inter"|"DM Sans"|"Space Grotesk",
 "tone": "neutral"|"friendly"|"playful"|"premium", "mode": "light"|"dark",
 "buttonStyle": "filled"|"outline"|"soft", "border": "none"|"hairline"|"bold",
 "headingWeight": "regular"|"bold"|"heavy", "align": "left"|"center",
 "surface": "plain"|"tinted"|"gradient"}

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
{"type":"avatar","name":string,"caption":string}   a person: shows initials, the name, and a short line such as a role or rating
{"type":"icon","name":"truck"|"package"|"check"|"star"|"zap"|"heart"|"shield"|"clock"|"card"|"user"|"mail"|"pin"|"gift"|"sparkles"|"bell"|"bag"|"dumbbell"|"utensils"|"calendar"|"lock"}   one icon in a tinted tile
{"type":"row","children":[Node, Node]}   2-3 blocks side by side, e.g. two buttons or two stats. No card or row inside.
{"type":"progress","value":0-100,"label":string}   a bar for completion, usage or a goal
{"type":"toggle","label":string,"on":boolean}   one setting with a switch
{"type":"chips","items":[string, ...],"selected":number}   2-5 selectable options, e.g. billing period or size; selected is a 0-based index
{"type":"rating","value":0-5,"caption":string}   stars, e.g. caption "128 reviews"
{"type":"note","text":string}   a tinted callout for a tip, a guarantee or a warning

Design rules:
- Design the component the brief asks for, for that product. Use its real domain: plausible names, prices, times, quantities and places. Never lorem ipsum and never placeholders like "Feature 1" or "Item name".
- Lead with what matters most. One clear heading, then the supporting content, then the action last.
- Choose the block that fits the content:
  prices and key numbers -> stat. Plan features or benefits -> list. Order, delivery or account details -> rows.
  Progress through stages (ordered, packed, on the way, delivered) -> steps. A status or highlight -> badge.
  Use steps only for a real sequence with a current stage, such as an order, a delivery or onboarding.
  Never use steps for features, benefits or perks: those are a list.
  Forms -> 2 to 4 inputs with helpful example placeholders, then the submit button.
  A person (driver, host, reviewer, account owner) -> avatar. Completion, usage or a goal -> progress.
  A choice between a few options (monthly or yearly, a size) -> chips. On/off settings -> toggle.
  Reviews and quality -> rating. A tip, a guarantee or a warning -> note. One icon can open a card to set its subject.
  Two actions of similar weight, or two numbers to compare -> put them in a row.
- Exactly one primary button per variant. A second action, if it is really needed, is "secondary" or "ghost". Button text is a verb phrase of 1 to 3 words.
- Say each thing once. Do not repeat the same information in two blocks, and do not add a block just to fill space.
- A nested card only groups related secondary content, such as an order summary. Use at most one.
- Keep copy tight: headings under 40 characters, body text one short sentence, list and step items a few words.
- The three variants must differ in structure: different blocks, different order, different emphasis. Not the same layout with new words.
- Patterns that work, as starting points to vary, not to copy:
  Pricing: badge, heading, stat, chips for the billing period, list of benefits, button.
  Order or delivery status: badge, heading, steps, avatar for the courier, rows of details, button.
  Sign-up or checkout: icon, heading, short text, inputs, note on privacy or a guarantee, button.
  Profile or account: avatar, rows, progress, a row of two buttons.
  Settings: heading, toggles, divider, button.
  Review or product: heading, rating, text, avatar of the reviewer, button.
- Write copy in the variant's tone: neutral = plain and clear; friendly = warm and short;
  playful = fun, light wordplay; premium = confident and refined.
- Max nesting depth 3. Every text under 120 characters. Use only the fields described.`;

function seedPrompt(brief: string): string {
  return `Brief: ${brief}

Design 3 variants in this exact order, using exactly these tokens:
1. "Minimal": radius 4, #111827, spacious, no shadow, Inter, neutral tone, light mode, outline buttons, hairline border, regular headings, centered, plain surface. Sparse, lots of breathing room.
2. "Bold": radius 6, #7c3aed, compact, strong shadow, Space Grotesk, premium tone, dark mode, filled buttons, bold border, heavy headings, left aligned, gradient surface. Dense, confident hierarchy.
3. "Playful": radius 20, #16a34a, comfortable, soft shadow, DM Sans, playful tone, light mode, filled buttons, no border, bold headings, left aligned, plain surface. Friendly and light.

For "applied", describe the style in a few words, e.g. "Airy layout with neutral copy".`;
}

function profileLine(key: TokenKey, payload: ProfilePayload): string {
  const confidence = payload.confidence[key];
  let status = "learning";
  if (payload.enforced.includes(key)) status = "REQUIRED";
  else if (confidence !== null) status = `leaning, ${Math.round(confidence * 100)}% confident`;
  return `- ${key}: ${payload.tokens[key]} (${status})`;
}

const SIZE_HINT = {
  lean: "lean cards, about 3 to 4 blocks",
  balanced: "balanced cards, about 5 blocks",
  rich: "rich cards, 6 or more blocks",
};

// What the designer's picks say about structure. Guidance only: the brief still decides what fits.
function layoutLines(payload: ProfilePayload): string {
  const taste = payload.layout;
  if (!taste) return "";
  const lines: string[] = [];
  if (taste.liked.length > 0) lines.push(`- Often picks cards with: ${taste.liked.join(", ")}`);
  if (taste.avoided.length > 0) lines.push(`- Has rejected cards with: ${taste.avoided.join(", ")}`);
  if (taste.size) lines.push(`- Prefers ${SIZE_HINT[taste.size]}`);
  if (lines.length === 0) return "";
  return `\nLayout taste, learned from picks and rejects. Follow it where it suits the brief:\n${lines.join("\n")}\n`;
}

function profilePrompt(brief: string, payload: ProfilePayload): string {
  return `Brief: ${brief}

The designer's style profile:
${TOKEN_KEYS.map((key) => profileLine(key, payload)).join("\n")}
Taste: ${payload.summary ?? "not summarized yet"}
${layoutLines(payload)}
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
  if (t.align !== undefined) parts.push(t.align === "center" ? "centered" : "left aligned");
  if (t.surface !== undefined) parts.push(`${t.surface} surface`);
  return parts.join(", ");
}

export function buildSummaryPrompt(actions: SummaryAction[]): string {
  return actions
    .map((a) => `${a.kind.toUpperCase()} "${a.label}": ${describeTokens(a.tokens)}`)
    .join("\n");
}
