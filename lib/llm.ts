import { GoogleGenAI } from "@google/genai";

// The only file that imports the Gemini SDK. Switching providers means changing this file.

const TIMEOUT_MS = 20_000;

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

export async function generateJSON(opts: {
  system: string;
  user: string;
  temperature: number;
}): Promise<unknown> {
  const { apiKey, model } = readConfig();
  const ai = new GoogleGenAI({ apiKey });

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("LLM call timed out")), TIMEOUT_MS);
  });

  try {
    const response = await Promise.race([
      ai.models.generateContent({
        model,
        contents: opts.user,
        config: {
          systemInstruction: opts.system,
          temperature: opts.temperature,
          responseMimeType: "application/json",
        },
      }),
      timeout,
    ]);
    const raw = response.text;
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
