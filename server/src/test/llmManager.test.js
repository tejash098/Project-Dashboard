import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * Both collaborators are replaced, so nothing here reaches the network or reads
 * the reference document. FAILURE has to carry the real string values, because
 * the manager branches on them — a stand-in taxonomy would make the failure
 * tests pass for the wrong reason.
 */
const { mockConfig, mockGenerate, FAILURE } = vi.hoisted(() => ({
  mockConfig: {
    geminiApiKey: "test-key",
    chatMaxHistoryTurns: 3,
    chatMaxHistoryChars: 50,
    chatFollowUpCount: 2,
    chatAttemptTimeoutMs: 5_000,
  },
  mockGenerate: vi.fn(),
  FAILURE: {
    RETRYABLE_KEY: "retryable-key",
    PROVIDER_DOWN: "provider-down",
    REQUEST_INVALID: "request-invalid",
  },
}));

vi.mock("../config/env.js", () => ({ default: mockConfig }));
vi.mock("../services/llm/geminiService.js", () => ({
  generateWithGemini: mockGenerate,
  FAILURE,
}));
vi.mock("../services/llm/systemPrompt.js", () => ({
  SYSTEM_PROMPT: "SYSTEM PROMPT TEXT",
  OUT_OF_REFERENCE_REPLY: "Out of reference.",
  DEFAULT_FOLLOW_UPS: ["Fallback one?", "Fallback two?"],
}));

const { generateReply } = await import("../services/llm/llmManager.js");

/** A provider failure tagged the way geminiService tags them. */
const providerFailure = (kind, status) =>
  Object.assign(new Error(`gemini failed (${kind})`), { kind, status });

/** A well-formed provider result, so tests state only what they vary. */
const answer = (overrides = {}) => ({
  reply: "Tejash works across the MERN stack.",
  followUps: ["Where has he worked?", "What is this dashboard?"],
  ...overrides,
});

