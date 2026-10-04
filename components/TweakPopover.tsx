"use client";

import { useEffect, useRef, useState } from "react";
import { diffTokens } from "../lib/tokens";
import type { TokenKey, Tokens } from "../lib/types";
import { TokenControl } from "./TokenControl";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, GLASS } from "./ui";

const TWEAKABLE: readonly TokenKey[] = ["mode", "radius", "primary", "density", "tone"];

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

  // Desktop: bring the whole floating panel into view when it opens. Instant, not smooth: a smooth
  // scroll depends on animation frames and can be dropped; the panel's own fade-in softens the jump.
  useEffect(() => {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      panel.current?.scrollIntoView({ block: "nearest" });
    }
  }, []);

  const update = (change: Partial<Tokens>) => {
    const next = { ...draft, ...change };
    setDraft(next);
    onPreview(next);
  };

  return (
    // Desktop: floats under the frame; the ::after spacer extends the scroll area so the panel can
    // clear the floating prompt bar. Below 1024px: in the page flow, right under the Tweak button.
    <div
      ref={panel}
      role="dialog"
      aria-label="Tweak variant"
      className={`${GLASS} relative animate-rise space-y-3.5 rounded-2xl p-4 lg:absolute lg:left-0 lg:top-full lg:z-10 lg:mt-2 lg:w-72 lg:max-w-full lg:after:pointer-events-none lg:after:absolute lg:after:left-0 lg:after:top-full lg:after:h-48 lg:after:w-px lg:after:content-['']`}
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
