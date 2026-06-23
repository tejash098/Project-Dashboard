import Feedback from "../models/Feedback.js";
import cloudinary from "../config/cloudinary.js";

/** Fields a client is allowed to set/change on a feedback document. */
const EDITABLE_FIELDS = ["title", "name", "email", "phone", "message", "status"];

/**
 * Map a `?sort=` query value to a Mongoose sort spec. A leading `-` means
 * descending; default is newest-created first. Mirrors the project controller.
 */
const SORT_MAP = {
  creation_time: { createdAt: 1 },
  "-creation_time": { createdAt: -1 },
  updation_time: { updatedAt: 1 },
  "-updation_time": { updatedAt: -1 },
};

/**
 * Upload a multer in-memory file to Cloudinary's `feedback` folder. Streams the
 * buffer as a base64 data URI so nothing touches disk.
 * @param {Express.Multer.File} file - The parsed upload (from `req.file`).
 * @returns {Promise<{ secure_url: string, public_id: string }>} The hosted URL and its public_id.
 */
const uploadFeedbackImage = async (file) => {
  const dataUri = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
  const { secure_url, public_id } = await cloudinary.uploader.upload(dataUri, {
    folder: "feedback",
  });
  return { secure_url, public_id };
};

/**
 * POST /api/feedback  (public)
 * Persist a contact-form submission. When an image is attached (multipart field
 * `image`, parsed by multer into `req.file`), it is uploaded to Cloudinary first
 * and its `secure_url` + `public_id` are stored alongside the text fields.
 * @param {import("express").Request} req - Express request; `req.body` holds the text fields, `req.file` the optional image.
 * @param {import("express").Response} res - Express response.
 * @returns {Promise<void>} Responds 201 `{ status: "success", data }`, or 400 `{ status: "error", message }`.
 */
export const createFeedback = async (req, res) => {
  try {
    console.log(`[feedback] create: fields=[${Object.keys(req.body).join(", ")}] image=${req.file ? "yes" : "no"}`);

    // Only runs when an image was attached; we keep the public_id for later
    // replace/delete via the Cloudinary upload API.
    let imageUrl, imagePublicId;
    if (req.file) {
      ({ secure_url: imageUrl, public_id: imagePublicId } = await uploadFeedbackImage(req.file));
      console.log(`[feedback] image uploaded → ${imageUrl}`);
    }

    const feedback = await Feedback.create({ ...req.body, imageUrl, imagePublicId });
    console.log(`[feedback] created (f_id ${feedback.f_id})`);
    res.status(201).json({ status: "success", data: feedback });
  } catch (error) {
    // Validation failures (missing required fields) and upload errors land here.
    console.error("[feedback] create error:", error.message);
    res.status(400).json({ status: "error", message: error.message });
  }
};

/**
 * GET /api/feedback  (private)
 * List feedback submissions with optional `?status=` filtering, `?sort=` ordering
 * (creation_time, -creation_time, updation_time, -updation_time; default newest
 * first), and `?page=`/`?limit=` pagination (limit default 15).
 * @param {import("express").Request} req - Express request; `req.query` may carry status/sort/page/limit.
 * @param {import("express").Response} res - Express response.
 * @returns {Promise<void>} Responds 200 `{ status, total, count, page, limit, data }`, or 500 `{ status: "error", message }`.
 */
export const getAllFeedback = async (req, res) => {
  try {
    // Optional status filter; empty filter returns everything.
    const filter = req.query.status ? { status: req.query.status } : {};
    const sort = SORT_MAP[req.query.sort] || SORT_MAP["-creation_time"];
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    // `total` ignores pagination (drives "load more"); `count` is this page's size.
    const [data, total] = await Promise.all([
      Feedback.find(filter).sort(sort).skip(skip).limit(limit),
      Feedback.countDocuments(filter),
    ]);
    console.log(
      `[feedback] list: filter=${JSON.stringify(filter)} sort=${JSON.stringify(sort)} page=${page} → ${data.length}/${total}`,
    );
    res.status(200).json({ status: "success", total, count: data.length, page, limit, data });
  } catch (error) {
    console.error("[feedback] list error:", error.message);
    res.status(500).json({ status: "error", message: error.message });
  }
};

/**
 * GET /api/feedback/:id  (private)
 * Fetch a single feedback document by its `f_id` (the route `:id` carries the
 * f_id, not the Mongo _id).
 * @param {import("express").Request} req - Express request; `req.params.id` is the f_id.
 * @param {import("express").Response} res - Express response.
 * @returns {Promise<void>} Responds 200 `{ status: "success", data }`, 404/500 `{ status: "error", message }`.
 */
