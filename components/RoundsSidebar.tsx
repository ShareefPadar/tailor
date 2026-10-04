import type { Round } from "../lib/store";
import { LABEL } from "./ui";

interface RoundsSidebarProps {
  rounds: Round[]; // oldest first; last is current
  shownId: string | undefined;
  onSelect: (roundId: string) => void;
}

export function RoundsSidebar({ rounds, shownId, onSelect }: RoundsSidebarProps) {
  return (
    <nav
      aria-label="Rounds"
      className="glass flex shrink-0 gap-1 overflow-x-auto rounded-2xl px-2 py-2 lg:max-h-[45%] lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden lg:py-3"
    >
      <h2 className={`${LABEL} hidden px-2 pb-2 lg:block`}>Rounds</h2>
      {rounds.length === 0 && <p className="px-2 py-1 text-ink-2">No rounds yet.</p>}
      {rounds.map((round) => {
        const picked = round.variants.find((v) => round.marks[v.id] === "picked");
        const shown = round.id === shownId;
        return (
          <button
            key={round.id}
            type="button"
            aria-current={shown ? "true" : undefined}
            onClick={() => onSelect(round.id)}
            className={`flex w-48 shrink-0 items-start gap-2 rounded-lg px-2 py-1.5 text-left transition-colors duration-150 lg:w-auto ${shown ? "bg-fill-2" : "hover:bg-fill"}`}
          >
            <span className="mt-px flex h-[18px] min-w-[18px] items-center justify-center rounded-md bg-fill px-1 text-[11px] font-semibold tabular-nums text-ink-2">
              {round.number}
            </span>
            <span className="min-w-0">
              <span className={`block truncate ${shown ? "font-medium text-ink" : "text-ink"}`}>{round.brief}</span>
              {picked && <span className="block truncate text-[11px] text-ink-2">Picked: {picked.label}</span>}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
