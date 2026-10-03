import type { Round } from "../lib/store";
import type { Tokens } from "../lib/types";
import { VariantCard } from "./VariantCard";

// 3 across when the canvas is at least 640px wide (container query), otherwise 1.
const GRID = "mx-auto grid max-w-md grid-cols-1 gap-4 @[640px]:max-w-none @[640px]:grid-cols-3";

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

export function VariantSkeletons() {
  return (
    <div className="animate-rise space-y-4" role="status" aria-busy="true">
      <p className="px-1 text-ink-2">Designing 3 options…</p>
      <div className={GRID}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col gap-2.5">
            <div className="mx-1 h-3 w-20 animate-shimmer rounded-full bg-fill-2" />
            <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-hairline bg-white p-3 shadow-frame">
              <div className="w-full max-w-[220px] animate-shimmer space-y-3">
                <div className="h-4 w-2/3 rounded-full bg-fill-2" />
                <div className="h-3 w-full rounded-full bg-fill" />
                <div className="h-3 w-5/6 rounded-full bg-fill" />
                <div className="h-9 w-full rounded-xl bg-fill-2" />
              </div>
            </div>
            <div className="mx-1 h-3 w-2/3 animate-shimmer rounded-full bg-fill" />
          </div>
        ))}
      </div>
    </div>
  );
}
