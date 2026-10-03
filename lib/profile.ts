import { DEFAULT_TOKENS, SEEDS } from "./tokens";
import type { Profile, ProfilePayload, TokenKey, Tokens, Variant } from "./types";

// Subset so far: initialProfile and enforcement. The rest of the profile logic arrives in Phase 4.

export function initialProfile(): Profile {
  return {
    tokens: { ...DEFAULT_TOKENS },
    locked: { radius: false, primary: false, density: false, shadow: false, font: false, tone: false },
    scores: {
      density: { compact: 0, comfortable: 0, spacious: 0 },
      shadow: { none: 0, soft: 0, strong: 0 },
      font: { Inter: 0, "DM Sans": 0, "Space Grotesk": 0 },
      tone: { neutral: 0, friendly: 0, playful: 0, premium: 0 },
    },
    radiusSamples: [],
    actions: [],
    summary: null,
    log: [],
  };
}

function setToken<K extends TokenKey>(tokens: Tokens, key: K, value: Tokens[K]): void {
  tokens[key] = value;
}

export function applyEnforcement(variants: Variant[], payload: ProfilePayload | null): Variant[] {
  if (payload === null) {
    return variants.map((v, i) => ({
      ...v,
      label: SEEDS[i].label,
      tokens: { ...SEEDS[i].tokens },
      enforced: [],
    }));
  }
  return variants.map((v) => {
    const tokens = { ...v.tokens };
    for (const key of payload.enforced) setToken(tokens, key, payload.tokens[key]);
    return { ...v, tokens, enforced: [...payload.enforced] };
  });
}
