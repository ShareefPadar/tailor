"use client";

import { useCallback, useReducer, useState } from "react";
import { BriefBar } from "../components/BriefBar";
import { Canvas } from "../components/Canvas";
import { EmptyState } from "../components/EmptyState";
import { ProfilePanel } from "../components/ProfilePanel";
import { RoundsSidebar } from "../components/RoundsSidebar";
import { RoundView } from "../components/RoundView";
import { Toolbar } from "../components/Toolbar";
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
  const [brief, setBrief] = useState("");
  // Which round the canvas shows. null means the current (last) round. View state only.
  const [shownRoundId, setShownRoundId] = useState<string | null>(null);

  const { profile } = state;
  const loading = state.status === "loading";
  const currentRound = state.rounds[state.rounds.length - 1];
  const shownRound = state.rounds.find((r) => r.id === shownRoundId) ?? currentRound;
  const isCurrent = shownRound === currentRound;

  useTasteSummary(profile.actions, hasProfile(profile), dispatch);

  const generate = useCallback(
    async (text: string) => {
      if (loading) return;
      setShownRoundId(null);
      dispatch({ type: "GENERATE_START", brief: text });
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brief: text, profile: toPayload(profile) }),
        });
        const data: unknown = await res.json();
        if (!res.ok || !isGenerateResponse(data)) throw new Error("generation failed");
        dispatch({
          type: "GENERATE_SUCCESS",
          roundId: crypto.randomUUID(),
          brief: text,
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

  const title = shownRound
    ? `Round ${shownRound.number} · “${shownRound.brief}”`
    : "An AI co-designer that learns your style.";

  return (
    <div className="flex min-h-dvh flex-col lg:h-dvh lg:overflow-hidden">
      <Toolbar
        title={title}
        busy={loading}
        onReset={() => {
          setShownRoundId(null);
          dispatch({ type: "RESET" });
        }}
      />
      <div className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[220px_minmax(0,1fr)_320px]">
        <RoundsSidebar rounds={state.rounds} shownId={shownRound?.id} onSelect={setShownRoundId} />
        <Canvas
          error={state.status === "error"}
          onRetry={() => state.lastBrief && generate(state.lastBrief)}
          promptBar={
            <BriefBar
              value={brief}
              onChange={setBrief}
              loading={loading}
              showPresets={state.rounds.length > 0}
              onGenerate={generate}
            />
          }
        >
          {loading ? (
            <VariantSkeletons />
          ) : shownRound ? (
            <RoundView
              round={shownRound}
              actions={
                isCurrent ? { onPick: mark("PICK"), onReject: mark("REJECT"), onTweak: tweak } : undefined
              }
              onBackToCurrent={() => setShownRoundId(null)}
            />
          ) : (
            <EmptyState
              disabled={loading}
              onPreset={(preset) => {
                setBrief(preset);
                generate(preset);
              }}
            />
          )}
        </Canvas>
        <aside className="min-h-0 border-t border-hairline bg-white lg:overflow-y-auto lg:border-l lg:border-t-0">
          <ProfilePanel
            profile={profile}
            onEdit={edit}
            onToggleLock={(key: TokenKey) => dispatch({ type: "TOGGLE_LOCK", key })}
          />
        </aside>
      </div>
    </div>
  );
}
