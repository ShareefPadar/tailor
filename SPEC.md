# Style Twin — Technical Spec

Implementation details for `PRD.md`. If something here is ambiguous, ask before inventing.

---

## 1. Stack and dependencies

- Next.js (App Router), TypeScript in strict mode, React, Tailwind CSS.
- Runtime dependencies allowed: `zod`, `@google/genai`, `lucide-react`.
- Dev dependencies allowed: `vitest`, `tsx`.
- **Nothing else.** No UI kits, no state libraries, no database, no auth, no animation libraries.

## 2. Environment

`.env.local` (never committed) and Vercel project env:

```
GEMINI_API_KEY=your_key
GEMINI_MODEL=exact_model_id_from_ai_studio
```

If either is missing, API routes return `500 { "error": "missing_config" }` and log which variable is missing.

## 3. File structure

```
app/
  layout.tsx              fonts (next/font), metadata, shell
  page.tsx                main screen ("use client")
  playground/page.tsx     renders hand-written specs for testing the renderer
  globals.css
  api/generate/route.ts
  api/summarize/route.ts
components/
  ui.ts                   shared class strings (buttons, labels, surfaces)
  Toolbar.tsx             app name, round title, reset
  RoundsSidebar.tsx       list of rounds, selects the one shown
  Canvas.tsx              empty, loading, error and round states + prompt bar
  EmptyState.tsx          first-visit preset cards
  BriefBar.tsx            floating prompt bar: input, send button, preset chips
  RoundView.tsx           read-only banner + VariantGrid
  VariantGrid.tsx
  VariantCard.tsx         frame, label, note, chips, actions
  TweakPopover.tsx
  TokenControl.tsx        one editing control per token (tweak and edit)
  ProfilePanel.tsx        summary, token rows, change log
  TokenRow.tsx
  ChangeLog.tsx
  render/Render.tsx       renders a Node tree with tokens
lib/
  types.ts
  tokens.ts               defaults, seeds, token-to-style mapping, contrastText
  schema.ts               zod schemas, validateVariants()
  profile.ts              initialProfile, updateProfile, confidence, enforcement
  profile.test.ts
  prompts.ts              prompt builders
  llm.ts                  generateJSON() wrapper (only file that touches the SDK)
  generate.ts             generateVariants() core, used by route and script
  presets.ts
  store.ts                useReducer state
  useTasteSummary.ts      debounced call to /api/summarize
data/
  preset-cache.json       starts as {}
scripts/
  cache-presets.ts
```

## 4. Types (`lib/types.ts`)

```ts
export type Density = "compact" | "comfortable" | "spacious";
export type Shadow = "none" | "soft" | "strong";
export type FontName = "Inter" | "DM Sans" | "Space Grotesk";
export type Tone = "neutral" | "friendly" | "playful" | "premium";

export interface Tokens {
  radius: number;      // 0–24, even integers
  primary: string;     // "#RRGGBB"
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
  applied: string;        // one-line "what I applied" note
  tokens: Tokens;
  layout: Node;           // root is always a card
  enforced: TokenKey[];   // tokens overwritten by code (shown as chips)
}

export type ActionKind = "pick" | "reject" | "tweak" | "edit";

export interface Action {
  id: string;
  kind: ActionKind;
  round: number;
  variantLabel: string;     // "" for edit
  tokens: Partial<Tokens>;  // full tokens for pick/reject; changed tokens only for tweak/edit
  at: number;               // Date.now()
}

export interface ChangeLogEntry {
  id: string;
  token: TokenKey;
  from: string;   // display string, e.g. "8px", "#2563eb", "Inter"
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
  log: ChangeLogEntry[];   // newest first
}

// Sent to /api/generate. null means "no profile yet, use seeds".
export interface ProfilePayload {
  tokens: Tokens;
  enforced: TokenKey[];
  confidence: Record<TokenKey, number | null>;
  summary: string | null;
}
```

## 5. Tokens (`lib/tokens.ts`)

### 5.1 Defaults

```ts
export const DEFAULT_TOKENS: Tokens = {
  radius: 8, primary: "#2563eb", density: "comfortable",
  shadow: "soft", font: "Inter", tone: "neutral",
};
```

### 5.2 Round 1 seeds (fixed order)

