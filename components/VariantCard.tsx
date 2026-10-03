import { displayValue } from "../lib/tokens";
import type { Variant } from "../lib/types";
import { Render } from "./render/Render";

export function VariantCard({ variant }: { variant: Variant }) {
  const chips = variant.enforced.map((key) => displayValue(key, variant.tokens[key]));

  return (
    <article className="flex flex-col gap-3">
      <div className="flex min-h-[360px] items-center justify-center rounded-xl bg-[#f4f4f5] p-6">
        <Render spec={variant.layout} tokens={variant.tokens} />
      </div>
      <div className="space-y-1">
        <h3 className="font-medium">{variant.label}</h3>
        <p className="text-sm text-zinc-600">{variant.applied}</p>
        {chips.length > 0 && (
          <p className="inline-block rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-600">
            Uses: {chips.join(" · ")}
          </p>
        )}
      </div>
    </article>
  );
}
