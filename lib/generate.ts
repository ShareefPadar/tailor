import { generateJSON, LlmParseError } from "./llm";
import { applyEnforcement } from "./profile";
import { buildUserPrompt, GENERATION_SYSTEM } from "./prompts";
import { validateVariants, type ValidationResult } from "./schema";
import type { ProfilePayload, Variant } from "./types";

export class GenerationError extends Error {}

async function attempt(user: string, temperature: number): Promise<ValidationResult> {
  try {
    const raw = await generateJSON({ system: GENERATION_SYSTEM, user, temperature });
    return validateVariants(raw);
  } catch (e) {
    // Bad JSON is retryable. Timeouts, network and config errors are not.
    if (e instanceof LlmParseError) return { ok: false, error: e.message };
    throw e;
  }
}

export async function generateVariants(
  brief: string,
  payload: ProfilePayload | null,
): Promise<Variant[]> {
  const temperature = payload === null ? 0.9 : 0.4;
  const user = buildUserPrompt(brief, payload);

  let result = await attempt(user, temperature);
  if (!result.ok) {
    const retryUser = `${user}\n\nYour previous reply was invalid: ${result.error}. Return valid JSON only.`;
    result = await attempt(retryUser, temperature);
  }
  if (!result.ok) throw new GenerationError(result.error);

  return applyEnforcement(result.variants, payload);
}
