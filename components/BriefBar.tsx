"use client";

import { ArrowUp, LoaderCircle } from "lucide-react";
import { PRESETS } from "../lib/presets";
import { GLASS } from "./ui";

interface BriefBarProps {
  value: string;
  onChange: (value: string) => void;
  loading: boolean;
  showPresets: boolean; // hidden on first visit, where the empty state shows them as cards
  onGenerate: (brief: string) => void;
}

// The prompt bar that floats over the bottom of the canvas.
export function BriefBar({ value, onChange, loading, showPresets, onGenerate }: BriefBarProps) {
  const trimmed = value.trim();

  const submit = (text: string) => {
    if (!loading && text) onGenerate(text);
  };

  return (
    <div className="space-y-2">
      {showPresets && (
        <div className="flex flex-wrap justify-center gap-1.5">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              disabled={loading}
              onClick={() => {
                onChange(preset.brief);
                submit(preset.brief);
              }}
              className={`${GLASS} h-7 rounded-full px-3 text-[12px] font-medium transition-transform duration-150 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
      <form
        className={`${GLASS} flex items-center gap-2 rounded-full py-1.5 pl-5 pr-1.5 transition-colors duration-150 focus-within:border-black/20`}
        onSubmit={(e) => {
          e.preventDefault();
          submit(trimmed);
        }}
      >
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={200}
          aria-label="Brief"
          placeholder="Describe a component, e.g. pricing card for a food delivery app"
          className="min-w-0 flex-1 bg-transparent py-2 text-[15px] outline-none placeholder:text-ink-2"
        />
        <button
          type="submit"
          aria-label="Generate"
          disabled={loading || !trimmed}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-white transition-[background-color,opacity,transform] duration-150 ease-out hover:bg-black active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 disabled:active:scale-100"
        >
          {loading ? (
            <LoaderCircle size={18} className="animate-spin" aria-hidden="true" />
          ) : (
            <ArrowUp size={18} strokeWidth={2.5} aria-hidden="true" />
          )}
        </button>
      </form>
    </div>
  );
}
