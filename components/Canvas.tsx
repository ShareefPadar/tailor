import type { ReactNode } from "react";
import { BUTTON_SECONDARY, GLASS } from "./ui";

interface CanvasProps {
  children: ReactNode; // empty state, skeletons, or the shown round
  error: boolean;
  onRetry: () => void;
  promptBar: ReactNode;
}

// The centre pane: a scrolling canvas with the prompt bar floating over its bottom edge.
export function Canvas({ children, error, onRetry, promptBar }: CanvasProps) {
  return (
    <main className="relative order-2 flex min-h-0 min-w-0 flex-1 flex-col lg:order-none">
      <div className="@container min-h-0 flex-1 scroll-pb-44 px-3 pb-48 pt-3 lg:overflow-y-auto">{children}</div>
      <div className="pointer-events-none sticky bottom-0 z-20 flex justify-center px-3 pb-3 lg:absolute lg:inset-x-0">
        <div className="pointer-events-auto w-full max-w-2xl space-y-2">
          {error && (
            <div
              role="alert"
              className={`${GLASS} flex animate-rise items-center justify-between gap-4 rounded-2xl px-4 py-2.5 text-red-700`}
            >
              <span>Couldn&apos;t generate this time. Try again.</span>
              <button type="button" onClick={onRetry} className={BUTTON_SECONDARY}>
                Try again
              </button>
            </div>
          )}
          {promptBar}
        </div>
      </div>
    </main>
  );
}