| Index | Label | radius | primary | density | shadow | font | tone |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | Minimal | 4 | #111827 | spacious | none | Inter | neutral |
| 1 | Bold | 6 | #7c3aed | compact | strong | Space Grotesk | premium |
| 2 | Playful | 20 | #16a34a | comfortable | soft | DM Sans | playful |

### 5.3 Token-to-style mapping

`tokensToStyle(tokens)` returns a `React.CSSProperties` object of CSS variables applied on the Render root. Inline styles are allowed **only** in the renderer.

| Variable | Source | Value |
| --- | --- | --- |
| `--st-radius` | radius | `{radius}px` (card) |
| `--st-radius-sm` | radius | `{Math.round(radius * 0.6)}px` (button, input) |
| `--st-primary` | primary | hex |
| `--st-on-primary` | primary | `contrastText(primary)` |
| `--st-font` | font | Inter → `var(--font-inter)`, DM Sans → `var(--font-dm-sans)`, Space Grotesk → `var(--font-space-grotesk)` |
| `--st-shadow` | shadow | none → `none`; soft → `0 1px 3px rgba(0,0,0,.08), 0 4px 12px rgba(0,0,0,.06)`; strong → `0 10px 30px rgba(0,0,0,.18)` |

Density:

| density | card padding | gap | button padding | base font size |
| --- | --- | --- | --- | --- |
| compact | 16px | 8px | 8px 14px | 14px |
| comfortable | 24px | 12px | 10px 18px | 15px |
| spacious | 32px | 16px | 12px 22px | 16px |

Tone affects copy only (AI). No CSS.

`contrastText(hex)`: relative luminance > 0.5 → `#111827`, else `#ffffff`.

Fonts are loaded in `app/layout.tsx` with `next/font/google` (`Inter`, `DM_Sans`, `Space_Grotesk`), each with a `variable` option, and the variables added to `<html>`.

## 6. Renderer (`components/render/Render.tsx`)

`<Render spec={node} tokens={tokens} />` walks the tree.

- **card:** white background, `--st-radius`, `--st-shadow`, padding and gap from density, flex column, `width: 100%`, `max-width: 300px`, 1px border `#e4e4e7` only when shadow is `none`. A nested card renders with background `#f4f4f5`, no shadow.
- **heading:** level 1 = 24px, 2 = 20px, 3 = 17px; weight 600; default level 2.
- **text:** base size; `muted` → color `#71717a`.
- **button:** full width; `--st-radius-sm`. primary = `--st-primary` background, `--st-on-primary` text. secondary = 1px `--st-primary` border, `--st-primary` text, transparent. ghost = `--st-primary` text, no border.
- **input:** label above (13px, weight 500), static non-functional box with placeholder text in `#a1a1aa`, 1px `#d4d4d8` border, `--st-radius-sm`.
- **list:** each item prefixed with a check icon (lucide `Check`, 16px) in `--st-primary`.
- Unknown node types never reach the renderer (schema strips them), but render `null` defensively.
- All text uses `--st-font`.

## 7. Validation (`lib/schema.ts`)

Zod schemas with `z.lazy` for the recursive Node. `validateVariants(raw: unknown)` returns `{ ok: true, variants }` or `{ ok: false, error: string }` (first issue, human-readable).

