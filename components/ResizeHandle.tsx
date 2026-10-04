"use client";

import { useRef } from "react";
import { STEP } from "./panelSizes";

interface ResizeHandleProps {
  label: string;
  side: "left" | "right"; // which panel this handle resizes
  value: number;
  min: number;
  max: number;
  initial: number;
  onChange: (px: number) => void; // the caller clamps and snaps
}

// A drag handle between a side panel and the canvas. Drag, or focus it and use the arrow keys.
// Double-click resets. Hidden below 1024px, where the layout is a single column.
export function ResizeHandle({ label, side, value, min, max, initial, onChange }: ResizeHandleProps) {
  const drag = useRef<{ x: number; value: number } | null>(null);
  const direction = side === "left" ? 1 : -1; // the left panel grows rightwards, the right one leftwards

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      tabIndex={0}
      onPointerDown={(e) => {
        drag.current = { x: e.clientX, value };
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // No active pointer to capture; dragging still works while the pointer stays on the handle.
        }
      }}
      onPointerMove={(e) => {
        if (drag.current) onChange(drag.current.value + (e.clientX - drag.current.x) * direction);
      }}
      onPointerUp={() => (drag.current = null)}
      onPointerCancel={() => (drag.current = null)}
      onDoubleClick={() => onChange(initial)}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") onChange(value - STEP * direction);
        else if (e.key === "ArrowRight") onChange(value + STEP * direction);
        else if (e.key === "Home") onChange(min);
        else if (e.key === "End") onChange(max);
        else return;
        e.preventDefault();
      }}
      className="group hidden w-3 shrink-0 cursor-col-resize touch-none select-none items-center justify-center rounded-full lg:flex"
    >
      <span className="h-10 w-1 rounded-full bg-ink/0 transition-colors duration-150 group-hover:bg-ink/25 group-focus-visible:bg-ink/40 group-active:bg-ink/45" />
    </div>
  );
}
