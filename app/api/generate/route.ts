import { z } from "zod";
import presetCache from "../../../data/preset-cache.json";
import { GenerationError, generateVariants } from "../../../lib/generate";
import { MissingConfigError } from "../../../lib/llm";
import { profilePayloadSchema, validateVariants } from "../../../lib/schema";

export const maxDuration = 45;

const requestSchema = z.object({
  brief: z.string().trim().min(1).max(200),
  profile: profilePayloadSchema.nullable(),
});

const cache: Record<string, unknown> = presetCache;

function badRequest(error: string) {
  return Response.json({ error }, { status: 400 });
}

export async function POST(req: Request) {
  const body: unknown = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return parsed.error.issues[0].path[0] === "profile"
      ? badRequest("Invalid profile")
      : badRequest("Brief must be 1–200 characters");
  }
  const { brief, profile } = parsed.data;

  // Cached first-round results for presets, with fresh ids. Falls through if the entry is bad.
  if (profile === null && Object.hasOwn(cache, brief)) {
    const cached = validateVariants({ variants: cache[brief] });
    if (cached.ok) return Response.json({ variants: cached.variants, source: "cache" });
  }

  try {
    const variants = await generateVariants(brief, profile);
    return Response.json({ variants, source: "llm" });
  } catch (e) {
    if (e instanceof MissingConfigError) {
      return Response.json({ error: "missing_config" }, { status: 500 });
    }
    console.error("generation failed:", e instanceof GenerationError ? e.message : e);
    return Response.json({ error: "generation_failed" }, { status: 502 });
  }
}
