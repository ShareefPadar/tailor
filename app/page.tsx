"use client";

import { useCallback, useReducer } from "react";
import { BriefBar } from "../components/BriefBar";
import { ProfilePanel } from "../components/ProfilePanel";
import { RoundView } from "../components/RoundView";
import { VariantSkeletons } from "../components/VariantGrid";
import { hasProfile, toPayload } from "../lib/profile";
import { createInitialState, reducer } from "../lib/store";
import { useTasteSummary } from "../lib/useTasteSummary";
import type { TokenKey, Tokens, Variant } from "../lib/types";

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

// Ids and timestamps are made at dispatch time so the reducer stays pure.
function stamp() {
  return { actionId: crypto.randomUUID(), at: Date.now() };
}

export default function Home() {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const { profile } = state;
  const loading = state.status === "loading";
  const currentRound = state.rounds[state.rounds.length - 1];

  useTasteSummary(profile.actions, hasProfile(profile), dispatch);

  const generate = useCallback(
    async (brief: string) => {
      if (loading) return;
      dispatch({ type: "GENERATE_START", brief });
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brief, profile: toPayload(profile) }),
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
    [loading, profile],
  );

  const mark = (type: "PICK" | "REJECT") => (variantId: string) =>
    dispatch({ type, variantId, ...stamp() });
  const tweak = (variantId: string, patch: Partial<Tokens>) =>
    dispatch({ type: "TWEAK", variantId, patch, ...stamp() });
  const edit = (tokens: Partial<Tokens>) => dispatch({ type: "EDIT_TOKEN", tokens, ...stamp() });

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-zinc-200 px-6">
        <h1 className="text-lg font-semibold">Style Twin</h1>
        <p className="text-sm text-zinc-500">An AI co-designer that learns your style.</p>
      </header>
      <div className="mx-auto grid w-full max-w-[1600px] gap-8 px-6 py-6 lg:grid-cols-[1fr_340px]">
        <main className="min-w-0 space-y-8">
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
          {loading ? (
            <VariantSkeletons />
          ) : (
            currentRound && (
              <RoundView
                round={currentRound}
                onPick={mark("PICK")}
                onReject={mark("REJECT")}
                onTweak={tweak}
              />
            )
          )}
        </main>
        <aside className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:self-start lg:overflow-y-auto">
          <ProfilePanel
            profile={profile}
            busy={loading}
            onEdit={edit}
            onToggleLock={(key: TokenKey) => dispatch({ type: "TOGGLE_LOCK", key })}
            onReset={() => dispatch({ type: "RESET" })}
          />
        </aside>
      </div>
    </>
  );
}
