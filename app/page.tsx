"use client";

import { useCallback, useReducer } from "react";
import { BriefBar } from "../components/BriefBar";
import { RoundView } from "../components/RoundView";
import { VariantSkeletons } from "../components/VariantGrid";
import { createInitialState, reducer } from "../lib/store";
import type { Variant } from "../lib/types";

interface GenerateResponse {
  variants: Variant[];
  source: "llm" | "cache";
}

function isGenerateResponse(data: unknown): data is GenerateResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    "variants" in data &&
    Array.isArray(data.variants) &&
    data.variants.length === 3 &&
    "source" in data &&
    (data.source === "llm" || data.source === "cache")
  );
}

export default function Home() {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const loading = state.status === "loading";
  const currentRound = state.rounds[state.rounds.length - 1];

  const generate = useCallback(
    async (brief: string) => {
      if (loading) return;
      dispatch({ type: "GENERATE_START", brief });
      try {
        // Phase 5 sends toPayload(profile) here; until then every round uses the seeds.
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brief, profile: null }),
        });
        const data: unknown = await res.json();
        if (!res.ok || !isGenerateResponse(data)) throw new Error("generation failed");
        dispatch({
          type: "GENERATE_SUCCESS",
          roundId: crypto.randomUUID(),
          brief,
          variants: data.variants,
          source: data.source,
        });
      } catch {
        dispatch({ type: "GENERATE_ERROR" });
      }
    },
    [loading],
  );

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-zinc-200 px-6">
        <h1 className="text-lg font-semibold">Style Twin</h1>
        <p className="text-sm text-zinc-500">An AI co-designer that learns your style.</p>
      </header>
      <main className="mx-auto w-full max-w-[1600px] space-y-8 px-6 py-6">
        <BriefBar
          loading={loading}
          emphasizePresets={state.rounds.length === 0}
          onGenerate={generate}
        />
        {state.status === "error" && (
          <div
            role="alert"
            className="flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            <span>Couldn&apos;t generate this time. Try again.</span>
            <button
              type="button"
              onClick={() => state.lastBrief && generate(state.lastBrief)}
              className="rounded-md border border-red-300 bg-white px-3 py-1 font-medium hover:bg-red-100"
            >
              Try again
            </button>
          </div>
        )}
        {loading ? <VariantSkeletons /> : currentRound && <RoundView round={currentRound} />}
      </main>
    </>
  );
}
