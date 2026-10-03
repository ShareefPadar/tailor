import { TOKEN_NAMES } from "../lib/tokens";
import type { ChangeLogEntry } from "../lib/types";

const MAX_SHOWN = 10;

export function ChangeLog({ log }: { log: ChangeLogEntry[] }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">What I learned</h3>
      {log.length === 0 ? (
        <p className="text-sm text-zinc-400">Nothing yet.</p>
      ) : (
        <ul className="space-y-3">
          {log.slice(0, MAX_SHOWN).map((entry) => (
            <li key={entry.id} className="text-sm">
              <p className="font-medium">
                {TOKEN_NAMES[entry.token]} {entry.from} → {entry.to}
              </p>
              <p className="text-zinc-500">{entry.reason}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
