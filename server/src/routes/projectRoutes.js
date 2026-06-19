import express from "express";
import {
  getAllProjects,
  getProjectBySlug,
  createProject,
  updateProject,
  deleteProject,
} from "../controllers/projectController.js";

/**
 * Router for project resources. Mounted under `/api/projects` in app.js,
 * so paths here are relative (e.g. `/` => `/api/projects`).
 */
const router = express.Router();

router.get("/", getAllProjects);
router.get("/:slug", getProjectBySlug);
router.post("/", createProject);
router.put("/:slug", updateProject);
router.delete("/:slug", deleteProject);

export default router;
