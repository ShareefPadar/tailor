import { Layers2 } from "lucide-react";
import { BUTTON_GHOST } from "./ui";

interface ToolbarProps {
  title: string; // the shown round, or the tagline when there are no rounds
  busy: boolean; // a generation is in flight
  onReset: () => void;
}

export function Toolbar({ title, busy, onReset }: ToolbarProps) {
  return (
    <header className="z-30 grid h-12 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-hairline bg-white/75 px-4 backdrop-blur-xl backdrop-saturate-150">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-ink text-white">
          <Layers2 size={14} aria-hidden="true" />
        </span>
        <h1 className="whitespace-nowrap text-[13px] font-semibold">Style Twin</h1>
      </div>
      <p className="max-w-[46vw] truncate text-center text-[13px] text-ink-2">{title}</p>
      <div className="flex justify-end">
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (window.confirm("Clear everything Style Twin has learned?")) onReset();
          }}
          className={BUTTON_GHOST}
        >
          Reset
        </button>
      </div>
    </header>
  );
}