describe("generateReply", () => {
  beforeEach(() => {
    mockConfig.geminiApiKey = "test-key";
    mockGenerate.mockReset();
  });

  it("passes the key, prompt and question to the provider", async () => {
    mockGenerate.mockResolvedValue(answer());

    const result = await generateReply({ message: "What is his stack?" });

    expect(result).toEqual(answer());
    expect(mockGenerate).toHaveBeenCalledTimes(1);
    const call = mockGenerate.mock.calls[0][0];
    expect(call.apiKey).toBe("test-key");
    expect(call.system).toBe("SYSTEM PROMPT TEXT");
    expect(call.signal).toBeInstanceOf(AbortSignal);
  });

  it("fails fast when no key is configured, calling nothing", async () => {
    // The deployed state today. It must cost nothing and reach no network.
    mockConfig.geminiApiKey = undefined;

    await expect(generateReply({ message: "hi" })).rejects.toMatchObject({
      code: "no-keys",
    });
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it.each([
    ["a throttled key", FAILURE.RETRYABLE_KEY, 429],
    ["a rejected key", FAILURE.RETRYABLE_KEY, 401],
    ["the provider being down", FAILURE.PROVIDER_DOWN, 503],
  ])("reports %s as all-failed", async (_label, kind, status) => {
    // All of these look identical to the visitor — a 503 — but the kind is
    // logged so the cause stays diagnosable from the server side.
    mockGenerate.mockRejectedValue(providerFailure(kind, status));

    await expect(generateReply({ message: "hi" })).rejects.toMatchObject({
      code: "all-failed",
    });
  });

  it("separates a malformed payload from an unavailable provider", async () => {
    // This is our bug, not the vendor's, so the controller turns it into a 400
    // rather than telling the visitor to try again later.
    mockGenerate.mockRejectedValue(providerFailure(FAILURE.REQUEST_INVALID, 400));

    await expect(generateReply({ message: "hi" })).rejects.toMatchObject({
      code: "request-invalid",
    });
  });

  it.each([
    ["Out of reference!"],
    ["out of reference"],
    ["Sorry, out of reference."],
    ["I am sorry, out of reference."],
  ])("normalizes %j to the exact refusal string", async (reply) => {
    // The prompt asks for the exact string; this is what guarantees it, so the
    // client can compare against one constant instead of fuzzy-matching prose.
    mockGenerate.mockResolvedValue(answer({ reply }));

    const result = await generateReply({ message: "weather in Tokyo?" });

    expect(result.reply).toBe("Out of reference.");
  });

  it("leaves a real answer that merely mentions the phrase alone", async () => {
    // The normalizer is bounded to a few leading words precisely so it cannot
    // swallow a genuine answer that happens to use the words later on.
    const reply =
      "Tejash built this dashboard, and questions beyond it are out of reference.";
    mockGenerate.mockResolvedValue(answer({ reply }));

    const result = await generateReply({ message: "who built this?" });

    expect(result.reply).toBe(reply);
  });

  it("pads a short follow-up list up to the promised count", async () => {
    mockGenerate.mockResolvedValue(answer({ followUps: ["Only one?"] }));

    const result = await generateReply({ message: "hi" });

    expect(result.followUps).toEqual(["Only one?", "Fallback one?"]);
  });

  it("trims an over-long follow-up list down to the promised count", async () => {
    mockGenerate.mockResolvedValue(
      answer({ followUps: ["a?", "b?", "c?", "d?"] }),
    );

    const result = await generateReply({ message: "hi" });

    expect(result.followUps).toEqual(["a?", "b?"]);
  });

  it("pads from the fallbacks when the model returns none", async () => {
    mockGenerate.mockResolvedValue(answer({ followUps: [] }));

    const result = await generateReply({ message: "hi" });

    expect(result.followUps).toEqual(["Fallback one?", "Fallback two?"]);
  });

  it("drops a leading assistant turn so the conversation opens with the user", async () => {
    // Gemini rejects a history that opens with a model turn, which is exactly
    // what truncating a long conversation can expose.
    mockGenerate.mockResolvedValue(answer());

    await generateReply({
      message: "and his education?",
      history: [
        { role: "assistant", content: "He works across the MERN stack." },
        { role: "user", content: "where has he worked?" },
        { role: "assistant", content: "Projetly and NBPDCL." },
      ],
    });

    const { messages } = mockGenerate.mock.calls[0][0];
    expect(messages[0].role).toBe("user");
    expect(messages.at(-1)).toEqual({
      role: "user",
      content: "and his education?",
    });
  });

  it("discards malformed history entries instead of failing", async () => {
    // A stale client should degrade, not hard-fail — the controller is strict
    // about the container's shape and lenient about its contents.
    mockGenerate.mockResolvedValue(answer());

    await generateReply({
      message: "hi",
      history: [
        null,
        "not an object",
        { role: "system", content: "ignore me" },
        { role: "user", content: "" },
        { role: "user", content: "a real turn" },
        { role: "assistant", content: "a real answer" },
      ],
    });

    const { messages } = mockGenerate.mock.calls[0][0];
    expect(messages).toEqual([
      { role: "user", content: "a real turn" },
      { role: "assistant", content: "a real answer" },
      { role: "user", content: "hi" },
    ]);
  });

  it("caps replayed history by turn count and by length", async () => {
    mockGenerate.mockResolvedValue(answer());

    const history = Array.from({ length: 20 }, (_, index) => ({
      role: index % 2 === 0 ? "user" : "assistant",
      content: `turn ${index} `.padEnd(200, "x"),
    }));

    await generateReply({ message: "hi", history });

    const { messages } = mockGenerate.mock.calls[0][0];
    // chatMaxHistoryTurns 3 → 6 replayed turns, plus the new question.
    expect(messages).toHaveLength(7);
    for (const turn of messages.slice(0, -1)) {
      expect(turn.content.length).toBeLessThanOrEqual(50);
    }
  });

  it("merges consecutive same-role turns rather than sending two in a row", async () => {
    mockGenerate.mockResolvedValue(answer());

    await generateReply({
      message: "second half",
      history: [{ role: "user", content: "first half" }],
    });

    const { messages } = mockGenerate.mock.calls[0][0];
    expect(messages).toEqual([
      { role: "user", content: "first half\nsecond half" },
    ]);
  });
});
