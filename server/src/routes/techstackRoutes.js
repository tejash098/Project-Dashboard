import express from "express";
import {
  getAllTechStacks,
  createTechStack,
} from "../controllers/techstackController.js";
import { auth } from "../middleware/auth.js";

/**
 * Router for tech-stack catalog resources. Mounted under `/api/techstacks` in
 * app.js, so paths here are relative (e.g. `/` => `/api/techstacks`).
 *
 * The list is public (anyone can browse the picker), but adding a tech is gated
 * by the `auth` middleware so only logged-in admins can grow the catalog.
 */
const router = express.Router();

router.get("/", getAllTechStacks); // public
router.post("/", auth, createTechStack); // protected

export default router;
