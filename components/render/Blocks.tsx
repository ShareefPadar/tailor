import { Check } from "lucide-react";
import type { Node } from "../../lib/types";

// The richer building blocks. Colours come from the CSS variables set on the Render root,
// so this file needs no inline styles.

type Block<T extends Node["type"]> = Extract<Node, { type: T }>;

export function Badge({ node }: { node: Block<"badge"> }) {
  return (
    <span className="rounded-full bg-[color:var(--st-tint)] px-2.5 py-0.5 text-[0.8em] font-medium text-[color:var(--st-primary)] [align-self:var(--st-justify)]">
      {node.text}
    </span>
  );
}

export function Stat({ node }: { node: Block<"stat"> }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-1.5 [justify-content:var(--st-justify)]">
      <span className="text-[2em] leading-none tracking-tight [font-weight:var(--st-heading-weight)]">{node.value}</span>
      {node.caption && <span className="text-[0.9em] text-[color:var(--st-muted)]">{node.caption}</span>}
    </div>
  );
}

export function Rows({ node }: { node: Block<"rows"> }) {
  return (
    <dl className="flex flex-col gap-[calc(var(--st-gap)*0.6)] text-left">
      {node.items.map((row, i) => (
        <div key={i} className="flex items-baseline justify-between gap-4">
          <dt className="text-[color:var(--st-muted)]">{row.label}</dt>
          <dd className="text-right font-medium">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

// Progress through stages: done steps are filled, the current one is ringed, later ones are muted.
export function Steps({ node }: { node: Block<"steps"> }) {
  return (
    <ol className="flex flex-col gap-[calc(var(--st-gap)*0.75)] text-left">
      {node.items.map((item, i) => {
        const done = i < node.current;
        const current = i === node.current;
        return (
          <li key={i} className="flex items-start gap-2.5" aria-current={current ? "step" : undefined}>
            <span
              className={`mt-[0.15em] flex h-[1.1em] w-[1.1em] shrink-0 items-center justify-center rounded-full border-2 ${
                done
                  ? "border-[color:var(--st-primary)] bg-[color:var(--st-primary)] text-[color:var(--st-on-primary)]"
                  : current
                    ? "border-[color:var(--st-primary)]"
                    : "border-[color:var(--st-line)]"
              }`}
            >
              {done && <Check size={10} strokeWidth={4} />}
              {current && <span className="h-[0.4em] w-[0.4em] rounded-full bg-[color:var(--st-primary)]" />}
            </span>
            <span className={current ? "font-semibold" : done ? "" : "text-[color:var(--st-muted)]"}>{item}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function Divider() {
  return <div role="separator" className="h-px w-full shrink-0 bg-[color:var(--st-line)]" />;
}
