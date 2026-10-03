import type { Round } from "../lib/store";
import { VariantGrid } from "./VariantGrid";

interface RoundViewProps {
  round: Round;
  onPick: (variantId: string) => void;
  onReject: (variantId: string) => void;
}

export function RoundView({ round, onPick, onReject }: RoundViewProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-medium text-zinc-600">
        Round {round.number} · &ldquo;{round.brief}&rdquo;
      </h2>
      <VariantGrid round={round} onPick={onPick} onReject={onReject} />
    </section>
  );
}
