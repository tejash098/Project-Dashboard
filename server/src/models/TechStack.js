import mongoose from "mongoose";
import { generate16DigitId } from "../utils/generateId.js";

/** Allowed categories a tech can be grouped under in the picker. */
export const TECH_CATEGORIES = [
  "frontend",
  "backend",
  "fullstack",
  "cloud",
  "AI",
  "cybersec",
  "testing",
  "others",
];

/**
 * Mongoose schema for a single entry in the predefined tech-stack catalog.
 * Powers the cascading category → tech picker used when creating/editing a
 * project. `timestamps: true` auto-manages createdAt and updatedAt.
 *
 * `list_id` is a stable, URL-safe public identifier (distinct from MongoDB's
 * _id), generated the same way as Admin.user_id / Feedback.f_id. The `unique`
 * index is the collision safety net for the random generator.
 *
 * `name` is intentionally NOT unique on its own — the same tool may belong to
 * different categories. Duplicate-name protection lives in the controller's
 * create path (case-insensitive, scoped to a category).
 */
const techStackSchema = new mongoose.Schema(
  {
    list_id: {
      type: String,
      required: true,
      unique: true,
      default: generate16DigitId,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: TECH_CATEGORIES,
    },
  },
  {
    timestamps: true,
  },
);

const TechStack = mongoose.model("TechStack", techStackSchema);

export default TechStack;