Rules:
- Top level must be `{ variants: [...] }`. More than 3 → keep first 3. Fewer than 3 → invalid.
- Root layout must be a card. Max depth 3. A card has 1–8 children.
- Text fields trimmed, max 120 chars (truncate, don't fail). List items max 6 (truncate).
- `radius`: coerce to number, clamp 0–24, round to even.
- `primary`: must match `/^#[0-9a-fA-F]{6}$/`, else default.
- Enums: invalid value → default (use `.catch()`), don't fail.
- Unknown node types: drop the node. If a card ends up empty, invalid.
- `label` max 24 chars, `applied` max 90 chars (truncate).

Validated variants get `id: crypto.randomUUID()` and `enforced: []` before enforcement.

## 8. Style profile logic (`lib/profile.ts`)

All functions are **pure**. No React, no fetch.

### 8.1 Initial profile

`initialProfile()`: `DEFAULT_TOKENS`, all locks false, all scores 0, no samples, no actions, summary null, empty log.

`hasProfile(p)`: true if `p.actions` contains any `pick`, `tweak`, or `edit`. (Rejects alone don't count.)

### 8.2 `updateProfile(profile, action): Profile`

Append the action to `actions`, then apply per kind. **Locked tokens are skipped by pick, reject, and tweak.**

| Kind | radius | primary | category tokens |
| --- | --- | --- | --- |
| pick (weight 1) | push sample `{value, 1}`; new value = weighted average of all samples, rounded to nearest even, clamped 0–24 | set to the picked value | `score += 1`, then winner rule |
| reject (weight −0.5) | ignored | ignored | `score -= 0.5`, then winner rule |
| tweak (weight 2) | push sample `{value, 2}`; set value **directly** to the tweaked value | set directly | `score += 2`; set value **directly** |
| edit | set directly; `locked = true` | set directly; `locked = true` | set directly; `locked = true` |

Tweak and edit only touch the tokens present in `action.tokens`.

**Winner rule (categories):** find the option with the highest score. Switch to it only if its score is > 0 **and** strictly greater than the current value's score. Ties with the current value keep the current value. Ties between other options: first in the type's option order.

For every token whose value changed, prepend a `ChangeLogEntry` (8.6) with `id = \`${action.id}-${token}\`` and `at = action.at`. No `Date.now()` or random ids inside `lib/profile.ts`; the reducer creates the action's `id` and `at`.

### 8.3 Signals

`signals(profile, key)` = number of `pick` actions + number of `tweak` actions whose `tokens` include `key`. Rejects and edits don't count.

### 8.4 Confidence

`confidence(profile, key): number | null` (0–1)

- Locked → `1`.
- `signals < 2` → `null` (UI shows "Learning…" instead of a bar).
- radius: sum of weights of samples within ±4px of the current value ÷ sum of all sample weights.
- primary: pick and tweak actions whose `primary` equals the current value (case-insensitive) ÷ pick and tweak actions that include `primary`.
- category: `max(0, score[current])` ÷ sum of positive scores for that key (0 if the sum is 0).

### 8.5 Enforcement

`enforcedKeys(profile)`: keys where `locked` OR (`confidence !== null` AND `confidence >= 0.6`).

`toPayload(profile): ProfilePayload | null` returns null when `!hasProfile(profile)`.

`applyEnforcement(variants, payload)` (runs on the server after validation):
- `payload === null` → variant `i` gets `SEEDS[i].tokens` and `SEEDS[i].label`; `enforced = []`.
- Otherwise → for each key in `payload.enforced`, overwrite `variant.tokens[key]` with `payload.tokens[key]`; set `variant.enforced = payload.enforced`.

### 8.6 Change log reasons

Display names: Radius, Color, Density, Shadow, Font, Tone. Display values: radius `"16px"`, color hex, others as-is with first letter capitalized.

| Situation | Reason text |
| --- | --- |
| Pick, radius, 1 sample | `From the {label} variant you picked` |
| Pick, radius, 2+ samples | `Average of your {n} picks and tweaks` |
| Pick, color | `From the {label} variant you picked` |
| Pick, category, winner score 1 | `From the {label} variant you picked` |
| Pick, category, winner score > 1 | `{Value} leads your picks ({score} pts)` |
| Reject causes a category switch | `You rejected {old value}` |
| Tweak | `You tweaked it on {label}` |
| Edit | `You set it (locked)` |

Format scores without trailing `.0` (e.g. `2.5 pts`, `3 pts`).

### 8.7 Worked example (also the main unit test)

Start: `initialProfile()`. Round 1 variants use seeds.

**Action 1 — pick Playful** (20, #16a34a, comfortable, soft, DM Sans, playful)
- radius samples `[20×1]` → 20. Log: Radius 8px → 20px, "From the Playful variant you picked".
- primary → #16a34a. Log.
- density comfortable = 1; already current → no log.
- shadow soft = 1; already current → no log.
- font DM Sans = 1 > Inter 0 → DM Sans. Log.
- tone playful = 1 > neutral 0 → playful. Log.
- Expected: 4 log entries. All confidences `null` (1 signal each).

**Action 2 — reject Bold** (6, #7c3aed, compact, strong, Space Grotesk, premium)
- compact −0.5, strong −0.5, Space Grotesk −0.5, premium −0.5. radius and primary untouched.
- Expected: no token changes, no log entries.

**Round 2** — payload has `enforced: []`, so the AI only leans toward the profile.

**Action 3 — pick a round 2 variant** (12, #16a34a, comfortable, soft, DM Sans, friendly)
- radius samples `[20×1, 12×1]` → avg 16 → 16. Log: Radius 20px → 16px, "Average of your 2 picks and tweaks".
- primary unchanged. density 2, shadow 2, font DM Sans 2 — all unchanged.
- tone: playful 1, friendly 1 → tie with current → stays playful.
- Expected confidences: radius 1.0 (both samples within ±4 of 16), primary 1.0, density 1.0, shadow 1.0, font 1.0, tone 0.5.
- Expected `enforcedKeys`: radius, primary, density, shadow, font. Not tone.

**Action 4 — tweak tone to friendly**
- friendly = 1 + 2 = 3; tone set directly → friendly. Log: Tone Playful → Friendly, "You tweaked it on {label}".
- Expected tone confidence: 3 ÷ (1 + 3) = 0.75, signals 3 → tone now enforced too.

**Lock tests**
- Edit radius to 24 → radius 24, locked, log "You set it (locked)". Then pick a variant with radius 4 → radius stays 24, no log.
- Unlock radius → next pick recalculates from samples (the edit added no sample).

**Edge tests**
- Reject only (no picks) → `hasProfile` false, no token changes.
- Samples averaging 13 → rounds to 14. Tweak to 30 is impossible (UI caps at 24), but `updateProfile` clamps anyway.

## 9. API

### 9.1 `lib/llm.ts`

```ts
export async function generateJSON(opts: {
  system: string;
  user: string;
  temperature: number;
}): Promise<unknown>
```

- Uses `@google/genai`: `new GoogleGenAI({ apiKey })`, `ai.models.generateContent({ model, contents: user, config: { systemInstruction: system, temperature, responseMimeType: "application/json" } })`, read `response.text`.
- Strip ```` ```json ```` fences if present, then `JSON.parse`.
- 20 s timeout per call (`Promise.race`). Throws on timeout or parse failure.
- This is the **only** file that imports the SDK, so switching providers means changing one file.

### 9.2 `lib/generate.ts`

```ts
export async function generateVariants(brief: string, payload: ProfilePayload | null): Promise<Variant[]>
```

1. Build prompts (§10). Temperature 0.9 if `payload === null`, else 0.4.
2. Call `generateJSON`, then `validateVariants`.
3. Invalid → retry once, appending to the user prompt: `Your previous reply was invalid: {error}. Return valid JSON only.`
4. Still invalid → throw `GenerationError`.
5. Add ids, run `applyEnforcement`, return.

### 9.3 `POST /api/generate`

`export const maxDuration = 45;`

Request:
```json
{ "brief": "string, 1–200 chars", "profile": "ProfilePayload | null" }
```

Responses:
- `200 { "variants": Variant[3], "source": "llm" | "cache" }`
- `400 { "error": "Brief must be 1–200 characters" }`
- `502 { "error": "generation_failed" }` after retry, or timeout
- `500 { "error": "missing_config" }`

If `profile === null` and the trimmed brief exactly matches a key in `data/preset-cache.json`, return the cached variants with fresh ids and `source: "cache"`, without calling the LLM.

### 9.4 Presets (`lib/presets.ts`)

| Chip label | Brief |
| --- | --- |
| Pricing card | Pricing card for a food delivery subscription |
| Sign-up form | Sign-up form for a fitness app |
| Order status | Order status card for a grocery delivery app |

`scripts/cache-presets.ts` calls `generateVariants(brief, null)` for each preset and writes `data/preset-cache.json` as `{ [brief]: Variant[] }` (ids stripped). npm script: `"cache-presets": "tsx --env-file=.env.local scripts/cache-presets.ts"`. Commit the output.

### 9.5 `POST /api/summarize`

Request: `{ "actions": [{ "kind": "pick" | "reject" | "tweak", "label": string, "tokens": Partial<Tokens> }] }` (last 10, oldest first).

Response: always `200 { "summary": string | null }`. Any failure returns `null`. Temperature 0.3. No retry.

Client calls it **1.5 s after the last action** (debounced), only if `hasProfile`. A non-null result replaces `profile.summary`.

## 10. Prompts (`lib/prompts.ts`)

### 10.1 Generation system prompt

```text
You are Style Twin, a UI co-designer. You design small UI components as JSON specs.

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
- Use the component types only as described. No other fields.
```

### 10.2 Generation user prompt — no profile

```text
Brief: {brief}

Design 3 variants in this exact order, using exactly these tokens:
1. "Minimal": radius 4, #111827, spacious, no shadow, Inter, neutral tone. Sparse, lots of breathing room.
2. "Bold": radius 6, #7c3aed, compact, strong shadow, Space Grotesk, premium tone. Dense, confident hierarchy.
3. "Playful": radius 20, #16a34a, comfortable, soft shadow, DM Sans, playful tone. Friendly and light.

For "applied", describe the style in a few words, e.g. "Airy layout with neutral copy".
```

### 10.3 Generation user prompt — with profile

```text
Brief: {brief}

The designer's style profile:
{one line per token: "- radius: 16 (REQUIRED)" or "- tone: friendly (leaning, 50% confident)" or "- font: DM Sans (learning)"}
Taste: {summary or "not summarized yet"}

All 3 variants share this style. Tokens marked REQUIRED must be used exactly.
For the others, stay close to the profile value.
Make the 3 variants differ in layout, hierarchy, and copy, not style.
"label" names the layout, e.g. "Stacked", "Feature list", "Compact row".
"applied" names the profile values you used, e.g. "Your 16px radius, compact spacing and friendly copy".
```

Line format per token: enforced → `(REQUIRED)`; confidence not null → `(leaning, {pct}% confident)`; null → `(learning)`.

### 10.4 Summary prompts

System:
```text
You describe a designer's visual taste from their actions on UI variants.
Return ONLY JSON: {"summary": string}.
One sentence, under 15 words, plain words. No raw values like "radius 16" or hex codes.
Picks and tweaks are likes. Rejects are dislikes.
```

User: one line per action, e.g.
`PICK "Playful": radius 20, color #16a34a, comfortable, soft shadow, DM Sans, playful tone`

## 11. Client state (`lib/store.ts`)

```ts
interface Round {
  id: string;
  number: number;
  brief: string;
  variants: Variant[];
  marks: Record<string, "picked" | "rejected">;
  source: "llm" | "cache";
}

interface AppState {
  rounds: Round[];               // oldest first; last is current
  profile: Profile;
  status: "idle" | "loading" | "error";
  lastBrief: string | null;      // for "Try again"
}
```

Reducer actions: `GENERATE_START`, `GENERATE_SUCCESS`, `GENERATE_ERROR`, `PICK`, `REJECT`, `TWEAK`, `EDIT_TOKEN`, `TOGGLE_LOCK`, `SET_SUMMARY`, `RESET`.

Rules:
- Only the current round is interactive. Earlier rounds are read-only.
- One pick per round. After a pick, Pick buttons in that round disable; Reject stays available on unpicked, unrejected variants.
- A variant can be rejected once; a picked variant can't be rejected.
- Tweak is available on any current-round variant, any number of times. Each Apply is one tweak action with only the changed tokens.
- `GENERATE_ERROR` never changes the profile or existing rounds.
- `RESET` returns to the initial state (empty rounds, initial profile).

## 12. UI

An editor layout, as in Figma or Stitch, in an Apple-inspired light style. Inspired only: no Apple logo, name or assets.

### 12.1 Design language

Theme tokens live in `app/globals.css` and are used through Tailwind classes. Shared class strings live in `components/ui.ts`.

- **Type:** `-apple-system, BlinkMacSystemFont, "SF Pro Text", var(--font-inter), system-ui, sans-serif`. 13px UI text, 11px uppercase section labels, 17px summary.
- **Colour (light only, monochrome):** canvas `#f5f5f7`, hairlines `black/8`, text `#1d1d1f` (ink), secondary `#6e6e73` (ink-2). The accent is ink. Red is used only for the error state.
- **Workspace background (`bg-dots`):** the canvas colour with a 22px dot grid, as in Stitch or Miro, over a very faint colour wash.
- **Liquid glass (`glass`):** translucent white gradient, 22px backdrop blur with raised saturation, a bright top edge and a soft drop shadow. Used for the navigation and control layer: toolbar, both side panels, prompt bar, preset chips and cards, error banner, tweak popover. Content surfaces (variant frames) stay opaque white. Falls back to opaque white under `prefers-reduced-transparency`.
- **Shape and depth:** panels 12–16px radius, controls 8–10px, pills fully round, soft two-layer shadows.
- **Motion:** 150–200ms ease-out, CSS only, disabled under `prefers-reduced-motion`.
- **Profile tokens only style the variant previews, never the shell.**

### 12.2 Layout

- Every panel floats over the dotted workspace with 12px gaps and 16px corner radius.
- **Toolbar** (48px, glass): app mark and "Style Twin" on the left; the shown round's title `Round {n} · "{brief}"` centred (the tagline "An AI co-designer that learns your style." when there are no rounds); "Reset" on the right.
- **Body ≥ 1024px:** three panes filling the viewport, each scrolling on its own: rounds sidebar `200px`, canvas `1fr`, inspector `300px` (`220px` and `320px` from 1536px).
- **Body < 1024px:** one scrolling column: rounds as a horizontal strip, canvas, inspector underneath, prompt bar sticky at the bottom.

### 12.3 Rounds sidebar

Titled "Rounds". One row per round, oldest first: number, truncated brief, and `Picked: {label}` when the round has a pick. The current round is the last row. Clicking a row shows that round on the canvas. Earlier rounds are read-only and the canvas shows a "Back to current" control. Empty: "No rounds yet."

### 12.4 Canvas

- Transparent, so the dotted workspace shows through.
- **VariantGrid:** 3 columns when the canvas is at least 640px wide (container query), otherwise 1.
- **VariantCard (a frame):** the label above the frame, with a "Picked" or "Rejected" badge. Frame: white, hairline border, 16px radius, min-height 360px, content centred. Below: the applied note, chips `Uses: 16px · #16a34a · Compact` when `enforced` is non-empty, then actions Pick (primary), Reject (secondary), Tweak (ghost). Earlier rounds show no actions.
  - Picked: ink ring around the frame. Rejected: frame at 50% opacity. After a pick, unpicked frames go to 70% opacity until rejected or the next round.
- **Prompt bar (BriefBar):** floats at the bottom centre of the canvas: glass, pill-shaped, input (placeholder: "Describe a component, e.g. pricing card for a food delivery app") and a round send button. Disabled while loading or when the input is empty. Enter submits. Three preset chips sit above it; tapping one fills the input and generates.
- **TweakPopover:** glass panel anchored to its frame. Controls: radius slider 0–24 step 2; color via 6 swatches (#111827, #2563eb, #7c3aed, #16a34a, #e11d48, #ea580c) plus native color input; density segmented control; tone select. The card preview updates live. Apply commits a tweak action with changed tokens only. Cancel reverts. Escape closes.

### 12.5 Inspector (ProfilePanel)

- Title "Style Profile".
- Summary: 17px. Empty profile: "No style learned yet. Pick a variant to start."
- Token rows: name, value (color shows a swatch), confidence bar (0–100%) or "Learning…", lock icon button (lucide `Lock` / `LockOpen`). Clicking the value opens the same control as Tweak for that token; saving dispatches `EDIT_TOKEN`.
- Changed tokens get a 1.5 s highlight after an update (CSS animation, no library).
- Change log titled "What I learned": newest first, max 10 shown, each as `Radius 8px → 16px` with the reason underneath.
- Reset lives in the toolbar: "Reset" → `window.confirm("Clear everything Style Twin has learned?")`.

### 12.6 States and copy

| State | Copy / behavior |
| --- | --- |
| Loading | 3 skeleton frames, "Designing 3 options…" |
| Error | "Couldn't generate this time. Try again." + "Try again" button (re-sends `lastBrief`) |
| First visit | No rounds; the canvas shows "What are we designing?" with the three presets as large cards |

## 13. Quality bar

- No `any`. No unused code. Components under ~150 lines; split if larger.
- No API key or model call in client code. Client only calls `/api/*`.
- No console errors or React key warnings.
- `npm run build` and `npm test` pass before any phase is called done.
