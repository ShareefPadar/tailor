import { describe, expect, it } from "vitest";
import {
  confidence,
  enforcedKeys,
  hasProfile,
  initialProfile,
  signals,
  toggleLock,
  toPayload,
  updateProfile,
} from "./profile";
import { SEEDS } from "./tokens";
import type { Action, ActionKind, Profile, TokenKey, Tokens } from "./types";

const PLAYFUL = SEEDS[2].tokens; // 20, #16a34a, comfortable, soft, DM Sans, playful
const BOLD = SEEDS[1].tokens; // 6, #7c3aed, compact, strong, Space Grotesk, premium
const ROUND_2_PICK: Tokens = { ...PLAYFUL, radius: 12, tone: "friendly" };

let counter = 0;
function act(kind: ActionKind, tokens: Partial<Tokens>, variantLabel = ""): Action {
  counter += 1;
  return { id: `a${counter}`, kind, round: 1, variantLabel, tokens, at: 1000 + counter };
}

function run(...actions: Action[]): Profile {
  return actions.reduce(updateProfile, initialProfile());
}

const KEYS: TokenKey[] = ["radius", "primary", "density", "shadow", "font", "tone"];
const logOf = (p: Profile, token: TokenKey) => p.log.filter((e) => e.token === token);

describe("initial profile", () => {
  it("starts at defaults with nothing learned", () => {
    const p = initialProfile();
    expect(p.tokens).toEqual({
      radius: 8, primary: "#2563eb", density: "comfortable", shadow: "soft", font: "Inter", tone: "neutral",
    });
    expect(Object.values(p.locked).every((l) => !l)).toBe(true);
    expect(p.radiusSamples).toEqual([]);
    expect(p.actions).toEqual([]);
    expect(p.summary).toBeNull();
    expect(p.log).toEqual([]);
    expect(hasProfile(p)).toBe(false);
    expect(toPayload(p)).toBeNull();
  });
});

describe("worked example (SPEC 8.7)", () => {
  const a1 = act("pick", PLAYFUL, "Playful");
  const a2 = act("reject", BOLD, "Bold");
  const a3 = act("pick", ROUND_2_PICK, "Stacked");
  const a4 = act("tweak", { tone: "friendly" }, "Stacked");

  it("action 1: pick Playful logs radius, color, font and tone", () => {
    const p = run(a1);
    expect(p.tokens).toEqual(PLAYFUL);
    expect(p.log).toHaveLength(4);
    expect(p.log.map((e) => e.token)).toEqual(["radius", "primary", "font", "tone"]);
    const fromVariant = "From the Playful variant you picked";
    expect(p.log[0]).toEqual({ id: `${a1.id}-radius`, token: "radius", from: "8px", to: "20px", reason: fromVariant, at: a1.at });
    expect(p.log[1]).toMatchObject({ token: "primary", from: "#2563eb", to: "#16a34a", reason: fromVariant });
    expect(p.log[2]).toMatchObject({ token: "font", from: "Inter", to: "DM Sans", reason: fromVariant });
    expect(p.log[3]).toMatchObject({ token: "tone", from: "Neutral", to: "Playful", reason: fromVariant });
    expect(p.radiusSamples).toEqual([{ value: 20, weight: 1 }]);
    expect(p.scores.density.comfortable).toBe(1);
    expect(p.scores.shadow.soft).toBe(1);
    expect(p.scores.font["DM Sans"]).toBe(1);
    expect(p.scores.tone.playful).toBe(1);
    expect(hasProfile(p)).toBe(true);
    for (const key of KEYS) expect(signals(p, key)).toBe(1);
    for (const key of KEYS) expect(confidence(p, key)).toBeNull();
    expect(enforcedKeys(p)).toEqual([]);
  });

  it("action 2: reject Bold lowers category scores only", () => {
    const after1 = run(a1);
    const p = updateProfile(after1, a2);
    expect(p.tokens).toEqual(after1.tokens);
    expect(p.log).toEqual(after1.log);
    expect(p.radiusSamples).toEqual(after1.radiusSamples);
    expect(p.scores.density.compact).toBe(-0.5);
    expect(p.scores.shadow.strong).toBe(-0.5);
    expect(p.scores.font["Space Grotesk"]).toBe(-0.5);
    expect(p.scores.tone.premium).toBe(-0.5);
    expect(p.actions).toHaveLength(2);
    for (const key of KEYS) expect(signals(p, key)).toBe(1); // rejects are not signals
  });

  it("round 2: with one signal the payload enforces nothing", () => {
    const payload = toPayload(run(a1, a2));
    expect(payload).not.toBeNull();
    expect(payload?.enforced).toEqual([]);
    expect(payload?.tokens).toEqual(PLAYFUL);
    expect(payload?.summary).toBeNull();
    expect(Object.values(payload?.confidence ?? {}).every((c) => c === null)).toBe(true);
  });

  it("action 3: second pick averages radius and sets exact confidences", () => {
    const p = run(a1, a2, a3);
    expect(p.tokens.radius).toBe(16);
    expect(p.log).toHaveLength(5);
    expect(p.log[0]).toMatchObject({
      token: "radius", from: "20px", to: "16px", reason: "Average of your 2 picks and tweaks",
    });
    expect(p.tokens.primary).toBe("#16a34a");
    expect(p.tokens.tone).toBe("playful"); // playful 1 vs friendly 1: tie keeps current
    expect(p.scores.density.comfortable).toBe(2);
    expect(p.scores.shadow.soft).toBe(2);
    expect(p.scores.font["DM Sans"]).toBe(2);
    expect(p.scores.tone).toMatchObject({ playful: 1, friendly: 1, premium: -0.5 });
    expect(confidence(p, "radius")).toBe(1);
    expect(confidence(p, "primary")).toBe(1);
    expect(confidence(p, "density")).toBe(1);
    expect(confidence(p, "shadow")).toBe(1);
    expect(confidence(p, "font")).toBe(1);
    expect(confidence(p, "tone")).toBe(0.5);
    expect(enforcedKeys(p)).toEqual(["radius", "primary", "density", "shadow", "font"]);
    expect(enforcedKeys(p)).not.toContain("tone");
  });

  it("action 4: tweaking tone is a strong signal and enforces tone", () => {
    const p = run(a1, a2, a3, a4);
    expect(p.tokens.tone).toBe("friendly");
    expect(p.scores.tone.friendly).toBe(3);
    expect(p.log[0]).toMatchObject({
      token: "tone", from: "Playful", to: "Friendly", reason: "You tweaked it on Stacked",
    });
    expect(p.radiusSamples).toHaveLength(2); // a tone tweak adds no radius sample
    expect(signals(p, "tone")).toBe(3);
    expect(confidence(p, "tone")).toBe(0.75);
    expect(enforcedKeys(p)).toContain("tone");
    expect(toPayload(p)?.enforced).toEqual(["radius", "primary", "density", "shadow", "font", "tone"]);
  });
});

