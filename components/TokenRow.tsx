"use client";

import { Lock, LockOpen } from "lucide-react";
import { useState } from "react";
import { displayValue, pickToken, TOKEN_NAMES } from "../lib/tokens";
import type { TokenKey, Tokens } from "../lib/types";
import { TokenControl } from "./TokenControl";
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from "./ui";

interface TokenRowProps {
  tokenKey: TokenKey;
  tokens: Tokens; // the profile's current tokens
  confidence: number | null;
  locked: boolean;
  // Id of the newest log entry for this token. A new id replays the highlight.
  lastChangeId: string | undefined;
  onEdit: (patch: Partial<Tokens>) => void; // sets the value and locks it
  onToggleLock: () => void;
}

export function TokenRow({ tokenKey, tokens, confidence, locked, lastChangeId, onEdit, onToggleLock }: TokenRowProps) {
  const [draft, setDraft] = useState<Tokens | null>(null); // non-null while editing
  const name = TOKEN_NAMES[tokenKey];
  const percent = confidence === null ? 0 : Math.round(confidence * 100);

  return (
    <div
      key={lastChangeId ?? "unchanged"}
      className={`space-y-1.5 rounded-lg px-2 py-2 ${lastChangeId ? "animate-flash" : ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-ink-2">{name}</span>
        <span className="flex items-center gap-0.5">
          <button
            type="button"
            aria-label={`Edit ${name}`}
            aria-expanded={draft !== null}
            onClick={() => setDraft(draft ? null : tokens)}
            className={`flex h-6 items-center gap-1.5 rounded-md px-1.5 font-medium tabular-nums transition-colors duration-150 hover:bg-fill ${draft ? "bg-fill" : ""}`}
          >
            {tokenKey === "primary" && (
              <svg width="12" height="12" aria-hidden="true">
                <rect width="12" height="12" rx="3" fill={tokens.primary} />
              </svg>
            )}
            {displayValue(tokenKey, tokens[tokenKey])}
          </button>
          <button
            type="button"
            aria-label={`${locked ? "Unlock" : "Lock"} ${name}`}
            aria-pressed={locked}
            onClick={onToggleLock}
            className="flex h-6 w-6 items-center justify-center rounded-md transition-colors duration-150 hover:bg-fill"
          >
            {locked ? <Lock size={13} className="text-ink" /> : <LockOpen size={13} className="text-ink-3" />}
          </button>
        </span>
      </div>
      {confidence === null ? (
        <p className="text-[11px] text-ink-2">Learning…</p>
      ) : (
        <svg className="block h-1 w-full" role="img" aria-label={`Confidence ${percent}%`}>
          <rect width="100%" height="100%" rx="2" className="fill-fill-2" />
          <rect width={`${percent}%`} height="100%" rx="2" className="fill-ink" />
        </svg>
      )}
      {draft && (
        <div className="animate-rise space-y-3 rounded-xl bg-canvas p-3">
          <TokenControl tokenKey={tokenKey} tokens={draft} onChange={(change) => setDraft({ ...draft, ...change })} />
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-ink-2">Saving locks this value.</p>
            <div className="flex gap-1.5">
              <button type="button" onClick={() => setDraft(null)} className={BUTTON_SECONDARY}>
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onEdit(pickToken(draft, tokenKey));
                  setDraft(null);
                }}
                className={BUTTON_PRIMARY}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
