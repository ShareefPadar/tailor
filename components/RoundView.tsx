import type { Round } from "../lib/store";
import type { Tokens } from "../lib/types";
import { VariantGrid } from "./VariantGrid";

interface RoundViewProps {
  round: Round;
  onPick: (variantId: string) => void;
  onReject: (variantId: string) => void;
  onTweak: (variantId: string, patch: Partial<Tokens>) => void;
}

export function RoundView({ round, onPick, onReject, onTweak }: RoundViewProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-medium text-zinc-600">
        Round {round.number} · &ldquo;{round.brief}&rdquo;
      </h2>
      <VariantGrid round={round} onPick={onPick} onReject={onReject} onTweak={onTweak} />
    </section>
  );
}
