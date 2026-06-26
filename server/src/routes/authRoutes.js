import express from "express";
import { login, me, createAdmin, updateAdmin } from "../controllers/authController.js";
import { auth } from "../middleware/auth.js";

/**
 * Router for auth endpoints. Mounted under `/api/auth` in app.js, so the login
 * route resolves to `POST /api/auth/login`, the profile route to
 * `GET /api/auth/me`, and admin management to `/api/auth/admins`.
 */
const router = express.Router();

router.post("/login", login);

// Profile lookup for the logged-in admin — `auth` rejects an absent/expired
// token with 401, which the client uses to auto-logout.
router.get("/me", auth, me);

// Admin management — both guarded by `auth`, so only a logged-in admin can
// create another admin or update an existing one.
router.post("/admins", auth, createAdmin);
router.put("/admins/:id", auth, updateAdmin);

export default router;
