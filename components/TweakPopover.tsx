"use client";

import { useEffect, useState } from "react";
import { diffTokens } from "../lib/tokens";
import type { TokenKey, Tokens } from "../lib/types";
import { TokenControl } from "./TokenControl";

const TWEAKABLE: readonly TokenKey[] = ["radius", "primary", "density", "tone"];

interface TweakPopoverProps {
  base: Tokens;
  onPreview: (tokens: Tokens) => void; // live preview on the card
  onApply: (patch: Partial<Tokens>) => void; // changed tokens only
  onClose: () => void; // cancel: the card reverts
}

export function TweakPopover({ base, onPreview, onApply, onClose }: TweakPopoverProps) {
  const [draft, setDraft] = useState(base);
  const patch = diffTokens(base, draft, TWEAKABLE);
  const changed = Object.keys(patch).length > 0;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const update = (change: Partial<Tokens>) => {
    const next = { ...draft, ...change };
    setDraft(next);
    onPreview(next);
  };

  return (
    <div
      role="dialog"
      aria-label="Tweak variant"
      className="absolute left-0 top-full z-20 mt-2 w-72 max-w-full space-y-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-lg"
    >
      {TWEAKABLE.map((key) => (
        <TokenControl key={key} tokenKey={key} tokens={draft} onChange={update} />
      ))}
      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!changed}
          onClick={() => onApply(patch)}
          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
