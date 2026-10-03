import type { Round } from "../lib/store";
import { BUTTON_SECONDARY } from "./ui";
import { VariantGrid, type RoundActions } from "./VariantGrid";

interface RoundViewProps {
  round: Round;
  actions?: RoundActions; // omitted for earlier rounds, which are read-only
  onBackToCurrent: () => void;
}

export function RoundView({ round, actions, onBackToCurrent }: RoundViewProps) {
  return (
    <section key={round.id} className="animate-rise space-y-5">
      {!actions && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-fill px-3 py-2">
          <span className="text-ink-2">Round {round.number} is an earlier round. It is read-only.</span>
          <button type="button" onClick={onBackToCurrent} className={BUTTON_SECONDARY}>
            Back to current
          </button>
        </div>
      )}
      <VariantGrid round={round} actions={actions} />
    </section>
  );
}
