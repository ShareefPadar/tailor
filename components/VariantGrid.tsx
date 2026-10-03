import type { Round } from "../lib/store";
import type { Tokens } from "../lib/types";
import { VariantCard } from "./VariantCard";

const GRID = "grid grid-cols-1 gap-6 xl:grid-cols-3";

interface VariantGridProps {
  round: Round;
  onPick: (variantId: string) => void;
  onReject: (variantId: string) => void;
  onTweak: (variantId: string, patch: Partial<Tokens>) => void;
}

export function VariantGrid({ round, onPick, onReject, onTweak }: VariantGridProps) {
  const roundHasPick = Object.values(round.marks).includes("picked");
  return (
    <div className={GRID}>
      {round.variants.map((variant) => (
        <VariantCard
          key={variant.id}
          variant={variant}
          mark={round.marks[variant.id]}
          roundHasPick={roundHasPick}
          onPick={() => onPick(variant.id)}
          onReject={() => onReject(variant.id)}
          onTweak={(patch) => onTweak(variant.id, patch)}
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
