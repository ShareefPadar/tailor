"use client";

import { useCallback, useMemo, useReducer, useState } from "react";
import { BriefBar } from "../components/BriefBar";
import { Canvas } from "../components/Canvas";
import { ChangeLog } from "../components/ChangeLog";
import { EmptyState } from "../components/EmptyState";
import { LEFT, RIGHT, usePanelSizes } from "../components/panelSizes";
import { ProfilePanel } from "../components/ProfilePanel";
import { ResizeHandle } from "../components/ResizeHandle";
import { RoundsSidebar } from "../components/RoundsSidebar";
import { RoundView } from "../components/RoundView";
import { Toolbar } from "../components/Toolbar";
import { VariantSkeletons } from "../components/VariantGrid";
import { hasProfile, toPayload } from "../lib/profile";
import { isGenerateResponse } from "../lib/response";
import { createInitialState, reducer } from "../lib/store";
import { layoutTaste } from "../lib/taste";
import { useTasteSummary } from "../lib/useTasteSummary";
import type { TokenKey, Tokens } from "../lib/types";

// Ids and timestamps are made at dispatch time so the reducer stays pure.
function stamp() {
  return { actionId: crypto.randomUUID(), at: Date.now() };
}

export default function Home() {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const [brief, setBrief] = useState("");
  // Which round the canvas shows. null means the current (last) round. View state only.
  const [shownRoundId, setShownRoundId] = useState<string | null>(null);
  const panels = usePanelSizes();

  const { profile } = state;
  const loading = state.status === "loading";
  const currentRound = state.rounds[state.rounds.length - 1];
  const shownRound = state.rounds.find((r) => r.id === shownRoundId) ?? currentRound;
  const isCurrent = shownRound === currentRound;

  // Structure learned from picks and rejects. Sent with the profile; shown in the inspector.
  const taste = useMemo(() => layoutTaste(state.rounds), [state.rounds]);

  useTasteSummary(profile.actions, hasProfile(profile), dispatch);

  const generate = useCallback(
    async (text: string) => {
      if (loading) return;
      setShownRoundId(null);
      dispatch({ type: "GENERATE_START", brief: text });
      const payload = toPayload(profile);
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brief: text, profile: payload && { ...payload, layout: taste } }),
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
    [loading, profile, taste],
  );

  const mark = (type: "PICK" | "REJECT") => (variantId: string) =>
    dispatch({ type, variantId, ...stamp() });
  const tweak = (variantId: string, patch: Partial<Tokens>) =>
    dispatch({ type: "TWEAK", variantId, patch, ...stamp() });
  const edit = (tokens: Partial<Tokens>) => dispatch({ type: "EDIT_TOKEN", tokens, ...stamp() });

  const title = shownRound
    ? `Round ${shownRound.number} · “${shownRound.brief}”`
    : "UI tailored to your taste.";

  return (
    <div className="bg-dots flex min-h-dvh flex-col gap-3 p-3 lg:h-dvh lg:flex-row lg:gap-0 lg:overflow-hidden">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
        <Toolbar
          title={title}
          busy={loading}
          onReset={() => {
            setShownRoundId(null);
            dispatch({ type: "RESET" });
          }}
        />
        <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row lg:gap-0">
          {/* Below 1024px this wrapper dissolves, so the learned panel can sit after the canvas. */}
          <div className={`contents min-h-0 shrink-0 flex-col gap-3 lg:flex lg:max-w-[26vw] ${panels.leftClass}`}>
            <RoundsSidebar rounds={state.rounds} shownId={shownRound?.id} onSelect={setShownRoundId} />
            <aside className="glass order-3 min-h-0 rounded-2xl p-4 lg:order-none lg:flex-1 lg:overflow-y-auto">
              <ChangeLog log={profile.log} />
            </aside>
          </div>
          <ResizeHandle label="Resize left panels" side="left" value={panels.left} onChange={panels.setLeft} {...LEFT} />
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
        </div>
      </div>
      <ResizeHandle label="Resize style profile" side="right" value={panels.right} onChange={panels.setRight} {...RIGHT} />
      {/* Full height: the toolbar spans only the left panels and the canvas. */}
      <aside className={`glass min-h-0 shrink-0 rounded-2xl lg:max-w-[34vw] lg:overflow-y-auto ${panels.rightClass}`}>
        <ProfilePanel
          profile={profile}
          taste={taste}
          onEdit={edit}
          onToggleLock={(key: TokenKey) => dispatch({ type: "TOGGLE_LOCK", key })}
        />
      </aside>
    </div>
  );
}
