import { generateJSON, LlmParseError } from "./llm";
import { applyEnforcement } from "./profile";
import { buildSummaryPrompt, buildUserPrompt, GENERATION_SYSTEM, SUMMARY_SYSTEM } from "./prompts";
import { parseSummary, validateVariants, type SummaryAction, type ValidationResult } from "./schema";
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

// One-line taste summary. Temperature 0.3, no retry. Callers treat any throw as "no summary".
export async function summarize(actions: SummaryAction[]): Promise<string | null> {
  const raw = await generateJSON({
    system: SUMMARY_SYSTEM,
    user: buildSummaryPrompt(actions),
    temperature: 0.3,
  });
  return parseSummary(raw);
}
