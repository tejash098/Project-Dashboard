import mongoose from "mongoose";
import { generate16DigitId } from "../utils/generateId.js";

/**
 * Mongoose schema for a contact-form submission ("feedback").
 * `timestamps: true` auto-manages createdAt and updatedAt. Mirrors the data the
 * Contact page sends through EmailJS, plus `imageUrl` — the Cloudinary
 * `secure_url` of an optional uploaded image.
 */
const feedbackSchema = new mongoose.Schema(
  {
    // 16-digit unique identifier, generated automatically on creation.
    f_id: {
      type: String,
      unique: true,
      default: generate16DigitId,
    },
    // Short subject line — captured on the Contact form, shown in the admin Report list.
    title: {
      type: String,
      required: true,
      trim: true,
    },
    // Triage state, managed by admins from the Report page; new feedback is "active".
    status: {
      type: String,
      enum: ["active", "completed", "onhold"],
      default: "active",
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: false,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: false,
      trim: true,
    },
    // Cloudinary public_id (e.g. "feedback/abc123") of the uploaded image —
    // kept so the asset can be replaced or deleted later via the upload API.
    imagePublicId: {
      type: String,
      required: false,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const Feedback = mongoose.model("Feedback", feedbackSchema);

export default Feedback;
