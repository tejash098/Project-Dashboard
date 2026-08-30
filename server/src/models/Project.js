import mongoose from "mongoose";

/**
 * Mongoose schema for a portfolio project.
 * `timestamps: true` auto-manages createdAt and updatedAt.
 * The `slug` is the URL-facing identifier, distinct from MongoDB's _id.
 */
const projectSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
    },
    techStack: {
      type: [String],
      default: [],
    },
    liveUrl: {
      type: String,
      required: false,
      trim: true,
    },
    repoUrl: {
      type: String,
      required: false,
      trim: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    // Cloudinary secure URL of the generated preview screenshot of `liveUrl`.
    // Set by the capture pipeline, not by hand — see utils/captureScreenshot.js.
    imageUrl: {
      type: String,
      required: false,
      trim: true,
    },
    // Cloudinary public_id (e.g. "project-previews/abc123") of that screenshot —
    // kept so the asset can be replaced or deleted later via the upload API.
    imagePublicId: {
      type: String,
      required: false,
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

const Project = mongoose.model("Project", projectSchema);

export default Project;
