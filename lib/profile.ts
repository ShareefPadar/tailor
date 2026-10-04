import { CATEGORY_KEYS, CATEGORY_OPTIONS, DEFAULT_TOKENS, displayValue, SEEDS, setToken, TOKEN_KEYS } from "./tokens";
import type {
  Action,
  CategoryKey,
  ChangeLogEntry,
  Profile,
  ProfilePayload,
  TokenKey,
  Tokens,
  Variant,
} from "./types";

// Pure and deterministic: no React, no fetch, no Date.now(), no random ids.
// Log entries take `at` from the action and use `${action.id}-${token}` as their id.

const PICK_WEIGHT = 1;
const REJECT_WEIGHT = 0.5;
const TWEAK_WEIGHT = 2;
const ENFORCE_AT = 0.6;
const RADIUS_WINDOW = 4;

// ---------- 8.1 Initial profile ----------

export function initialProfile(): Profile {
  return {
    tokens: { ...DEFAULT_TOKENS },
    locked: {
      radius: false, primary: false, density: false, shadow: false, font: false, tone: false,
      mode: false, buttonStyle: false, border: false, headingWeight: false, align: false, surface: false,
    },
    scores: {
      density: { compact: 0, comfortable: 0, spacious: 0 },
      shadow: { none: 0, soft: 0, strong: 0 },
      font: { Inter: 0, "DM Sans": 0, "Space Grotesk": 0 },
      tone: { neutral: 0, friendly: 0, playful: 0, premium: 0 },
      mode: { light: 0, dark: 0 },
      buttonStyle: { filled: 0, outline: 0, soft: 0 },
      border: { none: 0, hairline: 0, bold: 0 },
      headingWeight: { regular: 0, bold: 0, heavy: 0 },
      align: { left: 0, center: 0 },
      surface: { plain: 0, tinted: 0, gradient: 0 },
    },
    radiusSamples: [],
    actions: [],
    summary: null,
    log: [],
  };
}

// Rejects alone don't count.
export function hasProfile(p: Profile): boolean {
  return p.actions.some((a) => a.kind === "pick" || a.kind === "tweak" || a.kind === "edit");
}

// ---------- helpers ----------

// Read/write view of one category's scores. Shares the underlying object.
function scoreMap(scores: Profile["scores"], key: CategoryKey): Record<string, number> {
  return scores[key];
}

function clampRadius(v: number): number {
  return Math.min(24, Math.max(0, v));
}

function evenRadius(v: number): number {
  return Math.round(clampRadius(v) / 2) * 2;
}

function weightedRadius(samples: Profile["radiusSamples"]): number {
  const total = samples.reduce((sum, s) => sum + s.weight, 0);
  const avg = samples.reduce((sum, s) => sum + s.value * s.weight, 0) / total;
  return evenRadius(avg);
}

