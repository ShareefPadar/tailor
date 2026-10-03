import { describe, expect, it } from "vitest";
import { createInitialState, reducer, type AppState, type StoreAction } from "./store";
import { SEEDS } from "./tokens";
import type { TokenKey, Tokens, Variant } from "./types";

const variants: Variant[] = SEEDS.map((seed, i) => ({
  id: `v${i}`,
  label: seed.label,
  applied: "",
  tokens: seed.tokens,
  layout: { type: "card", children: [{ type: "text", text: "x" }] },
  enforced: [],
}));

const generated = (state: AppState, brief = "brief"): AppState =>
  reducer(reducer(state, { type: "GENERATE_START", brief }), {
    type: "GENERATE_SUCCESS", roundId: `r-${state.rounds.length}`, brief, variants, source: "llm",
  });

let n = 0;
const pick = (variantId: string): StoreAction => ({ type: "PICK", variantId, actionId: `p${++n}`, at: n });
const reject = (variantId: string): StoreAction => ({ type: "REJECT", variantId, actionId: `r${++n}`, at: n });
const current = (s: AppState) => s.rounds[s.rounds.length - 1];

describe("generation", () => {
  it("appends numbered rounds and keeps the profile on error", () => {
    const first = generated(createInitialState());
    const second = generated(first, "two");
    expect(second.rounds.map((r) => r.number)).toEqual([1, 2]);
    const failed = reducer(second, { type: "GENERATE_ERROR" });
    expect(failed.status).toBe("error");
    expect(failed.rounds).toBe(second.rounds);
    expect(failed.profile).toBe(second.profile);
    expect(failed.lastBrief).toBe("two"); // "Try again" re-sends the latest brief
  });
});

describe("pick and reject rules", () => {
  const start = () => generated(createInitialState());

  it("a pick marks the variant and updates the profile", () => {
    const s = reducer(start(), pick("v2"));
    expect(current(s).marks).toEqual({ v2: "picked" });
    expect(s.profile.tokens.radius).toBe(20);
    expect(s.profile.actions[0]).toMatchObject({ kind: "pick", variantLabel: "Playful", round: 1 });
  });

  it("allows only one pick per round", () => {
    const once = reducer(start(), pick("v2"));
    const twice = reducer(once, pick("v0"));
    expect(twice).toBe(once);
  });

  it("a picked variant cannot be rejected or picked again", () => {
    const picked = reducer(start(), pick("v2"));
    expect(reducer(picked, reject("v2"))).toBe(picked);
    expect(reducer(picked, pick("v2"))).toBe(picked);
  });

  it("rejecting stays available after a pick, once per variant", () => {
    const picked = reducer(start(), pick("v2"));
    const rejected = reducer(picked, reject("v1"));
    expect(current(rejected).marks).toEqual({ v2: "picked", v1: "rejected" });
    expect(reducer(rejected, reject("v1"))).toBe(rejected);
  });

  it("a rejected variant cannot then be picked", () => {
    const rejected = reducer(start(), reject("v1"));
    expect(reducer(rejected, pick("v1"))).toBe(rejected);
  });

  it("rejects alone leave the profile without a learned style", () => {
    const s = reducer(start(), reject("v1"));
    expect(s.profile.tokens).toEqual(createInitialState().profile.tokens);
    expect(s.profile.log).toEqual([]);
  });

  it("ignores unknown variants and an empty workspace", () => {
    const s = start();
    expect(reducer(s, pick("nope"))).toBe(s);
    const empty = createInitialState();
    expect(reducer(empty, pick("v0"))).toBe(empty);
  });

  it("a new round allows a new pick and earlier rounds stay untouched", () => {
    const afterOne = reducer(start(), pick("v2"));
    const afterTwo = reducer(generated(afterOne, "two"), pick("v0"));
    expect(afterTwo.rounds[0].marks).toEqual({ v2: "picked" });
    expect(current(afterTwo).marks).toEqual({ v0: "picked" });
    expect(afterTwo.profile.actions).toHaveLength(2);
  });
});

describe("summary", () => {
  it("SET_SUMMARY replaces only the summary", () => {
    const s = reducer(generated(createInitialState()), pick("v2"));
    const next = reducer(s, { type: "SET_SUMMARY", summary: "Likes round, friendly designs." });
    expect(next.profile.summary).toBe("Likes round, friendly designs.");
    expect(next.profile.tokens).toBe(s.profile.tokens);
    expect(next.profile.actions).toBe(s.profile.actions);
  });
});

