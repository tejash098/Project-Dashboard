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
    imageUrl: {
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