describe("change log reasons", () => {
  it("score above 1 uses the leads-your-picks reason", () => {
    const inter = { ...PLAYFUL, font: "Inter" } as const;
    const p = run(act("pick", inter, "A"), act("pick", PLAYFUL, "B"), act("pick", PLAYFUL, "C"));
    expect(p.tokens.font).toBe("DM Sans");
    expect(logOf(p, "font")[0]).toMatchObject({
      from: "Inter", to: "DM Sans", reason: "DM Sans leads your picks (2 pts)",
    });
  });

  it("formats half points without trailing .0", () => {
    const inter = { ...PLAYFUL, font: "Inter" } as const;
    const p = run(
      act("pick", inter, "A"), // Inter 1
      act("pick", PLAYFUL, "B"), // DM Sans 1: tie, stays Inter
      act("reject", PLAYFUL, "B"), // DM Sans 0.5
      act("pick", PLAYFUL, "C"), // DM Sans 1.5 > Inter 1
    );
    expect(logOf(p, "font")[0].reason).toBe("DM Sans leads your picks (1.5 pts)");
  });

  it("a reject that causes a category switch says what was rejected", () => {
    const grotesk = { ...PLAYFUL, font: "Space Grotesk" } as const;
    const p = run(
      act("pick", PLAYFUL, "A"), // DM Sans 1, current
      act("pick", grotesk, "B"), // Space Grotesk 1: tie, stays DM Sans
      act("reject", PLAYFUL, "A"), // DM Sans 0.5 < Space Grotesk 1
    );
    expect(p.tokens.font).toBe("Space Grotesk");
    expect(logOf(p, "font")[0]).toMatchObject({
      from: "DM Sans", to: "Space Grotesk", reason: "You rejected DM Sans",
    });
  });

  it("a reject alone never switches to an option with no positive score", () => {
    const p = run(act("pick", PLAYFUL, "A"), act("reject", PLAYFUL, "A"));
    expect(p.scores.font["DM Sans"]).toBe(0.5);
    expect(p.tokens.font).toBe("DM Sans");
  });

  it("ties between other options go to the first in option order", () => {
    // Default tone is neutral (0). Both friendly and premium reach 1; friendly comes first.
    const p = run(
      act("pick", { ...PLAYFUL, tone: "premium" }, "A"), // premium 1 > 0: switches
      act("reject", { ...PLAYFUL, tone: "premium" }, "A"), // premium 0.5
      act("pick", { ...PLAYFUL, tone: "friendly" }, "B"), // friendly 1 > premium 0.5: switches
    );
    expect(p.tokens.tone).toBe("friendly");
  });

  it("a color that differs only in hex case is not a change", () => {
    const p = run(act("pick", PLAYFUL, "A"), act("pick", { ...PLAYFUL, primary: "#16A34A" }, "B"));
    expect(p.tokens.primary).toBe("#16a34a");
    expect(logOf(p, "primary")).toHaveLength(1);
  });
});

