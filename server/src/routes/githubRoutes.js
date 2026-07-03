import express from "express";
import { getLanguageStats } from "../controllers/githubController.js";

/**
 * Router for GitHub-derived stats. Mounted under `/api/github` in app.js, so
 * paths here are relative (e.g. `/language-stats` => `/api/github/language-stats`).
 *
 * Everything here is public: the data is already-public GitHub information,
 * and the Dashboard renders it before any login. The Redis cache behind the
 * controller is what protects the server's GitHub API quota.
 */
const router = express.Router();

router.get("/language-stats", getLanguageStats); // public

export default router;
