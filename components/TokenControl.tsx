import { DENSITIES, displayValue, FONTS, SHADOWS, TONES, TOKEN_NAMES } from "../lib/tokens";
import type { TokenKey, Tokens } from "../lib/types";

// Literal class names so Tailwind can see them. Dynamic hex never goes in a style attribute.
const SWATCHES = [
  { hex: "#111827", className: "bg-[#111827]" },
  { hex: "#2563eb", className: "bg-[#2563eb]" },
  { hex: "#7c3aed", className: "bg-[#7c3aed]" },
  { hex: "#16a34a", className: "bg-[#16a34a]" },
  { hex: "#e11d48", className: "bg-[#e11d48]" },
  { hex: "#ea580c", className: "bg-[#ea580c]" },
];

const LABEL = "text-xs font-medium text-zinc-500";
const FIELD = "w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm";

interface SegmentedProps<T extends string> {
  tokenKey: TokenKey;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
}

function Segmented<T extends string>({ tokenKey, options, value, onChange }: SegmentedProps<T>) {
  return (
    <div role="group" aria-label={TOKEN_NAMES[tokenKey]} className="flex overflow-hidden rounded-md border border-zinc-300">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={option === value}
          onClick={() => onChange(option)}
          className={`flex-1 px-2 py-1.5 text-xs ${option === value ? "bg-zinc-900 text-white" : "bg-white text-zinc-700 hover:bg-zinc-50"}`}
        >
          {displayValue(tokenKey, option)}
        </button>
      ))}
    </div>
  );
}

interface TokenControlProps {
  tokenKey: TokenKey;
  tokens: Tokens;
  onChange: (patch: Partial<Tokens>) => void;
}

// One editing control per token. Used by the tweak popover and by the panel's edit.
export function TokenControl({ tokenKey, tokens, onChange }: TokenControlProps) {
  const title = TOKEN_NAMES[tokenKey];
  switch (tokenKey) {
    case "radius":
      return (
        <label className="block space-y-1">
          <span className={LABEL}>{title} · {tokens.radius}px</span>
          <input
            type="range" min={0} max={24} step={2} value={tokens.radius}
            onChange={(e) => onChange({ radius: Number(e.target.value) })}
            className="w-full accent-zinc-900"
          />
        </label>
      );
    case "primary":
      return (
        <div className="space-y-1">
          <span className={LABEL}>{title}</span>
          <div className="flex items-center gap-2">
            {SWATCHES.map((swatch) => (
              <button
                key={swatch.hex}
                type="button"
                aria-label={swatch.hex}
                aria-pressed={tokens.primary.toLowerCase() === swatch.hex}
                onClick={() => onChange({ primary: swatch.hex })}
                className={`h-6 w-6 rounded-full ${swatch.className} ${tokens.primary.toLowerCase() === swatch.hex ? "ring-2 ring-zinc-900 ring-offset-2" : ""}`}
              />
            ))}
            <input
              type="color" value={tokens.primary} aria-label="Custom color"
              onChange={(e) => onChange({ primary: e.target.value })}
              className="h-6 w-8 cursor-pointer rounded border border-zinc-300 bg-white p-0"
            />
          </div>
        </div>
      );
    case "density":
      return (
        <div className="space-y-1">
          <span className={LABEL}>{title}</span>
          <Segmented tokenKey="density" options={DENSITIES} value={tokens.density} onChange={(density) => onChange({ density })} />
        </div>
      );
    case "shadow":
      return (
        <div className="space-y-1">
          <span className={LABEL}>{title}</span>
          <Segmented tokenKey="shadow" options={SHADOWS} value={tokens.shadow} onChange={(shadow) => onChange({ shadow })} />
        </div>
      );
    case "font":
      return (
        <label className="block space-y-1">
          <span className={LABEL}>{title}</span>
          <select
            value={tokens.font} className={FIELD}
            onChange={(e) => onChange({ font: FONTS.find((f) => f === e.target.value) ?? tokens.font })}
          >
            {FONTS.map((font) => <option key={font} value={font}>{font}</option>)}
          </select>
        </label>
      );
    case "tone":
      return (
        <label className="block space-y-1">
          <span className={LABEL}>{title}</span>
          <select
            value={tokens.tone} className={FIELD}
            onChange={(e) => onChange({ tone: TONES.find((t) => t === e.target.value) ?? tokens.tone })}
          >
            {TONES.map((tone) => <option key={tone} value={tone}>{displayValue("tone", tone)}</option>)}
          </select>
        </label>
      );
  }
}
