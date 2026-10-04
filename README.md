# Tailor

UI tailored to your taste: an AI co-designer that learns your style. Live: https://tailor-lovat.vercel.app

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
```bash
cp .env.example .env.local   # add your key and model ID
npm install
npm run dev
```

Other commands:

```bash
npm test                # unit tests for the learning logic and the app state
npm run build           # production build
npm run cache-presets   # regenerate data/preset-cache.json (needs the key)
```

## Stack
Next.js, React, Tailwind, Zod, Gemini (JSON mode).

## How I built this with AI
I wrote a PRD (what and why), a SPEC (exact types, rules, prompts, UI), and a phased task list,
then built it with Claude Code one phase at a time. Each phase ended with a build, the unit tests,
and a manual check in the browser before the next began. The learning rules are pure functions
with tests that assert the worked example from the SPEC; the AI only controls layout and copy.
