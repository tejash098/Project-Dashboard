import express from "express";
import {
  getAllProjects,
  getProjectBySlug,
  createProject,
  updateProject,
  deleteProject,
} from "../controllers/projectController.js";
import { auth } from "../middleware/auth.js";

/**
 * Router for project resources. Mounted under `/api/projects` in app.js,
 * so paths here are relative (e.g. `/` => `/api/projects`).
 *
 * Reads are public; writes are gated by the `auth` middleware. Express runs
 * middleware left to right, so `auth` runs before the controller — if it
 * responds 401 the controller never runs.
 */
const router = express.Router();

router.get("/", getAllProjects); // public
router.get("/:slug", getProjectBySlug); // public
router.post("/", auth, createProject); // protected
router.put("/:slug", auth, updateProject); // protected
router.delete("/:slug", auth, deleteProject); // protected

export default router;
