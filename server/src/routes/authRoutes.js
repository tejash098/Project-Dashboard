import express from "express";
import { login, me } from "../controllers/authController.js";
import { auth } from "../middleware/auth.js";

/**
 * Router for auth endpoints. Mounted under `/api/auth` in app.js, so the login
 * route resolves to `POST /api/auth/login` and the profile route to
 * `GET /api/auth/me`.
 */
const router = express.Router();

router.post("/login", login);

// Profile lookup for the logged-in admin — `auth` rejects an absent/expired
// token with 401, which the client uses to auto-logout.
router.get("/me", auth, me);

export default router;
