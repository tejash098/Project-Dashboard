import Project from "../models/Project.js";
import config from "../config/env.js";

/**
 * GET /api/projects
 * Fetch all projects. Supports `?status=` filtering, `?limit=` capping, and
 * `?sort=` ordering by one of: creation_time, -creation_time, updation_time,
 * -updation_time (default: -creation_time, i.e. newest first).
 * @param {import("express").Request} req - Express request; `req.query` may carry status/limit/sort.
 * @param {import("express").Response} res - Express response.
 * @returns {Promise<void>} Responds 200 `{ status: "success", data }`, or 500 `{ status: "error", message }`.
 */
export const getAllProjects = async (req, res) => {
  try {
    // Build a filter from the optional status query param; empty filter returns all.
    const filter = req.query.status ? { status: req.query.status } : {};
    const limit = parseInt(req.query.limit) || config.defaultProjectLimit; // Optional limit query param, default from config

    // Map the `?sort=` query param to a Mongoose sort spec.
    // A leading `-` means descending; default is newest first (-creation_time).
    const sortMap = {
      creation_time: { createdAt: 1 },
      "-creation_time": { createdAt: -1 },
      updation_time: { updatedAt: 1 },
      "-updation_time": { updatedAt: -1 },
    };
    const sort = sortMap[req.query.sort] || sortMap["-creation_time"];

    // `total` counts all docs matching the filter (ignores limit); `count` is
    // the number actually returned in this response. Run both in parallel.
    const [projects, total] = await Promise.all([
      Project.find(filter).sort(sort).limit(limit),
      Project.countDocuments(filter),
    ]);
    const count = projects.length;
    console.log(
      `[projects] list: filter=${JSON.stringify(filter)} sort=${JSON.stringify(sort)} → ${count}/${total}`,
    );
    res.status(200).json({ status: "success", total, count, data: projects });
  } catch (error) {
    console.error("[projects] list error:", error.message);
    res.status(500).json({ status: "error", message: error.message });
  }
};

/**
 * GET /api/projects/:slug
 * Fetch a single project by its URL slug.
 * @param {import("express").Request} req - Express request; `req.params.slug` identifies the project.
 * @param {import("express").Response} res - Express response.
 * @returns {Promise<void>} Responds 200 `{ status: "success", data }`, 404/500 `{ status: "error", message }`.
 */
export const getProjectBySlug = async (req, res) => {
  try {
    console.log(`[projects] get by slug "${req.params.slug}"`);
    const project = await Project.findOne({ slug: req.params.slug });
    if (!project) {
      console.warn(`[projects] slug "${req.params.slug}" not found`);
      return res
        .status(404)
        .json({ status: "error", message: "Project not found" });
    }
    res.status(200).json({ status: "success", data: project });
  } catch (error) {
    console.error("[projects] get error:", error.message);
    res.status(500).json({ status: "error", message: error.message });
  }
};

/**
 * POST /api/projects
 * Create a new project from the request body.
 * @param {import("express").Request} req - Express request; `req.body` holds the project fields.
 * @param {import("express").Response} res - Express response.
 * @returns {Promise<void>} Responds 201 `{ status: "success", data }`, or 400 `{ status: "error", message }`.
 */
export const createProject = async (req, res) => {
  try {
    console.log(`[projects] create: fields=[${Object.keys(req.body).join(", ")}]`);
    const project = await Project.create(req.body);
    console.log(`[projects] created "${project.slug}" (id ${project._id})`);
    res.status(201).json({ status: "success", data: project });
  } catch (error) {
    // Validation failures (missing required fields, bad enum) land here.
    console.error("[projects] create error:", error.message);
    res.status(400).json({ status: "error", message: error.message });
  }
};

/**
 * PUT /api/projects/:slug
 * Update an existing project by slug, returning the updated document.
 * @param {import("express").Request} req - Express request; `req.params.slug` + `req.body` drive the update.
 * @param {import("express").Response} res - Express response.
 * @returns {Promise<void>} Responds 200 `{ status: "success", data }`, 404/400 `{ status: "error", message }`.
 */
export const updateProject = async (req, res) => {
  try {
    // Trace which fields are being changed (project bodies carry no secrets).
    console.log(
      `[projects] update "${req.params.slug}": fields=[${Object.keys(req.body).join(", ")}]`,
    );
    // `new: true` returns the post-update doc; `runValidators` enforces schema rules on update.
    const project = await Project.findOneAndUpdate(
      { slug: req.params.slug },
      req.body,
      { new: true, runValidators: true },
    );
    if (!project) {
      console.warn(`[projects] update: slug "${req.params.slug}" not found`);
      return res
        .status(404)
        .json({ status: "error", message: "Project not found" });
    }
    console.log(`[projects] updated "${project.slug}"`);
    res.status(200).json({ status: "success", data: project });
  } catch (error) {
    console.error("[projects] update error:", error.message);
    res.status(400).json({ status: "error", message: error.message });
  }
};

/**
 * DELETE /api/projects/:slug
 * Delete a project by slug.
 * @param {import("express").Request} req - Express request; `req.params.slug` identifies the project.
 * @param {import("express").Response} res - Express response.
 * @returns {Promise<void>} Responds 200 `{ status: "success", message }`, 404/500 `{ status: "error", message }`.
 */
export const deleteProject = async (req, res) => {
  try {
    console.log(`[projects] delete "${req.params.slug}"`);
    const project = await Project.findOneAndDelete({ slug: req.params.slug });
    if (!project) {
      console.warn(`[projects] delete: slug "${req.params.slug}" not found`);
      return res
        .status(404)
        .json({ status: "error", message: "Project not found" });
    }
    console.log(`[projects] deleted "${req.params.slug}"`);
    res
      .status(200)
      .json({ status: "success", message: "Project deleted successfully" });
  } catch (error) {
    console.error("[projects] delete error:", error.message);
    res.status(500).json({ status: "error", message: error.message });
  }
};
