import express from "express";
import multer from "multer";
import {
  createFeedback,
  getAllFeedback,
  getFeedbackByFId,
  updateFeedback,
  deleteFeedback,
} from "../controllers/feedbackController.js";
import { auth } from "../middleware/auth.js";

/**
 * Router for feedback (contact-form) resources. Mounted under `/api/feedback`
 * in app.js, so paths here are relative (e.g. `/` => `/api/feedback`).
 *
 * Submitting (POST) is public so any visitor can send a message; reading and
 * mutating (GET/PUT/DELETE) are gated by the `auth` middleware (admin only).
 */
const router = express.Router();

/**
 * In-memory upload for the optional `image` field. The buffer is forwarded to
 * Cloudinary in the controller, so nothing touches disk. Capped at 5 MB to
 * keep oversized uploads from reaching Cloudinary.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post("/", upload.single("image"), createFeedback); // public
router.get("/", auth, getAllFeedback); // protected
router.get("/:id", auth, getFeedbackByFId); // protected — `:id` is the f_id
// `:id` carries the feedback's f_id (not the Mongo _id); see the controller.
// multer runs after auth so an unauthorized request never parses an upload.
router.put("/:id", auth, upload.single("image"), updateFeedback); // protected
router.delete("/:id", auth, deleteFeedback); // protected

export default router;
