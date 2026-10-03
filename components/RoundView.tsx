import type { Round } from "../lib/store";
import { VariantGrid, type RoundActions } from "./VariantGrid";

export function RoundView({ round, actions }: { round: Round; actions: RoundActions }) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-medium text-zinc-600">
        Round {round.number} · &ldquo;{round.brief}&rdquo;
      </h2>
      <VariantGrid round={round} actions={actions} />
    </section>
  );
}
