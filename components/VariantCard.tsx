"use client";

import { Check, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { displayValue } from "../lib/tokens";
import type { Mark } from "../lib/store";
import type { Tokens, Variant } from "../lib/types";
import { Render } from "./render/Render";
import { TweakPopover } from "./TweakPopover";
import { BUTTON_GHOST, BUTTON_PRIMARY, BUTTON_SECONDARY } from "./ui";

export interface CardActions {
  onPick: () => void;
  onReject: () => void;
  onTweak: (patch: Partial<Tokens>) => void;
}

interface VariantCardProps {
  variant: Variant;
  mark: Mark | undefined;
  roundHasPick: boolean;
  actions?: CardActions; // omitted for earlier rounds, which are read-only
}

const BADGE = "inline-flex h-[18px] items-center gap-1 rounded-full px-2 text-[11px] font-medium";

// A variant shown as a frame on the canvas: label above, preview inside, actions below.
export function VariantCard({ variant, mark, roundHasPick, actions }: VariantCardProps) {
  const [tweaking, setTweaking] = useState(false);
  const [preview, setPreview] = useState<Tokens | null>(null); // live tweak preview
  const closeTweak = () => {
    setTweaking(false);
    setPreview(null);
  };

  const chips = variant.enforced.map((key) => displayValue(key, variant.tokens[key]));
  const open = mark === undefined; // a variant is marked at most once
  const dimmed = mark === "rejected" ? "opacity-50" : mark === undefined && roundHasPick ? "opacity-70" : "";
  const ring = mark === "picked" ? "ring-2 ring-ink" : "";

  return (
    <article className="relative flex flex-col gap-2.5">
      <header className="flex h-5 items-center gap-2 px-1">
        <h3 className="truncate text-[12px] font-medium text-ink-2">{variant.label}</h3>
        {mark === "picked" && (
          <span className={`${BADGE} bg-ink text-white`}>
            <Check size={11} strokeWidth={3} aria-hidden="true" />
            Picked
          </span>
        )}
        {mark === "rejected" && <span className={`${BADGE} bg-fill-2 text-ink-2`}>Rejected</span>}
      </header>
      <div
        className={`flex min-h-[360px] flex-1 items-center justify-center rounded-2xl border border-hairline bg-white p-3 shadow-frame transition-[opacity,box-shadow] duration-200 ease-out ${dimmed} ${ring}`}
      >
        <Render spec={variant.layout} tokens={preview ?? variant.tokens} />
      </div>
      <div className="space-y-1.5 px-1">
        <p className="text-ink-2">{variant.applied}</p>
        {chips.length > 0 && (
          <p className="inline-block rounded-full bg-fill px-2 py-0.5 text-[11px] text-ink-2">
            Uses: {chips.join(" · ")}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex gap-1.5 px-1">
          <button type="button" onClick={actions.onPick} disabled={!open || roundHasPick} className={BUTTON_PRIMARY}>
            Pick
          </button>
          <button type="button" onClick={actions.onReject} disabled={!open} className={BUTTON_SECONDARY}>
            Reject
          </button>
          <button
            type="button"
            onClick={() => (tweaking ? closeTweak() : setTweaking(true))}
            aria-expanded={tweaking}
            className={`${BUTTON_GHOST} ${tweaking ? "bg-fill text-ink" : ""}`}
          >
            <SlidersHorizontal size={14} aria-hidden="true" />
            Tweak
          </button>
        </div>
      )}
      {actions && tweaking && (
        <TweakPopover
          base={variant.tokens}
          onPreview={setPreview}
          onApply={(patch) => {
            actions.onTweak(patch);
            closeTweak();
          }}
          onClose={closeTweak}
        />
      )}
    </article>
  );
}