const tweak = (variantId: string, patch: Partial<Tokens>): StoreAction => ({ type: "TWEAK", variantId, patch, actionId: `t${++n}`, at: n });
const edit = (tokens: Partial<Tokens>): StoreAction => ({ type: "EDIT_TOKEN", tokens, actionId: `e${++n}`, at: n });
const lock = (key: TokenKey): StoreAction => ({ type: "TOGGLE_LOCK", key });

describe("tweak (AC6)", () => {
  const start = () => generated(createInitialState());

  it("applying a tone tweak sets the profile tone immediately", () => {
    const s = reducer(start(), tweak("v0", { tone: "friendly" }));
    expect(s.profile.tokens.tone).toBe("friendly");
    expect(s.profile.log[0]).toMatchObject({ token: "tone", to: "Friendly", reason: "You tweaked it on Minimal" });
    expect(s.profile.actions[0]).toMatchObject({ kind: "tweak", tokens: { tone: "friendly" } });
  });

  it("updates the variant shown and keeps the others", () => {
    const s = reducer(start(), tweak("v0", { radius: 12, primary: "#e11d48" }));
    expect(current(s).variants[0].tokens).toMatchObject({ radius: 12, primary: "#e11d48", density: "spacious" });
    expect(current(s).variants[1].tokens).toEqual(SEEDS[1].tokens);
  });

  it("carries only the tokens that actually changed", () => {
    const s = reducer(start(), tweak("v0", { radius: 4, tone: "premium" })); // radius 4 is unchanged
    expect(s.profile.actions[0].tokens).toEqual({ tone: "premium" });
  });

  it("a tweak that changes nothing is ignored", () => {
    const s = start();
    expect(reducer(s, tweak("v0", { radius: 4 }))).toBe(s);
    expect(reducer(s, tweak("v0", {}))).toBe(s);
  });

  it("can be applied repeatedly, including on picked and rejected variants", () => {
    let s = reducer(start(), pick("v0"));
    s = reducer(s, tweak("v0", { tone: "friendly" }));
    s = reducer(s, tweak("v0", { tone: "premium" }));
    expect(s.profile.actions.filter((a) => a.kind === "tweak")).toHaveLength(2);
    expect(current(s).marks).toEqual({ v0: "picked" });
  });

  it("drops tweaked tokens from the variant's enforced chips", () => {
    const enforced = reducer(
      { ...start(), rounds: [{ ...current(start()), variants: variants.map((v) => ({ ...v, enforced: ["radius", "primary"] })) }] },
      tweak("v0", { radius: 10 }),
    );
    expect(current(enforced).variants[0].enforced).toEqual(["primary"]);
    expect(current(enforced).variants[1].enforced).toEqual(["radius", "primary"]);
  });
});

describe("edit and lock (AC5)", () => {
  it("an edit sets the value, locks it, and survives contradicting picks", () => {
    let s = generated(createInitialState());
    s = reducer(s, edit({ radius: 24 }));
    expect(s.profile.tokens.radius).toBe(24);
    expect(s.profile.locked.radius).toBe(true);
    expect(s.profile.log[0]).toMatchObject({ token: "radius", reason: "You set it (locked)" });
    s = reducer(s, pick("v0")); // Minimal has radius 4
    expect(s.profile.tokens.radius).toBe(24);
    s = reducer(generated(s, "two"), pick("v0"));
    expect(s.profile.tokens.radius).toBe(24);
  });

  it("an edit works before any round exists", () => {
    const s = reducer(createInitialState(), edit({ primary: "#e11d48" }));
    expect(s.profile.tokens.primary).toBe("#e11d48");
    expect(s.profile.actions[0]).toMatchObject({ kind: "edit", round: 0, variantLabel: "" });
  });

  it("TOGGLE_LOCK flips the lock without logging", () => {
    const s = reducer(createInitialState(), lock("tone"));
    expect(s.profile.locked.tone).toBe(true);
    expect(s.profile.log).toEqual([]);
    expect(s.profile.actions).toEqual([]);
    expect(reducer(s, lock("tone")).profile.locked.tone).toBe(false);
  });
});

describe("reset (AC7)", () => {
  it("clears profile, log and rounds so the next round starts from seeds", () => {
    let s = generated(createInitialState());
    s = reducer(s, pick("v2"));
    s = reducer(s, edit({ tone: "premium" }));
    s = reducer({ ...s, status: "error" }, { type: "RESET" });
    const fresh = createInitialState();
    expect(s).toEqual(fresh);
    expect(s.profile.log).toEqual([]);
    expect(s.rounds).toEqual([]);
    expect(Object.values(s.profile.locked).some(Boolean)).toBe(false);
  });
});
