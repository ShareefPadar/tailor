import { describe, expect, it } from "vitest";
import { createInitialState, reducer, type AppState, type StoreAction } from "./store";
import { SEEDS } from "./tokens";
import type { Variant } from "./types";

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
