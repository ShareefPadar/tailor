import type { Round } from "../lib/store";
import { VariantGrid } from "./VariantGrid";

export function RoundView({ round }: { round: Round }) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-medium text-zinc-600">
        Round {round.number} · &ldquo;{round.brief}&rdquo;
      </h2>
      <VariantGrid variants={round.variants} />
    </section>
  );
}
