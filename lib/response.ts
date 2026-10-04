import type { Variant } from "./types";

export interface GenerateResponse {
  variants: Variant[];
  source: "llm" | "cache";
}

// Shape check for the /api/generate reply before it goes into state.
export function isGenerateResponse(data: unknown): data is GenerateResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    "variants" in data &&
    Array.isArray(data.variants) &&
    data.variants.length === 3 &&
    "source" in data &&
    (data.source === "llm" || data.source === "cache")
  );
}
