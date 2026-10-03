// Shared class strings so every shell component uses the same primitives (SPEC 12.1).

export const LABEL = "text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-2";

// Liquid-glass surface (defined in app/globals.css). It sets its own border and shadow.
export const GLASS = "glass";

const BUTTON =
  "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium " +
  "transition-[background-color,color,opacity,transform] duration-150 ease-out active:scale-[0.97] " +
  "disabled:cursor-not-allowed disabled:opacity-35 disabled:active:scale-100";

export const BUTTON_PRIMARY = `${BUTTON} bg-ink text-white hover:bg-black`;
export const BUTTON_SECONDARY = `${BUTTON} bg-fill text-ink hover:bg-fill-2`;
export const BUTTON_GHOST = `${BUTTON} text-ink-2 hover:bg-fill hover:text-ink`;