describe("tweak", () => {
  it("sets values directly, adds a weight-2 radius sample, and logs the reason", () => {
    const p = run(act("pick", PLAYFUL, "A"), act("tweak", { radius: 10, primary: "#e11d48", density: "compact" }, "A"));
    expect(p.tokens).toMatchObject({ radius: 10, primary: "#e11d48", density: "compact" });
    expect(p.radiusSamples).toEqual([{ value: 20, weight: 1 }, { value: 10, weight: 2 }]);
    expect(p.scores.density.compact).toBe(2);
    expect(p.log.slice(0, 3).map((e) => e.reason)).toEqual(Array(3).fill("You tweaked it on A"));
  });

  it("only touches the tokens it carries", () => {
    const base = run(act("pick", PLAYFUL, "A"));
    const p = updateProfile(base, act("tweak", { tone: "premium" }, "A"));
    expect(p.tokens).toEqual({ ...base.tokens, tone: "premium" });
  });

  it("confidence for color counts picks and tweaks that include it", () => {
    const p = run(act("pick", PLAYFUL, "A"), act("pick", PLAYFUL, "B"), act("tweak", { primary: "#e11d48" }, "B"));
    expect(p.tokens.primary).toBe("#e11d48");
    expect(signals(p, "primary")).toBe(3);
    expect(confidence(p, "primary")).toBeCloseTo(1 / 3);
  });
});

describe("lock and edit (SPEC 8.7 lock tests)", () => {
  const base = () => run(act("pick", PLAYFUL, "A"), act("pick", ROUND_2_PICK, "B")); // radius 16, samples [20, 12]

  it("edit sets the value, locks it, and logs it", () => {
    const p = updateProfile(base(), act("edit", { radius: 24 }));
    expect(p.tokens.radius).toBe(24);
    expect(p.locked.radius).toBe(true);
    expect(p.log[0]).toMatchObject({ token: "radius", from: "16px", to: "24px", reason: "You set it (locked)" });
    expect(p.radiusSamples).toHaveLength(2); // an edit adds no sample
    expect(confidence(p, "radius")).toBe(1);
    expect(enforcedKeys(p)).toContain("radius");
  });

  it("a locked radius survives a contradicting pick", () => {
    const locked = updateProfile(base(), act("edit", { radius: 24 }));
    const p = updateProfile(locked, act("pick", { ...PLAYFUL, radius: 4 }, "C"));
    expect(p.tokens.radius).toBe(24);
    expect(logOf(p, "radius")).toHaveLength(logOf(locked, "radius").length);
    expect(p.radiusSamples).toEqual(locked.radiusSamples); // skipped entirely
  });

  it("unlocking lets the next pick recalculate from the samples", () => {
    const locked = updateProfile(base(), act("edit", { radius: 24 }));
    const afterContradiction = updateProfile(locked, act("pick", { ...PLAYFUL, radius: 4 }, "C"));
    const unlocked = toggleLock(afterContradiction, "radius");
    expect(unlocked.locked.radius).toBe(false);
    expect(unlocked.tokens.radius).toBe(24);
    expect(unlocked.log).toEqual(afterContradiction.log); // toggling adds no log entry
    expect(unlocked.actions).toEqual(afterContradiction.actions); // or action
    const p = updateProfile(unlocked, act("pick", { ...PLAYFUL, radius: 12 }, "D"));
    // samples [20, 12, 12] -> 14.67 -> nearest even 14
    expect(p.tokens.radius).toBe(14);
    expect(p.log[0]).toMatchObject({
      token: "radius", from: "24px", to: "14px", reason: "Average of your 3 picks and tweaks",
    });
  });

  it("locked categories ignore picks, rejects and tweaks", () => {
    const locked = run(act("pick", PLAYFUL, "A"), act("edit", { tone: "premium" }));
    const p = [
      act("pick", { ...PLAYFUL, tone: "friendly" }, "B"),
      act("reject", { ...PLAYFUL, tone: "premium" }, "B"),
      act("tweak", { tone: "neutral" }, "B"),
    ].reduce(updateProfile, locked);
    expect(p.tokens.tone).toBe("premium");
    expect(p.scores.tone).toEqual(locked.scores.tone);
  });

  it("editing a locked token is allowed and editing to the same value only locks", () => {
    const locked = updateProfile(base(), act("edit", { radius: 24 }));
    const changed = updateProfile(locked, act("edit", { radius: 12 }));
    expect(changed.tokens.radius).toBe(12);
    const same = updateProfile(base(), act("edit", { density: "comfortable" }));
    expect(same.locked.density).toBe(true);
    expect(logOf(same, "density")).toHaveLength(0);
  });

  it("an edit alone creates a profile, and toggleLock flips back and forth", () => {
    const p = run(act("edit", { primary: "#e11d48" }));
    expect(hasProfile(p)).toBe(true);
    expect(toPayload(p)?.enforced).toEqual(["primary"]);
    const flipped = toggleLock(toggleLock(p, "tone"), "tone");
    expect(flipped.locked).toEqual(p.locked);
  });
});

