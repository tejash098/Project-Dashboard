import { describe, it, expect, vi } from "vitest";
import request from "supertest";

/**
 * Proves the route-scoped limiters are actually mounted on the login and
 * feedback-submit routes, and that the global limiter covers plain routes even
 * without Redis.
 *
 * Drives the real Express app with the two controllers replaced by stubs: what
 * is under test is the middleware wiring, not what the handlers do — so no
 * MongoMemoryServer, and the suite stays fast. Redis is absent here, which
 * means every bucket counts through its in-memory fallback.
 */
vi.mock("../controllers/authController.js", () => {
  const ok = (req, res) => res.status(200).json({ status: "success" });
  return { login: ok, me: ok, createAdmin: ok, updateAdmin: ok };
});

vi.mock("../controllers/feedbackController.js", () => {
  const ok = (req, res) => res.status(200).json({ status: "success" });
  return {
    createFeedback: ok,
    getAllFeedback: ok,
    getFeedbackByFId: ok,
    updateFeedback: ok,
    deleteFeedback: ok,
  };
});

const { default: app } = await import("../app.js");
const { default: config } = await import("../config/env.js");

/**
 * One client IP per test. The counters are module-level, so sharing an IP would
 * let one test's requests spend another's budget. app.js sets `trust proxy`,
 * which is what makes X-Forwarded-For become req.ip.
 */
let ipCounter = 0;
const freshIp = () => `203.0.113.${(ipCounter += 1)}`;

describe("POST /api/auth/login", () => {
  it("allows 5 attempts per IP, then answers 429 for 15 minutes", async () => {
    const ip = freshIp();
    const attempt = () =>
      request(app)
        .post("/api/auth/login")
        .set("X-Forwarded-For", ip)
        .send({ username: "admin", password: "guess" });

    for (let i = 0; i < 5; i += 1) {
      expect((await attempt()).status).toBe(200);
    }

    const res = await attempt();

    expect(res.status).toBe(429);
    expect(res.headers["retry-after"]).toBe("900");
    expect(res.body).toEqual({
      status: "error",
      message: "Rate limit exceeded. Try again in 15 minutes.",
    });
  });

  it("does not spend another IP's login budget", async () => {
    const first = freshIp();
    for (let i = 0; i < 6; i += 1) {
      await request(app).post("/api/auth/login").set("X-Forwarded-For", first).send({});
    }

    const res = await request(app)
      .post("/api/auth/login")
      .set("X-Forwarded-For", freshIp())
      .send({});

    expect(res.status).toBe(200);
  });
});

describe("POST /api/feedback", () => {
  it("allows 5 submissions per IP, then answers 429 for an hour", async () => {
    const ip = freshIp();
    const submit = () =>
      request(app)
        .post("/api/feedback")
        .set("X-Forwarded-For", ip)
        .send({ name: "Visitor", message: "hello" });

    for (let i = 0; i < 5; i += 1) {
      expect((await submit()).status).toBe(200);
    }

    const res = await submit();

    expect(res.status).toBe(429);
    expect(res.headers["retry-after"]).toBe("3600");
    expect(res.body.message).toBe("Rate limit exceeded. Try again in an hour.");
  });
});

describe("the global limiter without Redis", () => {
  it("still caps a plain route at the global budget", async () => {
    // /api/status carries no route-scoped bucket, so a 429 here can only come
    // from the global limiter counting in memory. The budget is read from
    // config rather than hard-coded as 15/60s: a developer's local .env may
    // override RATE_LIMIT_MAX / RATE_LIMIT_WINDOW, and env.js loads that file.
    const ip = freshIp();
    const ping = () => request(app).get("/api/status").set("X-Forwarded-For", ip);

    for (let i = 0; i < config.rateLimitMax; i += 1) {
      expect((await ping()).status).toBe(200);
    }

    const res = await ping();

    expect(res.status).toBe(429);
    expect(res.headers["retry-after"]).toBe(String(config.rateLimitWindowSeconds));
  });
});
