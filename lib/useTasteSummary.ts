import { useEffect, type Dispatch } from "react";
import type { SummaryAction } from "./schema";
import type { StoreAction } from "./store";
import type { Action } from "./types";

const DEBOUNCE_MS = 1500;
const MAX_ACTIONS = 10;

function isSummaryResponse(data: unknown): data is { summary: string | null } {
  return (
    typeof data === "object" &&
    data !== null &&
    "summary" in data &&
    (typeof data.summary === "string" || data.summary === null)
  );
}

// Asks /api/summarize 1.5 s after the last action, only once a profile exists.
// A newer action cancels the timer and any request still in flight, so a stale
// summary can never land. Failures leave the existing summary untouched.
export function useTasteSummary(actions: Action[], enabled: boolean, dispatch: Dispatch<StoreAction>) {
  useEffect(() => {
    if (!enabled) return;
    const recent: SummaryAction[] = [];
    for (const a of actions) {
      if (a.kind !== "edit") recent.push({ kind: a.kind, label: a.variantLabel, tokens: a.tokens });
    }
    if (recent.length === 0) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ actions: recent.slice(-MAX_ACTIONS) }),
          signal: controller.signal,
        });
        const data: unknown = await res.json();
        if (isSummaryResponse(data) && data.summary !== null) {
          dispatch({ type: "SET_SUMMARY", summary: data.summary });
        }
      } catch {
        // Aborted or failed: keep whatever summary we have.
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [actions, enabled, dispatch]);
}
