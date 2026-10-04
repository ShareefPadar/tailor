# Tailor — PRD

An AI co-designer that learns a designer's taste and applies it to every new UI it generates.

Read this file for **what** and **why**. Read `SPEC.md` for **how**. Follow `TASKS.md` for **build order**. If PRD and SPEC disagree on an implementation detail, SPEC wins.

---

## 1. Overview

The designer writes a short brief ("pricing card for a food delivery app"). Tailor returns three UI variants rendered as real components. Every pick, reject, or tweak updates a visible **Style Profile**. The next brief comes back in the learned style, with a note on what was applied.

This is a one-day prototype for the optional "Generative Design Studio" challenge in a job application. It must prove one thing clearly: **the AI adapts to the designer, and the designer can see and correct what it learned.**

## 2. Problem

AI design tools give every designer the same generic output, so designers spend more time fixing style than they save on generation.

- **No memory of taste.** Every prompt starts from zero. Radius, color, density, and tone get restated every time.
- **Hidden reasoning.** When tools do personalize, the designer can't see what was assumed or correct it.
- **One-shot output.** A single answer gives nothing to react to and nothing to learn from.

## 3. Goals

1. A reviewer sees output shift toward their picks within **3 briefs**.
2. Every learned change is **explained** in plain words (change log).
3. The designer can **edit or lock** any learned value, and locked values are never overridden.
4. A first-time visitor sees generated variants within **10 seconds** of landing (preset chips + cache).
5. Shipped in **one day**: public link, 60-second demo, 100-word summary.

## 4. Non-goals

| Non-goal | Why |
| --- | --- |
| Full pages or multi-screen flows | Too big for a day; one component proves the idea |
| Figma or code export | Not needed to show adaptation |
| Accounts, saved projects, database | State in memory is enough for a demo |
| Image generation, custom icons | Distracts from the style-learning story |
| Mobile-first layout for the tool | Reviewers use desktop; it only needs to not break on smaller screens |
| Persisting the profile across reloads | Fresh start per visit keeps the demo predictable |

## 5. Users and stories

**Primary:** a product designer exploring UI directions early in a project.
**Secondary:** the hiring reviewer, who has about two minutes to try it.

| ID | Story |
| --- | --- |
| US1 | As a designer, I want to describe a component in plain words so that I get options without opening Figma. |
| US2 | As a designer, I want three clearly different variants so that I can react instead of starting blank. |
| US3 | As a designer, I want to pick or reject a variant so that the tool learns what I like. |
| US4 | As a designer, I want to tweak radius, color, density, or tone so that I can teach it precisely. |
| US5 | As a designer, I want to see what it learned and why so that I can trust it and spot mistakes. |
| US6 | As a designer, I want to edit or lock a learned value so that it never drifts from a decision I made. |
| US7 | As a reviewer, I want one-tap preset briefs so that I see the value in under a minute. |
| US8 | As any user, I want a clear message when generation fails so that I can retry without losing what was learned. |

## 6. Core flow

1. Designer types a brief or taps a preset.
2. **No profile yet:** three variants in fixed, deliberately different styles: Minimal, Bold, Playful.
3. Designer picks one, rejects others, or tweaks a variant.
4. Style Profile updates: values shift, confidence grows, a change log line explains each change.
5. Designer enters a new brief.
6. **Profile exists:** three variants share the learned style and differ in layout and copy. Confident and locked values are enforced in code, not left to the AI.
7. Repeat from step 3. The designer can edit, lock, or reset at any time.

## 7. Requirements

**P0 must ship. P1 ships if time allows. P2 is cut first.** Details for each live in `SPEC.md`.

