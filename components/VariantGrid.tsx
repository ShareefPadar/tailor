import type { Round } from "../lib/store";
import type { Tokens } from "../lib/types";
import { VariantCard } from "./VariantCard";

// 3 across when the canvas is at least 700px wide (container query), otherwise 1.
const GRID = "mx-auto grid max-w-md grid-cols-1 gap-5 @[700px]:max-w-none @[700px]:grid-cols-3";

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
    <div className="space-y-4" role="status" aria-busy="true">
      <p className="text-sm text-zinc-500">Designing 3 options…</p>
      <div className={GRID}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-3">
            <div className="min-h-[360px] animate-pulse rounded-xl bg-zinc-100" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-zinc-100" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-zinc-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
