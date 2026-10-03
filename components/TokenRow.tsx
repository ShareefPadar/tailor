import { Lock, LockOpen } from "lucide-react";
import { displayValue, TOKEN_NAMES } from "../lib/tokens";
import type { TokenKey, Tokens } from "../lib/types";

interface TokenRowProps {
  tokenKey: TokenKey;
  value: Tokens[TokenKey];
  confidence: number | null;
  locked: boolean;
  // Id of the newest log entry for this token. A new id replays the highlight.
  lastChangeId: string | undefined;
}

export function TokenRow({ tokenKey, value, confidence, locked, lastChangeId }: TokenRowProps) {
  const percent = confidence === null ? 0 : Math.round(confidence * 100);

  return (
    <div
      key={lastChangeId ?? "unchanged"}
      className={`space-y-1.5 rounded-md px-2 py-2 ${lastChangeId ? "animate-flash" : ""}`}
    >
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="text-zinc-500">{TOKEN_NAMES[tokenKey]}</span>
        <span className="flex items-center gap-2 font-medium">
          {tokenKey === "primary" && (
            <svg width="14" height="14" aria-hidden="true">
              <rect width="14" height="14" rx="3" fill={String(value)} />
            </svg>
          )}
          {displayValue(tokenKey, value)}
          {locked ? (
            <Lock size={14} className="text-zinc-900" aria-label="Locked" />
          ) : (
            <LockOpen size={14} className="text-zinc-300" aria-hidden="true" />
          )}
        </span>
      </div>
      {confidence === null ? (
        <p className="text-xs text-zinc-400">Learning…</p>
      ) : (
        <svg
          className="h-1.5 w-full"
          role="img"
          aria-label={`Confidence ${percent}%`}
        >
          <rect width="100%" height="100%" rx="3" className="fill-zinc-200" />
          <rect width={`${percent}%`} height="100%" rx="3" className="fill-zinc-900" />
        </svg>
      )}
    </div>
  );
}
