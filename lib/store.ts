import { initialProfile, updateProfile } from "./profile";
import type { Profile, Variant } from "./types";

export type Mark = "picked" | "rejected";

export interface Round {
  id: string;
  number: number;
  brief: string;
  variants: Variant[];
  marks: Record<string, Mark>;
  source: "llm" | "cache";
}

export interface AppState {
  rounds: Round[]; // oldest first; last is current
  profile: Profile;
  status: "idle" | "loading" | "error";
  lastBrief: string | null; // for "Try again"
}

// Tweak, edit, lock and reset come in Phase 6.
// Ids and timestamps are created by the dispatcher so the reducer stays pure.
export type StoreAction =
  | { type: "GENERATE_START"; brief: string }
  | {
      type: "GENERATE_SUCCESS";
      roundId: string;
      brief: string;
      variants: Variant[];
      source: "llm" | "cache";
    }
  | { type: "GENERATE_ERROR" }
  | { type: "PICK"; variantId: string; actionId: string; at: number }
  | { type: "REJECT"; variantId: string; actionId: string; at: number }
  | { type: "SET_SUMMARY"; summary: string };

export function createInitialState(): AppState {
  return { rounds: [], profile: initialProfile(), status: "idle", lastBrief: null };
}

// Only the current round is interactive. One pick per round; a variant is marked at most once.
function markVariant(
  state: AppState,
  kind: "pick" | "reject",
  variantId: string,
  actionId: string,
  at: number,
): AppState {
  const round = state.rounds[state.rounds.length - 1];
  const variant = round?.variants.find((v) => v.id === variantId);
  if (!round || !variant || round.marks[variantId]) return state;
  if (kind === "pick" && Object.values(round.marks).includes("picked")) return state;

  const marked: Round = {
    ...round,
    marks: { ...round.marks, [variantId]: kind === "pick" ? "picked" : "rejected" },
  };
  const profile = updateProfile(state.profile, {
    id: actionId,
    kind,
    round: round.number,
    variantLabel: variant.label,
    tokens: variant.tokens, // full tokens for pick and reject
    at,
  });
  return { ...state, rounds: [...state.rounds.slice(0, -1), marked], profile };
}

export function reducer(state: AppState, action: StoreAction): AppState {
  switch (action.type) {
    case "GENERATE_START":
      return { ...state, status: "loading", lastBrief: action.brief };
    case "GENERATE_SUCCESS":
      return {
        ...state,
        status: "idle",
        rounds: [
          ...state.rounds,
          {
            id: action.roundId,
            number: state.rounds.length + 1,
            brief: action.brief,
            variants: action.variants,
            marks: {},
            source: action.source,
          },
        ],
      };
    case "GENERATE_ERROR":
      // Never touches the profile or existing rounds.
      return { ...state, status: "error" };
    case "PICK":
      return markVariant(state, "pick", action.variantId, action.actionId, action.at);
    case "REJECT":
      return markVariant(state, "reject", action.variantId, action.actionId, action.at);
    case "SET_SUMMARY":
      return { ...state, profile: { ...state.profile, summary: action.summary } };
  }
}
