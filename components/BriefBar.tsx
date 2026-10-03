"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";
import { PRESETS } from "../lib/presets";

interface BriefBarProps {
  loading: boolean;
  emphasizePresets: boolean;
  onGenerate: (brief: string) => void;
}

export function BriefBar({ loading, emphasizePresets, onGenerate }: BriefBarProps) {
  const [brief, setBrief] = useState("");
  const trimmed = brief.trim();

  const submit = (text: string) => {
    if (!loading && text) onGenerate(text);
  };

  const chipStyle = emphasizePresets
    ? "border-zinc-900 font-medium text-zinc-900 shadow-sm hover:bg-zinc-100"
    : "border-zinc-300 text-zinc-600 hover:bg-zinc-50";

  return (
    <div className="space-y-3">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit(trimmed);
        }}
      >
        <input
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          maxLength={200}
          aria-label="Brief"
          placeholder="Describe a component, e.g. pricing card for a food delivery app"
          className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
        />
        <button
          type="submit"
          disabled={loading || !trimmed}
          className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          <Sparkles size={16} />
          Generate
        </button>
      </form>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-zinc-500">Try a preset:</span>
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            disabled={loading}
            onClick={() => {
              setBrief(preset.brief);
              submit(preset.brief);
            }}
            className={`rounded-full border px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50 ${chipStyle}`}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
