import { ArrowUpRight } from "lucide-react";
import { PRESETS } from "../lib/presets";

interface EmptyStateProps {
  disabled: boolean;
  onPreset: (brief: string) => void;
}

// First visit: no rounds yet. The presets are the fastest way in.
export function EmptyState({ disabled, onPreset }: EmptyStateProps) {
  return (
    <div className="mx-auto flex max-w-2xl animate-rise flex-col items-center gap-8 pt-[12vh] text-center">
      <div className="space-y-2">
        <h2 className="text-[28px] font-semibold tracking-[-0.02em]">What are we designing?</h2>
        <p className="text-[15px] text-ink-2">
          Describe a component, or start from a preset. Pick what you like and Style Twin learns your taste.
        </p>
      </div>
      <div className="grid w-full gap-3 sm:grid-cols-3">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            disabled={disabled}
            onClick={() => onPreset(preset.brief)}
            className="group flex flex-col gap-1 rounded-2xl border border-hairline bg-white p-4 text-left shadow-frame transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-float disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="flex items-center justify-between text-[15px] font-medium">
              {preset.label}
              <ArrowUpRight size={16} aria-hidden="true" className="text-ink-3 transition-colors group-hover:text-ink" />
            </span>
            <span className="text-ink-2">{preset.brief}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
