import { SEEDS } from "./tokens";
import type { ProfilePayload, TokenKey, Tokens, Variant } from "./types";

// Phase 2 subset: enforcement only. The rest of the profile logic arrives in Phase 4.

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
