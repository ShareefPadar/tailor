import { describe, expect, it } from "vitest";
import { validateVariants } from "./schema";
import { DEFAULT_TOKENS } from "./tokens";
import type { Node } from "./types";

const card = (children: unknown[]) => ({ type: "card", children });
const wrap = (layout: unknown, tokens: unknown = DEFAULT_TOKENS) => ({
  variants: [0, 1, 2].map(() => ({ label: "Stacked", applied: "note", tokens, layout })),
});
// The children of the first variant's root card.
function childrenOf(raw: unknown): Node[] {
  const result = validateVariants(raw);
  if (!result.ok) throw new Error(result.error);
  const root = result.variants[0].layout;
  if (root.type !== "card") throw new Error("root is not a card");
  return root.children;
}
const text = { type: "text", text: "x" };

describe("tokens", () => {
  it("fills the four newer tokens with defaults when missing or invalid", () => {
    const result = validateVariants(wrap(card([text]), { radius: 10, primary: "#111111", mode: "neon", border: 3 }));
    expect(result.ok && result.variants[0].tokens).toMatchObject({
      mode: "light", buttonStyle: "filled", border: "none", headingWeight: "bold",
    });
  });

  it("keeps valid values for the newer tokens", () => {
    const tokens = { ...DEFAULT_TOKENS, mode: "dark", buttonStyle: "soft", border: "bold", headingWeight: "heavy" };
    const result = validateVariants(wrap(card([text]), tokens));
    expect(result.ok && result.variants[0].tokens).toMatchObject({
      mode: "dark", buttonStyle: "soft", border: "bold", headingWeight: "heavy",
    });
  });
});

describe("building blocks", () => {
  it("accepts badge, stat, rows, steps and divider", () => {
    const children = childrenOf(
      wrap(card([
        { type: "badge", text: "Most popular" },
        { type: "stat", value: "$12", caption: "per month" },
        { type: "divider" },
        { type: "rows", items: [{ label: "Order", value: "#4821" }] },
        { type: "steps", items: ["Ordered", "Packed", "On the way"], current: 1 },
      ])),
    );
    expect(children.map((c) => c.type)).toEqual(["badge", "stat", "divider", "rows", "steps"]);
  });

  it("clamps the current step into the list", () => {
    const steps = (current: unknown) =>
      childrenOf(wrap(card([{ type: "steps", items: ["a", "b", "c"], current }])))[0];
    expect(steps(9)).toMatchObject({ current: 2 });
    expect(steps(-3)).toMatchObject({ current: 0 });
    expect(steps("1")).toMatchObject({ current: 1 });
    expect(steps("soon")).toMatchObject({ current: 0 });
  });

  it("truncates rows to 5 and steps to 5, and an optional caption may be missing", () => {
    const rows = Array.from({ length: 9 }, (_, i) => ({ label: `l${i}`, value: `v${i}` }));
    const children = childrenOf(
      wrap(card([
        { type: "rows", items: rows },
        { type: "steps", items: ["a", "b", "c", "d", "e", "f", "g"], current: 6 },
        { type: "stat", value: "$9" },
      ])),
    );
    expect(children[0]).toMatchObject({ type: "rows" });
    expect(children[0].type === "rows" && children[0].items).toHaveLength(5);
    expect(children[1]).toMatchObject({ current: 4 });
    expect(children[1].type === "steps" && children[1].items).toHaveLength(5);
    expect(children[2]).toEqual({ type: "stat", value: "$9" });
  });

  it("rejects steps with fewer than two items and rows with none", () => {
    expect(validateVariants(wrap(card([{ type: "steps", items: ["only"], current: 0 }]))).ok).toBe(false);
    expect(validateVariants(wrap(card([{ type: "rows", items: [] }]))).ok).toBe(false);
  });

  it("still drops unknown node types", () => {
    const children = childrenOf(wrap(card([{ type: "carousel" }, text])));
    expect(children).toHaveLength(1);
  });
});

describe("design rules enforced in code", () => {
  const button = (variant?: string) => ({ type: "button", text: "Go", ...(variant ? { variant } : {}) });
  const variants = (raw: unknown) =>
    childrenOf(raw).flatMap((c) => (c.type === "button" ? [c.variant] : c.type === "card" ? c.children.flatMap((n) => (n.type === "button" ? [n.variant] : [])) : []));

  it("keeps the first primary button and demotes the rest", () => {
    expect(variants(wrap(card([button("primary"), button("primary"), button()])))).toEqual([
      "primary", "secondary", "secondary",
    ]);
  });

  it("counts primaries across a nested card", () => {
    expect(variants(wrap(card([card([button("primary")]), button("primary")])))).toEqual(["primary", "secondary"]);
  });

  it("leaves secondary and ghost buttons alone", () => {
    expect(variants(wrap(card([button("ghost"), button("secondary"), button("primary")])))).toEqual([
      "ghost", "secondary", "primary",
    ]);
  });

  it("removes leading, trailing and doubled dividers", () => {
    const divider = { type: "divider" };
    const children = childrenOf(wrap(card([divider, text, divider, divider, text, divider, divider])));
    expect(children.map((c) => c.type)).toEqual(["text", "divider", "text"]);
  });
});
