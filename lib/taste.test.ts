import { describe, expect, it } from "vitest";
import { hasLayoutTaste, layoutTaste } from "./taste";
import { DEFAULT_TOKENS } from "./tokens";
import type { Node, Variant } from "./types";

const variant = (id: string, children: Node[]): Variant => ({
  id, label: id, applied: "", tokens: DEFAULT_TOKENS, enforced: [], layout: { type: "card", children },
});
const heading: Node = { type: "heading", text: "h" };
const button: Node = { type: "button", text: "Go" };
const stat: Node = { type: "stat", value: "$9" };
const list: Node = { type: "list", items: ["a"] };
const rows: Node = { type: "rows", items: [{ label: "a", value: "b" }] };
const steps: Node = { type: "steps", items: ["a", "b"], current: 0 };

describe("layoutTaste", () => {
  it("is empty before any pick or reject", () => {
    const taste = layoutTaste([{ variants: [variant("a", [heading, stat, button])], marks: {} }]);
    expect(taste).toEqual({ liked: [], avoided: [], size: null });
    expect(hasLayoutTaste(taste)).toBe(false);
  });

  it("likes the blocks in picked variants and ignores headings, text and buttons", () => {
    const taste = layoutTaste([{ variants: [variant("a", [heading, stat, list, button])], marks: { a: "picked" } }]);
    expect(taste.liked).toEqual(["list", "stat"]); // tie at 1: listed in a fixed order
    expect(taste.avoided).toEqual([]);
  });

  it("puts blocks that were only rejected under avoided", () => {
    const taste = layoutTaste([
      { variants: [variant("a", [heading, stat, button]), variant("b", [heading, rows, button])], marks: { a: "picked", b: "rejected" } },
    ]);
    expect(taste.liked).toEqual(["stat"]);
    expect(taste.avoided).toEqual(["rows"]);
  });

  it("a block that was picked once and rejected once is neither liked nor avoided", () => {
    const taste = layoutTaste([
      { variants: [variant("a", [stat]), variant("b", [stat])], marks: { a: "picked", b: "rejected" } },
    ]);
    expect(taste.liked).toEqual([]); // 1 - 0.5 = 0.5: below a full pick
    expect(taste.avoided).toEqual([]);
  });

  it("ranks by score across rounds, most favoured first", () => {
    const taste = layoutTaste([
      { variants: [variant("a", [stat, list])], marks: { a: "picked" } },
      { variants: [variant("b", [stat, steps])], marks: { b: "picked" } },
    ]);
    expect(taste.liked).toEqual(["stat", "list", "steps"]); // stat 2, then list and steps at 1
  });

  it("counts a block once per variant and looks inside nested cards and rows", () => {
    const nested: Node = { type: "card", children: [{ type: "row", children: [stat, stat] }] };
    const taste = layoutTaste([{ variants: [variant("a", [heading, nested])], marks: { a: "picked" } }]);
    expect(taste.liked).toEqual(["stat", "row"]);
  });

  it("learns card size from picked variants only", () => {
    const lean = layoutTaste([{ variants: [variant("a", [heading, stat, button])], marks: { a: "picked" } }]);
    expect(lean.size).toBe("lean");
    const rich = layoutTaste([{ variants: [variant("a", [heading, stat, list, rows, steps, button])], marks: { a: "picked" } }]);
    expect(rich.size).toBe("rich");
    const balanced = layoutTaste([{ variants: [variant("a", [heading, stat, list, rows, button])], marks: { a: "picked" } }]);
    expect(balanced.size).toBe("balanced");
    const rejectedOnly = layoutTaste([{ variants: [variant("a", [heading, stat])], marks: { a: "rejected" } }]);
    expect(rejectedOnly.size).toBeNull();
    expect(hasLayoutTaste(rejectedOnly)).toBe(true); // stat is avoided
  });

  it("lists at most four liked blocks", () => {
    const all: Node[] = [stat, list, rows, steps, { type: "badge", text: "x" }, { type: "note", text: "n" }];
    const taste = layoutTaste([{ variants: [variant("a", all)], marks: { a: "picked" } }]);
    expect(taste.liked).toHaveLength(4);
  });
});
