# Tailor — Build Tasks

Build **one phase at a time**. At the end of each phase:

1. Run `npm run build` (and `npm test` from Phase 4 on).
2. Stop. Summarize what you built, list files changed, and tell me exactly how to test it.
3. Wait for my go-ahead before starting the next phase.

Section references (§) point to `SPEC.md`.

---

## Phase 0 — Setup (~30 min)

- [ ] `npx create-next-app@latest` with TypeScript, Tailwind, App Router, ESLint
- [ ] Install `zod @google/genai lucide-react` and dev `vitest tsx`
- [ ] Add scripts: `"test": "vitest run"`, `"cache-presets": "tsx --env-file=.env.local scripts/cache-presets.ts"`
- [ ] Create `.env.local` from `.env.example`; confirm `.env.local` is in `.gitignore`
- [ ] Create the folder structure from §3 with empty files where needed; `data/preset-cache.json` = `{}`
- [ ] Push to a public GitHub repo, import into Vercel, add both env variables, deploy

**Done when:** `npm run build` passes and the Vercel URL loads.

## Phase 1 — Types, tokens, renderer (~1.5 h)

- [ ] `lib/types.ts` exactly as §4
- [ ] `lib/tokens.ts`: defaults, seeds, `tokensToStyle`, `contrastText` (§5)
- [ ] Fonts in `app/layout.tsx` (§5.3)
- [ ] `components/render/Render.tsx` (§6)
- [ ] `app/playground/page.tsx`: renders 3 hand-written specs (a pricing card, a sign-up form, an order status card), each with one seed's tokens

**Done when:** `/playground` shows three cards that look clearly different (Minimal, Bold, Playful), fonts load, and changing a token in code visibly changes the card.

## Phase 2 — Validation, LLM, generate API (~1.5 h)

- [ ] `lib/schema.ts` with `validateVariants` (§7)
- [ ] `lib/llm.ts` (§9.1)
- [ ] `lib/prompts.ts` (§10.1–10.3)
- [ ] `lib/profile.ts`: for now only `SEEDS` usage and `applyEnforcement` (§8.5); full logic comes in Phase 4
- [ ] `lib/generate.ts` (§9.2), `lib/presets.ts` (§9.4)
- [ ] `app/api/generate/route.ts` (§9.3), including the cache lookup

**Test:**
```bash
curl -X POST localhost:3000/api/generate -H "Content-Type: application/json" \
  -d '{"brief":"Pricing card for a gym membership","profile":null}'
```
Then repeat with a sample `ProfilePayload` where `enforced` is `["radius","primary"]`.

**Done when:** both calls return 3 valid variants; with `null` they carry the seed tokens and labels; with the payload, enforced tokens match the payload; an empty brief returns 400.

## Phase 3 — Main screen, generation only (~1.5 h)

- [ ] `lib/store.ts`: state, reducer, `GENERATE_*` actions (§11)
- [ ] `BriefBar`, `RoundView`, `VariantGrid`, `VariantCard` (no actions wired yet) (§12.1–12.2)
- [ ] Loading skeletons and error state with Try again (§12.5)

**Done when:** tapping a preset chip shows 3 rendered variants; typing a brief and pressing Enter works; loading and error states appear correctly (test error by temporarily breaking the model ID).

## Phase 4 — Learning logic and tests (~1 h)

- [ ] Complete `lib/profile.ts`: `initialProfile`, `hasProfile`, `updateProfile`, `signals`, `confidence`, `enforcedKeys`, `toPayload`, change log reasons (§8)
- [ ] `lib/profile.test.ts`: the full worked example, lock tests, and edge tests from §8.7, with exact expected values

**Done when:** `npm test` passes and every expected value in §8.7 is asserted.

## Phase 5 — Learning loop UI (~1.5 h)

- [ ] Wire Pick and Reject in `VariantCard` and the reducer (§11 rules)
- [ ] `ProfilePanel`, `TokenRow`, `ChangeLog` (§12.4), without edit for now
- [ ] Generate sends `toPayload(profile)`; enforced chips show on variants
- [ ] `app/api/summarize/route.ts` + debounced client call (§9.5, §10.4)

**Done when:** PRD acceptance criteria AC1–AC5 pass manually.

## Phase 6 — Tweak, edit, lock, reset (~1 h)

- [ ] `TweakPopover` with live preview (§12.3)
- [ ] Edit token from the panel (auto-locks) and lock toggle
- [ ] Reset with confirm

**Done when:** AC6 and AC7 pass, and a locked token survives contradicting picks.

## Phase 7 — Polish and ship (~1 h)

- [ ] Run `npm run cache-presets`; check `data/preset-cache.json` has 3 entries; commit it
- [ ] Round history collapse (P2, only if time allows)
- [ ] Check layout at 1440px, 1024px, and 390px wide; nothing overflows
- [ ] Write `README.md` (template below)
- [ ] Deploy; run AC1–AC10 on the live URL

**Done when:** all acceptance criteria pass on the deployed app.

---

## Cut list (if behind schedule, cut in this order)

1. Round history (F16)
2. Taste summary (F15) — panel shows tokens only
3. Tweak (F12)
4. Edit and lock (F13)
5. Confidence bars — show values only

**Never cut:** seeds, enforcement, change log, "what I applied" notes. They are the proof that it adapts.

---

## README template

```markdown
# Tailor

An AI co-designer that learns your style. Live: <vercel-url>

## What it does
Give it a brief, get three UI variants. Pick, reject, or tweak, and it builds a visible
Style Profile. New briefs come back in your style, with a note on what was applied.

## How it learns
- Picks, rejects, and tweaks update token scores with simple, explainable rules.
- Confident or locked values are enforced in code, not left to the AI.
- Every change is logged with a reason. You can edit or lock anything.

## Try it
Tap a preset, pick the variant you like, and generate two more briefs.

## Run locally
cp .env.example .env.local   # add your key and model ID
npm install
npm run dev

## Stack
Next.js, React, Tailwind, Zod, Gemini (JSON mode).

## How I built this with AI
<2–3 lines on using Cursor / Claude Code with this PRD, SPEC, and phased TASKS.>
```
