import express from "express";
import { login, me, createAdmin, updateAdmin } from "../controllers/authController.js";
import { auth } from "../middleware/auth.js";
import { createRateLimit } from "../middleware/rateLimit.js";
import config from "../config/env.js";

/**
 * Router for auth endpoints. Mounted under `/api/auth` in app.js, so the login
 * route resolves to `POST /api/auth/login`, the profile route to
 * `GET /api/auth/me`, and admin management to `/api/auth/admins`.
 */
const router = express.Router();

/**
 * Brute-force guard for the login route — 5 attempts per 15 minutes per IP,
 * stacked on top of the global limiter. Every attempt counts, successful or
 * not, which keeps the middleware independent of the controller's outcome.
 * Counts in Redis, falling back to process memory when Redis is unavailable.
 */
const loginLimit = createRateLimit({
  max: config.loginMax,
  windowSeconds: config.loginWindowSeconds,
  prefix: "login-limit",
  fallbackInMemory: true,
});

router.post("/login", loginLimit, login);

// Profile lookup for the logged-in admin — `auth` rejects an absent/expired
// token with 401, which the client uses to auto-logout.
router.get("/me", auth, me);

// Admin management — both guarded by `auth`, so only a logged-in admin can
// create another admin or update an existing one.
router.post("/admins", auth, createAdmin);
router.put("/admins/:id", auth, updateAdmin);

export default router;
