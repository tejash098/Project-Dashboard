import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";

/**
 * Drives the real Express app, with only the LLM layer replaced — so the
 * routing, the rate-limit wiring, the validation and the response envelope are
 * all exercised for real.
 *
 * Deliberately no MongoMemoryServer: chat touches no model, so this suite stays
 * a fast unit-level check rather than paying the mongod startup that
 * projectRoutes.test.js needs.
 */
const { mockGenerate } = vi.hoisted(() => ({ mockGenerate: vi.fn() }));

vi.mock("../services/llm/llmManager.js", () => ({ generateReply: mockGenerate }));

const { default: app } = await import("../app.js");

/** A well-formed answer, so each test states only what it varies. */
const answer = {
  reply: "Tejash works across the MERN stack.",
  followUps: ["Where has he worked?", "What is this dashboard?"],
};

/**
 * Each request gets its own client IP. The chat buckets count in memory when
 * Redis is absent (which it is here), and those counters are module-level — so
 * without a fresh IP the later tests in this file would start seeing 429s.
 * app.js sets `trust proxy`, which is what makes X-Forwarded-For become req.ip.
 */
let ipCounter = 0;
const freshIp = () => `198.51.100.${(ipCounter += 1)}`;

const postChat = (body, ip = freshIp()) =>
  request(app).post("/api/chat").set("X-Forwarded-For", ip).send(body);

describe("POST /api/chat", () => {
  beforeEach(() => {
    mockGenerate.mockReset();
    mockGenerate.mockResolvedValue(answer);
  });

  it("answers with the reply and exactly two follow-ups", async () => {
    const res = await postChat({ message: "What is his tech stack?" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "success", data: answer });
    expect(res.body.data.followUps).toHaveLength(2);
  });

  it("passes the question and history through to the manager", async () => {
    const history = [
      { role: "user", content: "who built this?" },
      { role: "assistant", content: "Tejash did." },
    ];

    await postChat({ message: "  and his stack?  ", history });

    // The message arrives trimmed; the history is forwarded untouched, because
    // sanitizing it is llmManager's job, not the controller's.
    expect(mockGenerate).toHaveBeenCalledWith({
      message: "and his stack?",
      history,
    });
  });

  it("defaults a missing history to an empty list", async () => {
    await postChat({ message: "hi" });

    expect(mockGenerate).toHaveBeenCalledWith({ message: "hi", history: [] });
  });

  it.each([
    ["the body is empty", {}, "A message is required."],
    ["the message is blank", { message: "   " }, "A message is required."],
    ["the message is not a string", { message: 42 }, "A message is required."],
    [
      "the history is not an array",
      { message: "hi", history: "nope" },
      "History must be an array.",
    ],
  ])("rejects with 400 when %s", async (_label, body, message) => {
    const res = await postChat(body);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ status: "error", message });
    // The guard is worthless if the request still reaches a paid API call.
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it("rejects an over-long message before spending a call", async () => {
    const res = await postChat({ message: "x".repeat(501) });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/too long \(max 500 characters\)/);
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it.each([["all-failed"], ["no-keys"]])(
    "returns 503 with one generic message for %s",
    async (code) => {
      // "No key is configured" is operational detail about our deployment. Both
      // causes must look identical from outside.
      mockGenerate.mockRejectedValue(
        Object.assign(new Error("internal detail"), { code }),
      );

      const res = await postChat({ message: "hi" });

      expect(res.status).toBe(503);
      expect(res.body).toEqual({
        status: "error",
        message:
          "The assistant is unavailable right now. Please try again in a moment.",
      });
      expect(res.text).not.toContain("internal detail");
    },
  );

  it("returns 400 without echoing the upstream wording on request-invalid", async () => {
    mockGenerate.mockRejectedValue(
      Object.assign(new Error("Invalid JSON payload at contents[0]"), {
        code: "request-invalid",
      }),
    );

    const res = await postChat({ message: "hi" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(
      "That question could not be processed. Please rephrase it.",
    );
    expect(res.text).not.toContain("contents[0]");
  });

  it("returns 500 on an unexpected failure", async () => {
    mockGenerate.mockRejectedValue(new Error("something else broke"));

    const res = await postChat({ message: "hi" });

    expect(res.status).toBe(500);
    expect(res.body.status).toBe("error");
  });

  it("enforces the burst budget from a single IP", async () => {
    // Proves the limiters are actually mounted on this route — the budget is
    // 5/60s, tighter than the global 15/60s.
    const ip = freshIp();
    for (let i = 0; i < 5; i += 1) {
      const ok = await postChat({ message: "hi" }, ip);
      expect(ok.status).toBe(200);
    }

    const res = await postChat({ message: "hi" }, ip);

    expect(res.status).toBe(429);
    expect(res.headers["retry-after"]).toBe("60");
    expect(res.body.status).toBe("error");
    expect(mockGenerate).toHaveBeenCalledTimes(5);
  });
});

describe("GET /api/chatbot-context.md", () => {
  it("serves the reference document the prompt cites", async () => {
    // The prompt tells the model this URL is where its reference lives, so a
    // 404 here would make that citation a lie.
    const res = await request(app).get("/api/chatbot-context.md");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/markdown/);
    expect(res.text).toContain("# Project Dashboard — Assistant Reference");
    expect(res.text).toContain("Questions This Assistant Can Answer");
  });
});
