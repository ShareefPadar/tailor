import { displayValue } from "../lib/tokens";
import type { Mark } from "../lib/store";
import type { Variant } from "../lib/types";
import { Render } from "./render/Render";

interface VariantCardProps {
  variant: Variant;
  mark: Mark | undefined;
  roundHasPick: boolean;
  onPick: () => void;
  onReject: () => void;
}

const BUTTON = "rounded-lg px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40";

export function VariantCard({ variant, mark, roundHasPick, onPick, onReject }: VariantCardProps) {
  const chips = variant.enforced.map((key) => displayValue(key, variant.tokens[key]));
  const open = mark === undefined; // a variant is marked at most once
  const dimmed = mark === "rejected" ? "opacity-50" : mark === undefined && roundHasPick ? "opacity-70" : "";
  const ring = mark === "picked" ? "ring-2 ring-green-600" : "";

  return (
    <article className="flex flex-col gap-3">
      <div
        className={`flex min-h-[360px] items-center justify-center rounded-xl bg-[#f4f4f5] p-6 transition-opacity ${dimmed} ${ring}`}
      >
        <Render spec={variant.layout} tokens={variant.tokens} />
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">{variant.label}</h3>
          {mark === "picked" && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">Picked</span>
          )}
          {mark === "rejected" && (
            <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-700">Rejected</span>
          )}
        </div>
        <p className="text-sm text-zinc-600">{variant.applied}</p>
        {chips.length > 0 && (
          <p className="inline-block rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-600">
            Uses: {chips.join(" · ")}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onPick}
          disabled={!open || roundHasPick}
          className={`${BUTTON} bg-zinc-900 text-white hover:bg-zinc-700`}
        >
          Pick
        </button>
        <button
          type="button"
          onClick={onReject}
          disabled={!open}
          className={`${BUTTON} border border-zinc-300 text-zinc-700 hover:bg-zinc-50`}
        >
          Reject
        </button>
      </div>
    </article>
  );
}
