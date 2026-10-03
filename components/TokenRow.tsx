"use client";

import { Lock, LockOpen } from "lucide-react";
import { useState } from "react";
import { displayValue, pickToken, TOKEN_NAMES } from "../lib/tokens";
import type { TokenKey, Tokens } from "../lib/types";
import { TokenControl } from "./TokenControl";

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
      className={`space-y-1.5 rounded-md px-2 py-2 ${lastChangeId ? "animate-flash" : ""}`}
    >
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="text-zinc-500">{name}</span>
        <span className="flex items-center gap-2 font-medium">
          <button
            type="button"
            aria-label={`Edit ${name}`}
            onClick={() => setDraft(draft ? null : tokens)}
            className="flex items-center gap-2 rounded px-1 hover:bg-zinc-100"
          >
            {tokenKey === "primary" && (
              <svg width="14" height="14" aria-hidden="true">
                <rect width="14" height="14" rx="3" fill={tokens.primary} />
              </svg>
            )}
            {displayValue(tokenKey, tokens[tokenKey])}
          </button>
          <button
            type="button"
            aria-label={`${locked ? "Unlock" : "Lock"} ${name}`}
            aria-pressed={locked}
            onClick={onToggleLock}
            className="rounded p-0.5 hover:bg-zinc-100"
          >
            {locked ? <Lock size={14} className="text-zinc-900" /> : <LockOpen size={14} className="text-zinc-300" />}
          </button>
        </span>
      </div>
      {confidence === null ? (
        <p className="text-xs text-zinc-400">Learning…</p>
      ) : (
        <svg className="h-1.5 w-full" role="img" aria-label={`Confidence ${percent}%`}>
          <rect width="100%" height="100%" rx="3" className="fill-zinc-200" />
          <rect width={`${percent}%`} height="100%" rx="3" className="fill-zinc-900" />
        </svg>
      )}
      {draft && (
        <div className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
          <TokenControl tokenKey={tokenKey} tokens={draft} onChange={(change) => setDraft({ ...draft, ...change })} />
          <p className="text-xs text-zinc-500">Saving locks this value.</p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1 text-sm text-zinc-700 hover:bg-zinc-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onEdit(pickToken(draft, tokenKey));
                setDraft(null);
              }}
              className="rounded-lg bg-zinc-900 px-3 py-1 text-sm font-medium text-white hover:bg-zinc-700"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
