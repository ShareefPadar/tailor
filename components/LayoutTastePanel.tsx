import { BLOCK_NAMES, hasLayoutTaste } from "../lib/taste";
import type { BlockType, LayoutTaste } from "../lib/types";
import { LABEL } from "./ui";

const SIZE_COPY = {
  lean: "Lean cards, 3 to 4 blocks",
  balanced: "Balanced cards, about 5 blocks",
  rich: "Rich cards, 6 or more blocks",
};

const CHIP = "rounded-full px-2 py-0.5 text-[11px] font-medium";

function Row({ label, blocks, chip }: { label: string; blocks: BlockType[]; chip: string }) {
  if (blocks.length === 0) return null;
  return (
    <div className="flex items-start gap-2">
      <span className="w-12 shrink-0 pt-0.5 text-ink-2">{label}</span>
      <span className="flex flex-wrap gap-1">
        {blocks.map((block) => (
          <span key={block} className={`${CHIP} ${chip}`}>
            {BLOCK_NAMES[block] ?? block}
          </span>
        ))}
      </span>
    </div>
  );
}

// What the picks and rejects say about structure. Shown so the designer can see it; it guides
// the AI but, unlike the style tokens, is never enforced in code.
export function LayoutTastePanel({ taste }: { taste: LayoutTaste }) {
  return (
    <div className="space-y-2.5 p-4">
      <h3 className={LABEL}>Layout taste</h3>
      {!hasLayoutTaste(taste) ? (
        <p className="text-ink-2">Pick or reject variants and Tailor learns which blocks you favour.</p>
      ) : (
        <div className="animate-rise space-y-2">
          <Row label="Likes" blocks={taste.liked} chip="bg-ink text-white" />
          <Row label="Avoids" blocks={taste.avoided} chip="bg-fill-2 text-ink-2 line-through" />
          {taste.size && (
            <div className="flex items-start gap-2">
              <span className="w-12 shrink-0 text-ink-2">Size</span>
              <span className="font-medium">{SIZE_COPY[taste.size]}</span>
            </div>
          )}
          <p className="pt-1 text-[11px] text-ink-2">Guides the AI. Not enforced, unlike the tokens above.</p>
        </div>
      )}
    </div>
  );
}