describe("edge cases (SPEC 8.7)", () => {
  it("reject only: no profile, no token changes", () => {
    const p = run(act("reject", BOLD, "Bold"), act("reject", PLAYFUL, "Playful"));
    expect(hasProfile(p)).toBe(false);
    expect(p.tokens).toEqual(initialProfile().tokens);
    expect(p.log).toEqual([]);
    expect(toPayload(p)).toBeNull();
  });

  it("radius samples averaging 13 round to 14", () => {
    const p = run(act("pick", { ...PLAYFUL, radius: 12 }, "A"), act("pick", { ...PLAYFUL, radius: 14 }, "B"));
    expect(p.tokens.radius).toBe(14);
  });

  it("radius averaging 15 rounds to 16", () => {
    const p = run(act("pick", { ...PLAYFUL, radius: 14 }, "A"), act("pick", { ...PLAYFUL, radius: 16 }, "B"));
    expect(p.tokens.radius).toBe(16);
  });

  it("weighted average: a tweak counts double", () => {
    // samples [20 x1, 8 x2] -> 36 / 3 = 12
    const p = run(act("pick", PLAYFUL, "A"), act("tweak", { radius: 8 }, "A"));
    expect(p.tokens.radius).toBe(8); // tweak sets directly
    const next = updateProfile(p, act("pick", { ...PLAYFUL, radius: 20 }, "B"));
    // samples [20 x1, 8 x2, 20 x1] -> 56 / 4 = 14
    expect(next.tokens.radius).toBe(14);
  });

  it("clamps radius to 0-24 and to even on tweak and edit", () => {
    expect(run(act("pick", PLAYFUL, "A"), act("tweak", { radius: 30 }, "A")).tokens.radius).toBe(24);
    expect(run(act("tweak", { radius: -4 }, "A")).tokens.radius).toBe(0);
    expect(run(act("edit", { radius: 99 })).tokens.radius).toBe(24);
    expect(run(act("tweak", { radius: 13 }, "A")).tokens.radius).toBe(14);
  });

  it("radius confidence uses a +/-4px window", () => {
    // samples 20 and 12 average to 16: both within 4. Add 2 (far from 16): window excludes it.
    const p = run(act("pick", PLAYFUL, "A"), act("pick", ROUND_2_PICK, "B"), act("pick", { ...PLAYFUL, radius: 2 }, "C"));
    // samples [20, 12, 2] -> 11.33 -> 12; within 4 of 12: 12 only (20 is 8 away, 2 is 10 away)
    expect(p.tokens.radius).toBe(12);
    expect(confidence(p, "radius")).toBeCloseTo(1 / 3);
  });
});

describe("purity", () => {
  it("does not mutate its input and is deterministic", () => {
    const before = run(act("pick", PLAYFUL, "A"));
    const snapshot = JSON.stringify(before);
    const action = act("pick", ROUND_2_PICK, "B");
    const one = updateProfile(before, action);
    const two = updateProfile(before, action);
    expect(JSON.stringify(before)).toBe(snapshot);
    expect(one).toEqual(two);
  });
});
