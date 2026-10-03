import { initialProfile } from "./profile";
import type { Profile, Variant } from "./types";

export interface Round {
  id: string;
  number: number;
  brief: string;
  variants: Variant[];
  marks: Record<string, "picked" | "rejected">;
  source: "llm" | "cache";
}

export interface AppState {
  rounds: Round[]; // oldest first; last is current
  profile: Profile;
  status: "idle" | "loading" | "error";
  lastBrief: string | null; // for "Try again"
}

// Phase 3 covers generation only. Pick, reject, tweak, edit, lock, summary and reset come later.
export type StoreAction =
  | { type: "GENERATE_START"; brief: string }
  | {
      type: "GENERATE_SUCCESS";
      roundId: string; // created by the caller so the reducer stays pure
      brief: string;
      variants: Variant[];
      source: "llm" | "cache";
    }
  | { type: "GENERATE_ERROR" };

export function createInitialState(): AppState {
  return { rounds: [], profile: initialProfile(), status: "idle", lastBrief: null };
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
  }
}
