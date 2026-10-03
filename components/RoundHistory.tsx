import { ChevronRight } from "lucide-react";
import type { Round } from "../lib/store";
import { VariantGrid } from "./VariantGrid";

// Earlier rounds: one row each, click to expand, read-only.
export function RoundHistory({ rounds }: { rounds: Round[] }) {
  if (rounds.length === 0) return null;

  return (
    <section aria-label="Earlier rounds" className="space-y-2">
      {rounds.map((round) => {
        const picked = round.variants.find((v) => round.marks[v.id] === "picked");
        return (
          <details key={round.id} className="group rounded-lg border border-zinc-200">
            <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50 [&::-webkit-details-marker]:hidden">
              <ChevronRight size={16} className="shrink-0 transition-transform group-open:rotate-90" />
              <span className="truncate">
                Round {round.number} · &ldquo;{round.brief}&rdquo;
              </span>
              {picked && <span className="ml-auto shrink-0 text-xs text-zinc-400">Picked: {picked.label}</span>}
            </summary>
            <div className="p-4">
              <VariantGrid round={round} />
            </div>
          </details>
        );
      })}
    </section>
  );
}
