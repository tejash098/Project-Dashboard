import express from "express";
import config from "../config/env.js";
import { postChat } from "../controllers/chatController.js";
import { createRateLimit } from "../middleware/rateLimit.js";

/**
 * Router for the portfolio assistant. Mounted under `/api/chat` in app.js, so
 * the single route here is `POST /api/chat`.
 *
 * Public, but budgeted far more tightly than the rest of the API: every request
 * costs a real LLM call, and there is no login to attribute abuse to. Two
 * buckets guard it — a short burst window for rapid-fire clicking, and an
 * hourly ceiling for sustained use.
 *
 * These stack on top of the global limiter in app.js, so a chat request spends
 * one global token and one of each chat token. `chatBurstMax` must therefore
 * stay at or below `rateLimitMax`, or the global bucket binds first and these
 * never take effect.
 *
 * Both opt into the in-memory fallback. The global limiter degrades open when
 * Redis is unavailable, which is right for page loads and wrong here: an
 * unmetered chat endpoint spends money for as long as Redis stays down.
 */
const router = express.Router();

/** Short window — stops rapid-fire submissions from one visitor. */
const chatBurst = createRateLimit({
  max: config.chatBurstMax,
  windowSeconds: config.chatBurstWindowSeconds,
  prefix: "chat-limit",
  fallbackInMemory: true,
});

/** Sustained ceiling — caps what a single IP can spend in an hour. */
const chatHourly = createRateLimit({
  max: config.chatHourlyMax,
  windowSeconds: config.chatHourlyWindowSeconds,
  prefix: "chat-limit-h",
  fallbackInMemory: true,
});

router.post("/", chatBurst, chatHourly, postChat); // public

export default router;