export const getFeedbackByFId = async (req, res) => {
  try {
    console.log(`[feedback] get by f_id "${req.params.id}"`);
    const feedback = await Feedback.findOne({ f_id: req.params.id });
    if (!feedback) {
      console.warn(`[feedback] f_id "${req.params.id}" not found`);
      return res.status(404).json({ status: "error", message: "Feedback not found" });
    }
    res.status(200).json({ status: "success", data: feedback });
  } catch (error) {
    console.error("[feedback] get error:", error.message);
    res.status(500).json({ status: "error", message: error.message });
  }
};

/**
 * PUT /api/feedback/:id  (private)
 * Update a feedback document, located by its `f_id` (the route `:id` carries the
 * f_id, not the Mongo _id). Editable text fields are whitelisted. When a new
 * image is attached, it is uploaded to Cloudinary and replaces the old one (the
 * previous asset is removed to avoid orphans).
 * @param {import("express").Request} req - Express request; `req.params.id` is the f_id, `req.body`/`req.file` carry changes.
 * @param {import("express").Response} res - Express response.
 * @returns {Promise<void>} Responds 200 `{ status: "success", data }`, 404/400 `{ status: "error", message }`.
 */
export const updateFeedback = async (req, res) => {
  try {
    console.log(`[feedback] update f_id "${req.params.id}": fields=[${Object.keys(req.body).join(", ")}] image=${req.file ? "yes" : "no"}`);

    const feedback = await Feedback.findOne({ f_id: req.params.id });
    if (!feedback) {
      console.warn(`[feedback] update: f_id "${req.params.id}" not found`);
      return res.status(404).json({ status: "error", message: "Feedback not found" });
    }

    // Replace the image: upload the new one, then delete the old asset (if any).
    if (req.file) {
      const previousPublicId = feedback.imagePublicId;
      const { secure_url, public_id } = await uploadFeedbackImage(req.file);
      feedback.imageUrl = secure_url;
      feedback.imagePublicId = public_id;
      console.log(`[feedback] image replaced → ${secure_url}`);
      if (previousPublicId) {
        // Best-effort cleanup — a Cloudinary hiccup shouldn't fail the update.
        try {
          await cloudinary.uploader.destroy(previousPublicId);
          console.log(`[feedback] old image removed (${previousPublicId})`);
        } catch (cloudErr) {
          console.warn(`[feedback] old image cleanup failed (${previousPublicId}): ${cloudErr.message}`);
        }
      }
    }

    // Apply only whitelisted text fields that were actually provided, so the
    // body can never overwrite f_id / imageUrl / imagePublicId.
    for (const field of EDITABLE_FIELDS) {
      if (req.body[field] !== undefined) feedback[field] = req.body[field];
    }

    await feedback.save(); // validates the modified paths
    console.log(`[feedback] updated f_id "${req.params.id}"`);
    res.status(200).json({ status: "success", data: feedback });
  } catch (error) {
    console.error("[feedback] update error:", error.message);
    res.status(400).json({ status: "error", message: error.message });
  }
};

/**
 * DELETE /api/feedback/:id  (private)
 * Delete a feedback document, located by its `f_id` (the route `:id` carries the
 * f_id, not the Mongo _id). Also removes the associated Cloudinary image, if any.
 * @param {import("express").Request} req - Express request; `req.params.id` is the f_id.
 * @param {import("express").Response} res - Express response.
 * @returns {Promise<void>} Responds 200 `{ status: "success", message }`, 404/500 `{ status: "error", message }`.
 */
export const deleteFeedback = async (req, res) => {
  try {
    console.log(`[feedback] delete f_id "${req.params.id}"`);
    const feedback = await Feedback.findOneAndDelete({ f_id: req.params.id });
    if (!feedback) {
      console.warn(`[feedback] delete: f_id "${req.params.id}" not found`);
      return res.status(404).json({ status: "error", message: "Feedback not found" });
    }

    // The DB record (the primary target) is gone; remove its image too. Treat a
    // Cloudinary failure as non-fatal so the request still reports success.
    if (feedback.imagePublicId) {
      try {
        const result = await cloudinary.uploader.destroy(feedback.imagePublicId);
        console.log(`[feedback] image removed (${feedback.imagePublicId}): ${result?.result}`);
      } catch (cloudErr) {
        console.warn(`[feedback] image cleanup failed (${feedback.imagePublicId}): ${cloudErr.message}`);
      }
    }

    console.log(`[feedback] deleted f_id "${req.params.id}"`);
    res.status(200).json({ status: "success", message: "Feedback deleted successfully" });
  } catch (error) {
    console.error("[feedback] delete error:", error.message);
    res.status(500).json({ status: "error", message: error.message });
  }
};
