import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

// The only file that imports the Gemini SDK. Switching providers means changing this file.

const TIMEOUT_MS = 20_000;
const RETRY_DELAY_MS = 1_000;
const RETRYABLE_STATUSES = [500, 502, 503, 504];

export class MissingConfigError extends Error {}

// The model replied, but not with parseable JSON. Worth one retry.
export class LlmParseError extends Error {}

function readConfig(): { apiKey: string; model: string } {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL;
  const missing = [
    ...(apiKey ? [] : ["GEMINI_API_KEY"]),
    ...(model ? [] : ["GEMINI_MODEL"]),
  ];
  if (!apiKey || !model) {
    console.error(`Missing env var(s): ${missing.join(", ")}`);
    throw new MissingConfigError(`missing ${missing.join(", ")}`);
  }
  return { apiKey, model };
}

function stripFences(s: string): string {
  return s
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
}

const apiErrorBody = z.object({ error: z.object({ code: z.number() }) });

// HTTP status of a failed API call. The SDK throws a plain Error whose message is the API's
// JSON body (e.g. {"error":{"code":503,...}}), so read the code from there. A numeric
// `status` (the SDK's ApiError) is honoured too.
function httpStatus(e: unknown): number | undefined {
  if (typeof e !== "object" || e === null) return undefined;
  if ("status" in e && typeof e.status === "number") return e.status;
  if (!("message" in e) || typeof e.message !== "string") return undefined;
  try {
    const body = apiErrorBody.safeParse(JSON.parse(e.message));
    return body.success ? body.data.error.code : undefined;
  } catch {
    return undefined;
  }
}

export async function generateJSON(opts: {
  system: string;
  user: string;
  temperature: number;
  // Retry once, after a short pause, when the API reports a temporary server error (500/502/503/504).
  retryTransient?: boolean;
}): Promise<unknown> {
  const { apiKey, model } = readConfig();
  const ai = new GoogleGenAI({ apiKey });

  let expired = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      expired = true;
      reject(new Error("LLM call timed out"));
    }, TIMEOUT_MS);
  });

  const call = async () =>
    (
      await ai.models.generateContent({
        model,
        contents: opts.user,
        config: {
          systemInstruction: opts.system,
          temperature: opts.temperature,
          responseMimeType: "application/json",
        },
      })
    ).text;

  // The retry runs inside the same deadline, so a call never takes longer than TIMEOUT_MS.
  const callWithRetry = async () => {
    try {
      return await call();
    } catch (e) {
      const status = httpStatus(e);
      if (!opts.retryTransient || status === undefined || !RETRYABLE_STATUSES.includes(status)) throw e;
      console.warn(`Gemini returned ${status}; retrying once`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      if (expired) throw e; // the deadline passed while waiting; don't start another request
      return call();
    }
  };

  try {
    const raw = await Promise.race([callWithRetry(), timeout]);
    if (!raw) throw new LlmParseError("empty response");
    try {
      return JSON.parse(stripFences(raw));
    } catch {
      throw new LlmParseError("reply was not valid JSON");
    }
  } finally {
    clearTimeout(timer);
  }
}
