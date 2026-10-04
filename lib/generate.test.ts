import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./llm", () => {
  class LlmParseError extends Error {}
  class MissingConfigError extends Error {}
  return { generateJSON: vi.fn(), LlmParseError, MissingConfigError };
});

import { generateVariants, GenerationError, summarize } from "./generate";
import { generateJSON, LlmParseError } from "./llm";
import { SEEDS } from "./tokens";

const mock = vi.mocked(generateJSON);

const good = {
  variants: ["a", "b", "c"].map((label) => ({
    label,
    applied: "x",
    tokens: { radius: 10, primary: "#111111", density: "compact", shadow: "none", font: "Inter", tone: "neutral" },
    layout: { type: "card", children: [{ type: "text", text: "hi" }] },
  })),
};

const payload = {
  tokens: { ...SEEDS[2].tokens, radius: 16, density: "compact" as const, tone: "friendly" as const },
  enforced: ["radius" as const],
  confidence: {
    radius: 1, primary: null, density: null, shadow: null, font: null, tone: null,
    mode: null, buttonStyle: null, border: null, headingWeight: null, align: null, surface: null,
  },
  summary: null,
};

beforeEach(() => {
  mock.mockReset();
});

describe("generateVariants", () => {
  it("returns the seed variants when there is no profile, at temperature 0.9", async () => {
    mock.mockResolvedValueOnce(good);
    const variants = await generateVariants("brief", null);
    expect(variants.map((v) => v.label)).toEqual(["Minimal", "Bold", "Playful"]);
    expect(mock).toHaveBeenCalledTimes(1);
    expect(mock.mock.calls[0][0].temperature).toBe(0.9);
  });

  it("uses temperature 0.4 and enforces profile tokens", async () => {
    mock.mockResolvedValueOnce(good);
    const variants = await generateVariants("brief", payload);
    expect(mock.mock.calls[0][0].temperature).toBe(0.4);
    expect(variants.every((v) => v.tokens.radius === 16 && v.enforced.join() === "radius")).toBe(true);
  });

  it("asks the LLM wrapper to retry temporary server errors", async () => {
    mock.mockResolvedValueOnce(good);
    await generateVariants("brief", null);
    expect(mock.mock.calls[0][0].retryTransient).toBe(true);
  });

  it("retries once on invalid JSON, appending the error to the prompt", async () => {
    mock.mockRejectedValueOnce(new LlmParseError("reply was not valid JSON")).mockResolvedValueOnce(good);
    await generateVariants("brief", null);
    expect(mock).toHaveBeenCalledTimes(2);
    expect(mock.mock.calls[1][0].user).toContain(
      "Your previous reply was invalid: reply was not valid JSON. Return valid JSON only.",
    );
  });

  it("retries once on schema-invalid output", async () => {
    mock.mockResolvedValueOnce({ variants: [] }).mockResolvedValueOnce(good);
    await generateVariants("brief", null);
    expect(mock).toHaveBeenCalledTimes(2);
    expect(mock.mock.calls[1][0].user).toContain("expected 3 variants");
  });

  it("throws GenerationError after two invalid replies (AC8)", async () => {
    mock.mockRejectedValue(new LlmParseError("reply was not valid JSON"));
    await expect(generateVariants("brief", null)).rejects.toBeInstanceOf(GenerationError);
    expect(mock).toHaveBeenCalledTimes(2);
  });

  it("does not run its own retry after a timeout or API failure", async () => {
    mock.mockRejectedValue(new Error("LLM call timed out"));
    await expect(generateVariants("brief", null)).rejects.toThrow("timed out");
    expect(mock).toHaveBeenCalledTimes(1);
  });
});

describe("summarize", () => {
  const actions = [{ kind: "pick" as const, label: "Playful", tokens: { tone: "playful" as const } }];

  it("returns the summary at temperature 0.3 and never retries", async () => {
    mock.mockResolvedValueOnce({ summary: " Likes playful designs. " });
    await expect(summarize(actions)).resolves.toBe("Likes playful designs.");
    expect(mock.mock.calls[0][0].temperature).toBe(0.3);
    expect(mock.mock.calls[0][0].retryTransient).toBeUndefined();
  });

  it("returns null for an unusable reply", async () => {
    mock.mockResolvedValueOnce({ nope: true });
    await expect(summarize(actions)).resolves.toBeNull();
  });
});
