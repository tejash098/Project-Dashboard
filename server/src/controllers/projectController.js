import Project from "../models/Project.js";
import cloudinary from "../config/cloudinary.js";
import config from "../config/env.js";
import { slugify } from "../utils/slugify.js";
import { captureProjectPreview } from "../utils/captureScreenshot.js";

/**
 * Capture a fresh preview screenshot for a project and persist it, removing the
 * screenshot it replaces so Cloudinary doesn't accumulate orphans.
 *
 * Saves the document itself, so callers only need to await this. Rethrows on a
 * capture failure — the automatic callers swallow it, the explicit endpoint
 * reports it.
 *
 * @param {import("mongoose").Document} project - The project to (re)capture; must have a liveUrl.
 * @returns {Promise<void>}
 * @throws {Error} When the capture or upload fails.
 */
const applyPreview = async (project) => {
  const previousPublicId = project.imagePublicId;
  const { secure_url, public_id } = await captureProjectPreview(project.liveUrl);

  project.imageUrl = secure_url;
  project.imagePublicId = public_id;
  await project.save();

  if (previousPublicId) {
    // Best-effort cleanup — the new screenshot is already saved, so a Cloudinary
    // hiccup here must not fail the request.
    try {
      await cloudinary.uploader.destroy(previousPublicId);
      console.log(`[projects] old preview removed (${previousPublicId})`);
    } catch (cloudErr) {
      console.warn(
        `[projects] old preview cleanup failed (${previousPublicId}): ${cloudErr.message}`,
      );
    }
  }
};

/**
 * Derive a slug from a title that doesn't collide with an existing project.
 * Starts from the plain slugified title and appends `-2`, `-3`, … until free.
 * @param {string} title - The project title to base the slug on.
 * @returns {Promise<string>} A slug guaranteed unique at query time.
 */
const generateUniqueSlug = async (title) => {
  const base = slugify(title);
  let slug = base;
  let suffix = 2;
  // Loop until no project owns this slug. The unique index is the final guard
  // against a race, but in practice this single-admin app won't hit one.
  while (await Project.findOne({ slug })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
};

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
    // The create form sends a title but no slug — derive a unique one. An
    // explicit slug (e.g. from a seed/import) is respected as-is for back-compat.
    const payload = { ...req.body };
    if (!payload.slug && payload.title) {
      payload.slug = await generateUniqueSlug(payload.title);
      console.log(`[projects] create: generated slug "${payload.slug}"`);
    }
    const project = await Project.create(payload);
    console.log(`[projects] created "${project.slug}" (id ${project._id})`);

    // Best-effort first screenshot. A screenshot service being down must never
    // block creating a project, so a failure is logged and the 201 still stands
    // — the admin can retry from the detail page's refresh button.
    if (project.liveUrl) {
      try {
        await applyPreview(project);
      } catch (previewErr) {
        console.warn(`[projects] initial preview failed: ${previewErr.message}`);
      }
    }

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
    // Read first so the pre-update liveUrl is known: the preview is only worth
    // recapturing when that specific field changed, so editing a title or a tag
    // doesn't spend a screenshot.
    const existing = await Project.findOne({ slug: req.params.slug });
    if (!existing) {
      console.warn(`[projects] update: slug "${req.params.slug}" not found`);
      return res
        .status(404)
        .json({ status: "error", message: "Project not found" });
    }
    const previousLiveUrl = existing.liveUrl;

    // `new: true` returns the post-update doc; `runValidators` enforces schema rules on update.
    const project = await Project.findOneAndUpdate(
      { slug: req.params.slug },
      req.body,
      { new: true, runValidators: true },
    );
    console.log(`[projects] updated "${project.slug}"`);

    // Best-effort re-capture, for the same reason as create: a screenshot
    // service outage shouldn't turn a successful edit into an error.
    if (project.liveUrl && project.liveUrl !== previousLiveUrl) {
      console.log(`[projects] liveUrl changed on "${project.slug}" — recapturing preview`);
      try {
        await applyPreview(project);
      } catch (previewErr) {
        console.warn(`[projects] preview recapture failed: ${previewErr.message}`);
      }
    }

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
    // The DB record (the primary target) is gone; remove its screenshot too.
    // Treat a Cloudinary failure as non-fatal so the request still reports success.
    if (project.imagePublicId) {
      try {
        const result = await cloudinary.uploader.destroy(project.imagePublicId);
        console.log(`[projects] preview removed (${project.imagePublicId}): ${result?.result}`);
      } catch (cloudErr) {
        console.warn(
          `[projects] preview cleanup failed (${project.imagePublicId}): ${cloudErr.message}`,
        );
      }
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

/**
 * POST /api/projects/:slug/preview  (private)
 * Recapture the project's preview screenshot on demand — used after a redeploy,
 * when the live URL is unchanged but the site behind it isn't.
 *
 * Unlike the automatic captures on create/update, this one was asked for
 * explicitly, so a failure is reported rather than swallowed.
 * @param {import("express").Request} req - Express request; `req.params.slug` identifies the project.
 * @param {import("express").Response} res - Express response.
 * @returns {Promise<void>} Responds 200 `{ status: "success", data }`, 400/404/502 `{ status: "error", message }`.
 */
export const refreshProjectPreview = async (req, res) => {
  try {
    console.log(`[projects] preview refresh requested for "${req.params.slug}"`);
    const project = await Project.findOne({ slug: req.params.slug });
    if (!project) {
      console.warn(`[projects] preview: slug "${req.params.slug}" not found`);
      return res.status(404).json({ status: "error", message: "Project not found" });
    }
    if (!project.liveUrl) {
      console.warn(`[projects] preview: "${req.params.slug}" has no liveUrl`);
      return res.status(400).json({
        status: "error",
        message: "Add a live URL before capturing a preview",
      });
    }

    await applyPreview(project);
    console.log(`[projects] preview refreshed for "${project.slug}"`);
    res.status(200).json({ status: "success", data: project });
  } catch (error) {
    // 502: we're the gateway here — the screenshot service or Cloudinary failed,
    // not the client's request.
    console.error("[projects] preview refresh error:", error.message);
    res.status(502).json({ status: "error", message: error.message });
  }
};
