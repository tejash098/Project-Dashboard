import TechStack from "../models/TechStack.js";

/**
 * Escape a string for safe use inside a RegExp, so a tech name containing
 * metacharacters (e.g. "C++", "Node.js") matches literally during dedupe.
 * @param {string} str - Raw user-supplied string.
 * @returns {string} The escaped string.
 */
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * GET /api/techstacks
 * Fetch the full tech catalog, ordered by category then name so the client can
 * group it directly into the cascading picker.
 * @param {import("express").Request} req - Express request.
 * @param {import("express").Response} res - Express response.
 * @returns {Promise<void>} Responds 200 `{ status, count, data }`, or 500 `{ status, message }`.
 */
export const getAllTechStacks = async (req, res) => {
  try {
    const techstacks = await TechStack.find().sort({ category: 1, name: 1 });
    console.log(`[techstacks] list → ${techstacks.length}`);
    res.status(200).json({
      status: "success",
      count: techstacks.length,
      data: techstacks,
    });
  } catch (error) {
    console.error("[techstacks] list error:", error.message);
    res.status(500).json({ status: "error", message: error.message });
  }
};

/**
 * POST /api/techstacks
 * Add a tech to the catalog. Used by the picker's "add custom" path, which
 * always files new entries under "others". Idempotent on (name, category):
 * an existing match is returned as-is instead of creating a duplicate.
 * @param {import("express").Request} req - Express request; `req.body` holds `{ name, category }`.
 * @param {import("express").Response} res - Express response.
 * @returns {Promise<void>} Responds 201 (created) / 200 (existing) `{ status, data }`, or 400 `{ status, message }`.
 */
export const createTechStack = async (req, res) => {
  try {
    const name = (req.body.name || "").trim();
    const category = req.body.category || "others";

    if (!name) {
      return res
        .status(400)
        .json({ status: "error", message: "Tech name is required" });
    }

    // Dedupe case-insensitively within the category, so "Node.js" added twice
    // (or differing only in case) reuses the existing entry.
    const existing = await TechStack.findOne({
      category,
      name: new RegExp(`^${escapeRegex(name)}$`, "i"),
    });
    if (existing) {
      console.log(`[techstacks] create: "${name}" (${category}) already exists`);
      return res.status(200).json({ status: "success", data: existing });
    }

    const techstack = await TechStack.create({ name, category });
    console.log(`[techstacks] created "${name}" (${category}, id ${techstack.list_id})`);
    res.status(201).json({ status: "success", data: techstack });
  } catch (error) {
    // Validation failures (bad enum category, etc.) land here.
    console.error("[techstacks] create error:", error.message);
    res.status(400).json({ status: "error", message: error.message });
  }
};
