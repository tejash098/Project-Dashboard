import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

/**
 * The prompt module is mocked rather than imported for real: it reads the 6.6KB
 * reference document off disk, and none of the assertions below care what is in
 * it. What they do care about is that whatever RESPONSE_SCHEMA holds reaches
 * Gemini's generationConfig, which a stand-in proves just as well.
 */
const { mockConfig, mockSchema } = vi.hoisted(() => ({
  mockConfig: {
    geminiApiBase: "https://gemini.example.test/v1beta",
    geminiModel: "gemini-test-model",
    chatTemperature: 0.3,
    chatMaxOutputTokens: 600,
  },
  mockSchema: { type: "OBJECT", properties: {} },
}));

vi.mock("../config/env.js", () => ({ default: mockConfig }));
vi.mock("../services/llm/systemPrompt.js", () => ({
  RESPONSE_SCHEMA: mockSchema,
}));

const { generateWithGemini, FAILURE } = await import(
  "../services/llm/geminiService.js"
);

/** A Gemini success envelope carrying a schema-shaped JSON payload. */
const okResponse = (payload) => ({
  ok: true,
  status: 200,
  text: async () =>
    JSON.stringify({
      candidates: [
        {
          content: { parts: [{ text: JSON.stringify(payload) }] },
          finishReason: "STOP",
        },
      ],
    }),
});

/** A Gemini error envelope, shaped like the real one. */
const errorResponse = (status, message, extra = "") => ({
  ok: false,
  status,
  text: async () =>
    JSON.stringify({ error: { code: status, message, status: extra } }),
});

/** The minimum viable call, so each test states only what it is testing. */
const callGemini = (overrides = {}) =>
  generateWithGemini({
    apiKey: "test-key",
    system: "SYSTEM PROMPT TEXT",
    messages: [{ role: "user", content: "hello" }],
    signal: undefined,
    ...overrides,
  });

describe("generateWithGemini", () => {
  let fetchSpy;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("authenticates with a header, never a query parameter", async () => {
    // A key in the URL leaks into every log line that records the request.
    // This is the assertion that keeps it out of one.
    fetchSpy.mockResolvedValue(okResponse({ reply: "hi", followUps: [] }));

    await callGemini();

    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe(
      "https://gemini.example.test/v1beta/models/gemini-test-model:generateContent",
    );
    expect(url).not.toContain("test-key");
    expect(init.headers["x-goog-api-key"]).toBe("test-key");
  });

  it("sends the system prompt as systemInstruction and asks for JSON", async () => {
    fetchSpy.mockResolvedValue(okResponse({ reply: "hi", followUps: [] }));

    await callGemini();

    const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(body.systemInstruction).toEqual({
      parts: [{ text: "SYSTEM PROMPT TEXT" }],
    });
    // Structured output is what makes the two follow-up questions recoverable
    // at all — without it the reply would have to be parsed out of prose.
    expect(body.generationConfig.responseMimeType).toBe("application/json");
    expect(body.generationConfig.responseSchema).toEqual(mockSchema);
  });

  it('renames the assistant role to "model"', async () => {
    // Gemini rejects role "assistant" outright, so a multi-turn conversation
    // 400s without this mapping. It is the most common bug in this integration.
    fetchSpy.mockResolvedValue(okResponse({ reply: "hi", followUps: [] }));

    await callGemini({
      messages: [
        { role: "user", content: "first" },
        { role: "assistant", content: "answer" },
        { role: "user", content: "second" },
      ],
    });

    const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(body.contents.map((turn) => turn.role)).toEqual([
      "user",
      "model",
      "user",
    ]);
    expect(body.contents[1].parts).toEqual([{ text: "answer" }]);
  });

  it("parses the reply and follow-ups out of the candidate payload", async () => {
    fetchSpy.mockResolvedValue(
      okResponse({
        reply: "  Tejash works across the MERN stack.  ",
        followUps: ["Where has he worked?", "What is this dashboard?"],
      }),
    );

    await expect(callGemini()).resolves.toEqual({
      reply: "Tejash works across the MERN stack.",
      followUps: ["Where has he worked?", "What is this dashboard?"],
    });
  });

  it("treats a 429 as a retryable key", async () => {
    fetchSpy.mockResolvedValue(errorResponse(429, "Quota exceeded"));

    await expect(callGemini()).rejects.toMatchObject({
      kind: FAILURE.RETRYABLE_KEY,
      status: 429,
      provider: "gemini",
    });
  });

  it("treats a 400 API_KEY_INVALID as a retryable key, not a bad request", async () => {
    // Gemini reports a revoked key as 400 rather than 401. Without this special
    // case one stale key would abort the whole request instead of rotating.
    fetchSpy.mockResolvedValue(
      errorResponse(400, "API key not valid. Please pass a valid API key.", "API_KEY_INVALID"),
    );

    await expect(callGemini()).rejects.toMatchObject({
      kind: FAILURE.RETRYABLE_KEY,
      status: 400,
    });
  });

  it("treats an ordinary 400 as an invalid request", async () => {
    // The other half of the case above: a genuinely malformed payload fails
    // identically on every key, so the cascade must stop rather than burn them.
    fetchSpy.mockResolvedValue(errorResponse(400, "Invalid JSON payload"));

    await expect(callGemini()).rejects.toMatchObject({
      kind: FAILURE.REQUEST_INVALID,
      status: 400,
    });
  });

  it("treats a 404 as the provider being down", async () => {
    // Almost always a wrong model id. Rotating keys cannot fix it.
    fetchSpy.mockResolvedValue(errorResponse(404, "models/x is not found"));

    await expect(callGemini()).rejects.toMatchObject({
      kind: FAILURE.PROVIDER_DOWN,
      status: 404,
    });
  });

  it.each([
    ["a safety block", { promptFeedback: { blockReason: "SAFETY" } }],
    ["no candidates", { candidates: [] }],
    [
      "an early stop",
      { candidates: [{ content: { parts: [] }, finishReason: "MAX_TOKENS" }] },
    ],
    [
      "output that is not valid JSON",
      {
        candidates: [
          { content: { parts: [{ text: "not json" }] }, finishReason: "STOP" },
        ],
      },
    ],
  ])("reports %s as the provider being down", async (_label, body) => {
    // All four arrive as HTTP 200, so a bare status check would let them
    // through as successful answers.
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(body),
    });

    await expect(callGemini()).rejects.toMatchObject({
      kind: FAILURE.PROVIDER_DOWN,
    });
  });

  it("reports an aborted request as the provider being down", async () => {
    // A timeout is not key-specific, so another key would only burn the budget.
    const abort = new Error("The operation was aborted");
    abort.name = "TimeoutError";
    fetchSpy.mockRejectedValue(abort);

    await expect(callGemini()).rejects.toMatchObject({
      kind: FAILURE.PROVIDER_DOWN,
    });
  });

  it("never leaks the API key into an error message", async () => {
    // Defensive: Gemini does not echo the key today, but an error message is
    // the one string in this module that reaches a log file.
    fetchSpy.mockResolvedValue(
      errorResponse(400, "rejected credential test-key for this project"),
    );

    const error = await callGemini().catch((err) => err);

    expect(error.message).not.toContain("test-key");
    expect(error.message).toContain("***");
  });
});
