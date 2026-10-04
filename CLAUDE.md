# Tailor — instructions for Claude Code

Tailor is an AI co-designer that learns a designer's style. One-day prototype for a job application challenge. Quality and clarity matter more than feature count.

## Read first, in this order
1. `PRD.md` — what and why
2. `SPEC.md` — exact types, rules, prompts, UI. Source of truth for implementation.
3. `TASKS.md` — build order. Work one phase at a time.

## How to work
- Do **one phase** from `TASKS.md` at a time. When it's done, run checks, stop, summarize, list files changed, explain how to test, and wait for my go-ahead.
- Follow `SPEC.md` exactly. If something is ambiguous or missing, **ask** instead of inventing.
- Don't build ahead into later phases or add features not in the PRD.
- Prefer small, readable changes over clever abstractions.

## Hard rules
- Only these dependencies: `zod`, `@google/genai`, `lucide-react`; dev `vitest`, `tsx`. Ask before adding anything else.
- TypeScript strict. No `any`. No `// @ts-ignore`.
- Tailwind for all styling. Inline styles only inside `components/render/Render.tsx` (token CSS variables).
- Keep components under ~150 lines; split if larger.
- The API key lives only in server code (`lib/llm.ts`, API routes) and env vars. Never import `lib/llm.ts` or `lib/generate.ts` from client components.
- `lib/llm.ts` is the only file that imports the Gemini SDK.
- `lib/profile.ts` stays pure and deterministic: no React, no fetch, no `Date.now()`, no random ids. Log entries take `at` from the action and use `` `${action.id}-${token}` `` as id.
- Profile tokens style only the variant previews, never the app shell.
- Never commit `.env.local`.

## Commands
- `npm run dev` — local server
- `npm run build` — must pass before a phase is done
- `npm test` — must pass from Phase 4 on
- `npm run cache-presets` — regenerates `data/preset-cache.json` (Phase 7)

## Done means
- Build and tests pass, no console errors, no React key warnings.
- The phase's "Done when" check in `TASKS.md` is met.
