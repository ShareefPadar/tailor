"use client";

import { useEffect, useRef, useState } from "react";
import { diffTokens } from "../lib/tokens";
import type { TokenKey, Tokens } from "../lib/types";
import { TokenControl } from "./TokenControl";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, GLASS } from "./ui";

const TWEAKABLE: readonly TokenKey[] = ["radius", "primary", "density", "tone"];

interface TweakPopoverProps {
  base: Tokens;
  onPreview: (tokens: Tokens) => void; // live preview on the card
  onApply: (patch: Partial<Tokens>) => void; // changed tokens only
  onClose: () => void; // cancel: the card reverts
}

export function TweakPopover({ base, onPreview, onApply, onClose }: TweakPopoverProps) {
  const [draft, setDraft] = useState(base);
  const panel = useRef<HTMLDivElement>(null);
  const patch = diffTokens(base, draft, TWEAKABLE);
  const changed = Object.keys(patch).length > 0;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Bring the whole panel into view when it opens (the canvas reserves room for the prompt bar).
  useEffect(() => {
    panel.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, []);

  const update = (change: Partial<Tokens>) => {
    const next = { ...draft, ...change };
    setDraft(next);
    onPreview(next);
  };

  return (
    // The ::after spacer extends the scroll area so the panel can clear the floating prompt bar.
    <div
      ref={panel}
      role="dialog"
      aria-label="Tweak variant"
      className={`${GLASS} absolute left-0 top-full z-10 mt-2 w-72 max-w-full animate-rise space-y-3.5 rounded-2xl p-4 shadow-float after:pointer-events-none after:absolute after:left-0 after:top-full after:h-48 after:w-px after:content-['']`}
    >
      {TWEAKABLE.map((key) => (
        <TokenControl key={key} tokenKey={key} tokens={draft} onChange={update} />
      ))}
      <div className="flex justify-end gap-1.5 pt-1">
        <button type="button" onClick={onClose} className={BUTTON_SECONDARY}>
          Cancel
        </button>
        <button type="button" disabled={!changed} onClick={() => onApply(patch)} className={BUTTON_PRIMARY}>
          Apply
        </button>
      </div>
    </div>
  );
}
