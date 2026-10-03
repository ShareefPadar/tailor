import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { generateContent } = vi.hoisted(() => ({ generateContent: vi.fn() }));
vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent };
  },
}));

import { generateJSON, LlmParseError } from "./llm";

// What the SDK really throws for an overloaded model: a plain Error whose message is the JSON body.
const overload = (code: number) =>
  new Error(JSON.stringify({ error: { code, message: "high demand", status: "UNAVAILABLE" } }));
const ok = { text: '{"ok":true}' };
const opts = { system: "s", user: "u", temperature: 0.4 };

beforeEach(() => {
  vi.useFakeTimers();
  generateContent.mockReset();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  process.env.GEMINI_API_KEY = "test-key";
  process.env.GEMINI_MODEL = "test-model";
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("generateJSON transient retry", () => {
  it("retries once after a 503 and returns the second reply", async () => {
    generateContent.mockRejectedValueOnce(overload(503)).mockResolvedValueOnce(ok);
    const result = generateJSON({ ...opts, retryTransient: true });
    await vi.advanceTimersByTimeAsync(1000);
    await expect(result).resolves.toEqual({ ok: true });
    expect(generateContent).toHaveBeenCalledTimes(2);
  });

  it.each([500, 502, 503, 504])("treats %i as transient", async (code) => {
    generateContent.mockRejectedValueOnce(overload(code)).mockResolvedValueOnce(ok);
    const result = generateJSON({ ...opts, retryTransient: true });
    await vi.advanceTimersByTimeAsync(1000);
    await expect(result).resolves.toEqual({ ok: true });
  });

  it("also recognises an error object carrying a numeric status", async () => {
    generateContent
      .mockRejectedValueOnce(Object.assign(new Error("overloaded"), { status: 503 }))
      .mockResolvedValueOnce(ok);
    const result = generateJSON({ ...opts, retryTransient: true });
    await vi.advanceTimersByTimeAsync(1000);
    await expect(result).resolves.toEqual({ ok: true });
  });

  it("gives up after one retry and throws the second error", async () => {
    generateContent.mockRejectedValueOnce(overload(503)).mockRejectedValueOnce(overload(500));
    const result = generateJSON({ ...opts, retryTransient: true });
    const assertion = expect(result).rejects.toThrow('"code":500');
    await vi.advanceTimersByTimeAsync(1000);
    await assertion;
    expect(generateContent).toHaveBeenCalledTimes(2);
  });

  it("waits before retrying instead of hammering the API", async () => {
    generateContent.mockRejectedValueOnce(overload(503)).mockResolvedValueOnce(ok);
    const result = generateJSON({ ...opts, retryTransient: true });
    await vi.advanceTimersByTimeAsync(500);
    expect(generateContent).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(500);
    expect(generateContent).toHaveBeenCalledTimes(2);
    await result;
  });

  it.each([400, 401, 404, 429])("does not retry a %i", async (code) => {
    generateContent.mockRejectedValue(overload(code));
    await expect(generateJSON({ ...opts, retryTransient: true })).rejects.toThrow(`"code":${code}`);
    expect(generateContent).toHaveBeenCalledTimes(1);
  });

  it("does not retry unless asked to (the summarizer must not retry)", async () => {
    generateContent.mockRejectedValue(overload(503));
    await expect(generateJSON(opts)).rejects.toThrow('"code":503');
    expect(generateContent).toHaveBeenCalledTimes(1);
  });

  it("does not retry an error that is not an API error", async () => {
    generateContent.mockRejectedValue(new Error("fetch failed"));
    await expect(generateJSON({ ...opts, retryTransient: true })).rejects.toThrow("fetch failed");
    expect(generateContent).toHaveBeenCalledTimes(1);
  });

  it("keeps the retry inside the single 20 s deadline", async () => {
    generateContent.mockRejectedValueOnce(overload(503)).mockReturnValueOnce(new Promise(() => {}));
    const result = generateJSON({ ...opts, retryTransient: true });
    const assertion = expect(result).rejects.toThrow("timed out");
    await vi.advanceTimersByTimeAsync(20_000);
    await assertion;
    expect(generateContent).toHaveBeenCalledTimes(2);
  });
});

describe("generateJSON parsing", () => {
  it("strips markdown fences", async () => {
    generateContent.mockResolvedValue({ text: '```json\n{"a":1}\n```' });
    await expect(generateJSON(opts)).resolves.toEqual({ a: 1 });
  });

  it("raises LlmParseError for empty or invalid replies", async () => {
    generateContent.mockResolvedValueOnce({ text: "" }).mockResolvedValueOnce({ text: "not json" });
    await expect(generateJSON(opts)).rejects.toBeInstanceOf(LlmParseError);
    await expect(generateJSON(opts)).rejects.toBeInstanceOf(LlmParseError);
  });
});
