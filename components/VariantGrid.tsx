import { MousePointer2 } from "lucide-react";
import type { Round } from "../lib/store";
import type { Tokens } from "../lib/types";
import { VariantCard } from "./VariantCard";

// 3 across when the canvas is at least 640px wide (container query), otherwise 1.
// Frames are top-aligned, like frames on a Figma canvas.
const GRID = "grid grid-cols-1 items-start gap-x-4 gap-y-8 @[640px]:grid-cols-3";

export interface RoundActions {
  onPick: (variantId: string) => void;
  onReject: (variantId: string) => void;
  onTweak: (variantId: string, patch: Partial<Tokens>) => void;
}

interface VariantGridProps {
  round: Round;
  actions?: RoundActions; // omitted for earlier rounds, which are read-only
}

export function VariantGrid({ round, actions }: VariantGridProps) {
  const roundHasPick = Object.values(round.marks).includes("picked");
  return (
    <div className={GRID}>
      {round.variants.map((variant) => (
        <VariantCard
          key={variant.id}
          variant={variant}
          mark={round.marks[variant.id]}
          roundHasPick={roundHasPick}
          actions={
            actions && {
              onPick: () => actions.onPick(variant.id),
              onReject: () => actions.onReject(variant.id),
              onTweak: (patch) => actions.onTweak(variant.id, patch),
            }
          }
        />
      ))}
    </div>
  );
}

// Literal class names so Tailwind can see them: each wireframe starts a little later than the last,
// and each block within it later still, so the three designs appear to be built in turn.
const FRAME_DELAYS = [
  ["[animation-delay:0ms]", "[animation-delay:140ms]", "[animation-delay:280ms]", "[animation-delay:420ms]"],
  ["[animation-delay:500ms]", "[animation-delay:640ms]", "[animation-delay:780ms]", "[animation-delay:920ms]"],
  ["[animation-delay:1000ms]", "[animation-delay:1140ms]", "[animation-delay:1280ms]", "[animation-delay:1420ms]"],
];

const BLOCK = "animate-build rounded-full bg-ink/10";

// Loading state: three wireframes being assembled while the Tailor cursor moves between them.
export function VariantSkeletons() {
  return (
    <div className="animate-rise space-y-4" role="status" aria-busy="true">
      <p className="px-1 text-ink-2">Designing 3 options…</p>
      <div className={`${GRID} relative`}>
        {FRAME_DELAYS.map((delays, i) => (
          <div key={i} className="w-full max-w-[300px] space-y-2.5">
            <div className={`${BLOCK} ${delays[0]} mx-1 h-2.5 w-16`} />
            <div className="space-y-3 rounded-2xl border border-dashed border-ink/20 p-5">
              <div className={`${BLOCK} ${delays[0]} h-4 w-2/3`} />
              <div className={`${BLOCK} ${delays[1]} h-2.5 w-full bg-ink/[0.07]`} />
              <div className={`${BLOCK} ${delays[2]} h-2.5 w-4/5 bg-ink/[0.07]`} />
              <div className={`${BLOCK} ${delays[3]} mt-5 h-9 w-full rounded-xl bg-ink/15`} />
            </div>
          </div>
        ))}
        <div aria-hidden="true" className="pointer-events-none absolute z-10 flex animate-roam items-start">
          <MousePointer2 size={18} className="fill-ink text-white drop-shadow-sm" />
          <span className="-ml-0.5 mt-3.5 rounded-full bg-ink px-2 py-0.5 text-[11px] font-medium text-white shadow-frame">
            Tailor
          </span>
        </div>
      </div>
    </div>
  );
}