| ID | Feature | Requirement | Priority |
| --- | --- | --- | --- |
| F1 | Brief input | Text field, 1–200 chars, Generate button, Enter submits | P0 |
| F2 | Preset briefs | 3 one-tap chips (SPEC §9.4) | P0 |
| F3 | Generation | Exactly 3 valid variants; invalid output retried once; under 15 s typical | P0 |
| F4 | Round 1 seeds | With no profile, variants use the 3 fixed style seeds (SPEC §5.2) | P0 |
| F5 | Variant view | 3 variants side by side: label, rendered component, "what I applied" note, enforced-token chips | P0 |
| F6 | Pick | One pick per round; updates profile | P0 |
| F7 | Reject | Any unpicked variant; lowers scores of its category values only (SPEC §8.2) | P0 |
| F8 | Token enforcement | Locked and high-confidence tokens overwrite AI output in code (SPEC §8.5) | P0 |
| F9 | Style Profile panel | Each token: value, confidence bar, lock icon; taste summary on top | P0 |
| F10 | Change log | Newest first: token, old → new, reason | P0 |
| F11 | Preset cache | First-round results for presets served from a committed JSON file | P0 |
| F12 | Tweak | Popover on a variant: radius, color, density, tone; live preview; Apply counts as strong signal | P1 |
| F13 | Edit and lock | Edit a token in the panel (auto-locks); toggle lock on any token | P1 |
| F14 | Reset | Confirm, then clear profile, log, and rounds | P1 |
| F15 | Taste summary | One-sentence LLM summary after actions | P1 |
| F16 | Round history | Earlier rounds stay visible, read-only, above the current one | P2 |

## 8. Acceptance criteria

- **AC1** — Given a first visit, when I tap a preset chip, then 3 variants appear within 10 s, visibly different (Minimal, Bold, Playful).
- **AC2** — Given round 1, when I pick Playful, then the change log shows radius, color, font, and tone changes, each with a reason.
- **AC3** — Given I rejected a variant, when the profile updates, then radius and color do not change because of the reject.
- **AC4** — Given two rounds of consistent picks, when I generate a third brief, then all 3 variants use the confident tokens and show them as chips.
- **AC5** — Given a locked token, when I pick variants that contradict it, then its value never changes.
- **AC6** — Given I tweak tone on a variant and apply, then the profile's tone becomes the tweaked value immediately.
- **AC7** — Given I reset, then the profile returns to defaults, the log is empty, and the next generation uses seeds again.
- **AC8** — Given the AI returns invalid JSON twice, then I see the error state with "Try again", and the profile is unchanged.
- **AC9** — Given the deployed app, then the API key never appears in client code or network responses.
- **AC10** — `npm run build` and `npm test` pass.

## 9. Risks

| Risk | Mitigation |
| --- | --- |
| Invalid JSON from LLM | Zod validation, one retry with the error, then error state |
| Round 1 variants look alike | Seeds are forced in code |
| AI ignores the profile | Enforcement in code; AI controls layout and copy only |
| Free-tier rate limits during review | Preset cache; Generate disabled while loading; summary debounced |
| Scope creep | Follow the cut list in `TASKS.md` |
| Key exposure | Key only in server routes and Vercel env |

## 10. Open questions

- **Model ID** (non-blocking): copy the exact ID of the latest stable Flash model from Google AI Studio into `GEMINI_MODEL`.

## 11. Submission package

- Public Vercel link
- Public GitHub repo with README (including a short "How I built this with AI" section)
- 60-second demo: preset → pick → second brief → pick → third brief matching picks → lock a token
- 3 screenshots: round 1 variety, profile panel with change log, round 3 adapted result
- Dataset: none needed; presets and seeds are self-created

**100-word summary**

> Tailor is an AI co-designer that learns how you design. You give it a brief, it proposes three UI variants, and every pick, rejection, or tweak updates a visible Style Profile covering radius, color, density, and copy tone. Each new generation applies that profile and explains its choices, so the designer can see and correct what the AI has learned. I built it with React, Tailwind, and an LLM returning structured JSON specs rendered as real components. My approach: AI should adapt to the designer, not the other way around, and its understanding should be transparent and editable.
