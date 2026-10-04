import type { BlockType, LayoutTaste, Node, Variant } from "./types";

// Layout taste: what the designer's picks and rejects say about structure, beyond style tokens.
// Pure, like lib/profile.ts. It only guides the AI's prompt; nothing here is enforced in code.

const PICK = 1;
const REJECT = 0.5;
const MAX_LISTED = 4;

// Structural blocks worth learning from. Headings, text, buttons, dividers and containers are in
// almost every card, so they carry no signal.
const SIGNAL: readonly BlockType[] = [
  "list", "stat", "rows", "steps", "badge", "input",
  "avatar", "icon", "row", "progress", "toggle", "chips", "rating", "note",
];

function blocksIn(node: Node, found: Set<BlockType> = new Set()): Set<BlockType> {
  if (SIGNAL.includes(node.type)) found.add(node.type);
  if (node.type === "card" || node.type === "row") node.children.forEach((child) => blocksIn(child, found));
  return found;
}

function blockCount(node: Node): number {
  return node.type === "card" ? node.children.length : 1;
}

interface RoundLike {
  variants: Variant[];
  marks: Record<string, "picked" | "rejected">;
}

export function layoutTaste(rounds: readonly RoundLike[]): LayoutTaste {
  const scores = new Map<BlockType, number>();
  const pickedSizes: number[] = [];

  for (const round of rounds) {
    for (const variant of round.variants) {
      const mark = round.marks[variant.id];
      if (!mark) continue;
      const delta = mark === "picked" ? PICK : -REJECT;
      for (const block of blocksIn(variant.layout)) scores.set(block, (scores.get(block) ?? 0) + delta);
      if (mark === "picked") pickedSizes.push(blockCount(variant.layout));
    }
  }

  // Order follows SIGNAL for ties, so the result is deterministic.
  const ranked = SIGNAL.filter((block) => scores.has(block)).map((block) => ({ block, score: scores.get(block) ?? 0 }));
  const liked = ranked
    .filter((r) => r.score >= PICK)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_LISTED)
    .map((r) => r.block);
  const avoided = ranked
    .filter((r) => r.score < 0)
    .sort((a, b) => a.score - b.score)
    .slice(0, MAX_LISTED)
    .map((r) => r.block);

  let size: LayoutTaste["size"] = null;
  if (pickedSizes.length > 0) {
    const average = pickedSizes.reduce((sum, n) => sum + n, 0) / pickedSizes.length;
    size = average <= 4 ? "lean" : average >= 6 ? "rich" : "balanced";
  }

  return { liked, avoided, size };
}

export function hasLayoutTaste(taste: LayoutTaste): boolean {
  return taste.liked.length > 0 || taste.avoided.length > 0 || taste.size !== null;
}

// Plain-language names for the inspector.
export const BLOCK_NAMES: Partial<Record<BlockType, string>> = {
  list: "Checklist",
  stat: "Big number",
  rows: "Detail rows",
  steps: "Progress steps",
  badge: "Badge",
  input: "Inputs",
  avatar: "Avatar",
  icon: "Icon",
  row: "Side by side",
  progress: "Progress bar",
  toggle: "Toggles",
  chips: "Option chips",
  rating: "Rating",
  note: "Callout",
};