// Hex case is not meaningful, so a case-only difference is not a change.
function sameColor(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

function formatScore(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

// ---------- 8.2 updateProfile ----------

interface Draft {
  tokens: Tokens;
  locked: Profile["locked"];
  scores: Profile["scores"];
  samples: Profile["radiusSamples"];
  reasons: Partial<Record<TokenKey, string>>;
}

// Switch to the best-scored option only if its score is > 0 and strictly above the current value's.
// Ties keep the current value; ties between other options go to the first in option order.
function applyWinner(d: Draft, key: CategoryKey): void {
  const scores = scoreMap(d.scores, key);
  const options = CATEGORY_OPTIONS[key];
  let best = options[0];
  for (const option of options) if (scores[option] > scores[best]) best = option;
  const current = d.tokens[key];
  if (best !== current && scores[best] > 0 && scores[best] > scores[current]) {
    setToken(d.tokens, key, best);
  }
}

function setPrimary(d: Draft, value: string): void {
  if (!sameColor(value, d.tokens.primary)) d.tokens.primary = value;
}

function applyPick(d: Draft, tokens: Partial<Tokens>, label: string): void {
  const fromVariant = `From the ${label} variant you picked`;
  if (tokens.radius !== undefined && !d.locked.radius) {
    d.samples.push({ value: clampRadius(tokens.radius), weight: PICK_WEIGHT });
    d.tokens.radius = weightedRadius(d.samples);
    d.reasons.radius =
      d.samples.length === 1 ? fromVariant : `Average of your ${d.samples.length} picks and tweaks`;
  }
  if (tokens.primary !== undefined && !d.locked.primary) {
    setPrimary(d, tokens.primary);
    d.reasons.primary = fromVariant;
  }
  for (const key of CATEGORY_KEYS) {
    const option = tokens[key];
    if (option === undefined || d.locked[key]) continue;
    scoreMap(d.scores, key)[option] += PICK_WEIGHT;
    applyWinner(d, key);
    const score = scoreMap(d.scores, key)[d.tokens[key]];
    d.reasons[key] =
      score > 1
        ? `${displayValue(key, d.tokens[key])} leads your picks (${formatScore(score)} pts)`
        : fromVariant;
  }
}

// Rejects only lower category scores. Radius and color are ignored.
function applyReject(d: Draft, tokens: Partial<Tokens>): void {
  for (const key of CATEGORY_KEYS) {
    const option = tokens[key];
    if (option === undefined || d.locked[key]) continue;
    const old = d.tokens[key];
    scoreMap(d.scores, key)[option] -= REJECT_WEIGHT;
    applyWinner(d, key);
    d.reasons[key] = `You rejected ${displayValue(key, old)}`;
  }
}

// Tweaks are a strong signal: weight 2, and the value is set directly.
function applyTweak(d: Draft, tokens: Partial<Tokens>, label: string): void {
  const reason = `You tweaked it on ${label}`;
  if (tokens.radius !== undefined && !d.locked.radius) {
    const value = evenRadius(tokens.radius);
    d.samples.push({ value, weight: TWEAK_WEIGHT });
    d.tokens.radius = value;
    d.reasons.radius = reason;
  }
  if (tokens.primary !== undefined && !d.locked.primary) {
    setPrimary(d, tokens.primary);
    d.reasons.primary = reason;
  }
  for (const key of CATEGORY_KEYS) {
    const option = tokens[key];
    if (option === undefined || d.locked[key]) continue;
    scoreMap(d.scores, key)[option] += TWEAK_WEIGHT;
    setToken(d.tokens, key, option);
    d.reasons[key] = reason;
  }
}

// Edits set the value directly and lock it. They add no samples or scores.
function applyEdit(d: Draft, tokens: Partial<Tokens>): void {
  if (tokens.radius !== undefined) d.tokens.radius = evenRadius(tokens.radius);
  if (tokens.primary !== undefined) setPrimary(d, tokens.primary);
  for (const key of CATEGORY_KEYS) {
    const option = tokens[key];
    if (option !== undefined) setToken(d.tokens, key, option);
  }
  for (const key of TOKEN_KEYS) {
    if (tokens[key] === undefined) continue;
    d.locked[key] = true;
    d.reasons[key] = "You set it (locked)";
  }
}

export function updateProfile(profile: Profile, action: Action): Profile {
  const d: Draft = {
    tokens: { ...profile.tokens },
    locked: { ...profile.locked },
    scores: {
      density: { ...profile.scores.density },
      shadow: { ...profile.scores.shadow },
      font: { ...profile.scores.font },
      tone: { ...profile.scores.tone },
      mode: { ...profile.scores.mode },
      buttonStyle: { ...profile.scores.buttonStyle },
      border: { ...profile.scores.border },
      headingWeight: { ...profile.scores.headingWeight },
      align: { ...profile.scores.align },
      surface: { ...profile.scores.surface },
    },
    samples: profile.radiusSamples.map((s) => ({ ...s })),
    reasons: {},
  };

  switch (action.kind) {
    case "pick":
      applyPick(d, action.tokens, action.variantLabel);
      break;
    case "reject":
      applyReject(d, action.tokens);
      break;
    case "tweak":
      applyTweak(d, action.tokens, action.variantLabel);
      break;
    case "edit":
      applyEdit(d, action.tokens);
      break;
  }

  const entries: ChangeLogEntry[] = TOKEN_KEYS.filter((k) => d.tokens[k] !== profile.tokens[k]).map(
    (token) => ({
      id: `${action.id}-${token}`,
      token,
      from: displayValue(token, profile.tokens[token]),
      to: displayValue(token, d.tokens[token]),
      reason: d.reasons[token] ?? "",
      at: action.at,
    }),
  );

  return {
    ...profile,
    tokens: d.tokens,
    locked: d.locked,
    scores: d.scores,
    radiusSamples: d.samples,
    actions: [...profile.actions, action],
    log: [...entries, ...profile.log], // newest first; token order within one action
  };
}

// Pure lock toggle for the panel. Adds no action and no log entry.
export function toggleLock(profile: Profile, key: TokenKey): Profile {
  return { ...profile, locked: { ...profile.locked, [key]: !profile.locked[key] } };
}

// ---------- 8.3 Signals, 8.4 Confidence ----------

export function signals(profile: Profile, key: TokenKey): number {
  return profile.actions.filter(
    (a) => a.kind === "pick" || (a.kind === "tweak" && a.tokens[key] !== undefined),
  ).length;
}

export function confidence(profile: Profile, key: TokenKey): number | null {
  if (profile.locked[key]) return 1;
  if (signals(profile, key) < 2) return null;

  if (key === "radius") {
    const total = profile.radiusSamples.reduce((sum, s) => sum + s.weight, 0);
    if (total === 0) return 0;
    const near = profile.radiusSamples
      .filter((s) => Math.abs(s.value - profile.tokens.radius) <= RADIUS_WINDOW)
      .reduce((sum, s) => sum + s.weight, 0);
    return near / total;
  }

  if (key === "primary") {
    const votes = profile.actions.filter(
      (a) => (a.kind === "pick" || a.kind === "tweak") && a.tokens.primary !== undefined,
    );
    if (votes.length === 0) return 0;
    const agree = votes.filter((a) => sameColor(a.tokens.primary ?? "", profile.tokens.primary));
    return agree.length / votes.length;
  }

  const scores = scoreMap(profile.scores, key);
  const positiveSum = Object.values(scores)
    .filter((s) => s > 0)
    .reduce((sum, s) => sum + s, 0);
  return positiveSum === 0 ? 0 : Math.max(0, scores[profile.tokens[key]]) / positiveSum;
}

// ---------- 8.5 Enforcement ----------

export function enforcedKeys(profile: Profile): TokenKey[] {
  return TOKEN_KEYS.filter((key) => {
    const c = confidence(profile, key);
    return profile.locked[key] || (c !== null && c >= ENFORCE_AT);
  });
}

export function toPayload(profile: Profile): ProfilePayload | null {
  if (!hasProfile(profile)) return null;
  return {
    tokens: { ...profile.tokens },
    enforced: enforcedKeys(profile),
    confidence: {
      radius: confidence(profile, "radius"),
      primary: confidence(profile, "primary"),
      density: confidence(profile, "density"),
      shadow: confidence(profile, "shadow"),
      font: confidence(profile, "font"),
      tone: confidence(profile, "tone"),
      mode: confidence(profile, "mode"),
      buttonStyle: confidence(profile, "buttonStyle"),
      border: confidence(profile, "border"),
      headingWeight: confidence(profile, "headingWeight"),
      align: confidence(profile, "align"),
      surface: confidence(profile, "surface"),
    },
    summary: profile.summary,
  };
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
