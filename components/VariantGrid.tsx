import type { Variant } from "../lib/types";
import { VariantCard } from "./VariantCard";

const GRID = "grid grid-cols-1 gap-6 xl:grid-cols-3";

export function VariantGrid({ variants }: { variants: Variant[] }) {
  return (
    <div className={GRID}>
      {variants.map((variant) => (
        <VariantCard key={variant.id} variant={variant} />
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
