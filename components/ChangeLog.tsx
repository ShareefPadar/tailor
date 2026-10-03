import { TOKEN_NAMES } from "../lib/tokens";
import type { ChangeLogEntry } from "../lib/types";
import { LABEL } from "./ui";

const MAX_SHOWN = 10;

export function ChangeLog({ log }: { log: ChangeLogEntry[] }) {
  return (
    <section className="space-y-3">
      <h3 className={LABEL}>What I learned</h3>
      {log.length === 0 ? (
        <p className="text-ink-2">Nothing yet.</p>
      ) : (
        <ul className="space-y-3">
          {log.slice(0, MAX_SHOWN).map((entry) => (
            <li key={entry.id} className="animate-rise">
              <p className="font-medium tabular-nums">
                {TOKEN_NAMES[entry.token]} {entry.from} → {entry.to}
              </p>
              <p className="text-ink-2">{entry.reason}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
