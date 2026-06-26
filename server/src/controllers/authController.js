import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import config from "../config/env.js";

/**
 * POST /api/auth/login
 * Authenticate an admin by username + password and issue a signed JWT.
 * @param {import("express").Request} req - Express request; `req.body` carries `{ username, password }`.
 * @param {import("express").Response} res - Express response.
 * @returns {Promise<void>} Responds 200 `{ status: "success", token }`,
 *   400/401 `{ status: "error", message }` on bad input/credentials, or 500 on failure.
 */
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    // Trace the username only — never the password.
    console.log(`[auth] login attempt for "${username}"`);

    // Both fields are required to attempt a login.
    if (!username || !password) {
      console.warn("[auth] login rejected: missing username or password");
      return res
        .status(400)
        .json({ status: "error", message: "Username and password are required" });
    }

    const admin = await Admin.findOne({ username: username.toLowerCase() });

    // Use one generic 401 for both an unknown username and a wrong password, so
    // the response never reveals which usernames exist.
    if (!admin || !(await admin.comparePassword(password))) {
      console.warn(`[auth] login failed for "${username}" (bad credentials)`);
      return res
        .status(401)
        .json({ status: "error", message: "Invalid username or password" });
    }

    // Minimal payload — id + role only, never secrets. Verified by the auth
    // middleware on protected routes.
    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      config.jwtSecret,
      { expiresIn: config.tokenTtl },
    );

    // Return the admin profile alongside the token so the client can render the
    // profile menu without an extra round-trip. The model's toJSON transform
    // strips the password hash, so this is safe to send.
    console.log(`[auth] login success for "${admin.username}" (id ${admin._id}); token issued`);
    res.status(200).json({ status: "success", token, admin });
  } catch (error) {
    console.error("[auth] login error:", error.message);
    res.status(500).json({ status: "error", message: error.message });
  }
};

/**
 * GET /api/auth/me
 * Return the authenticated admin's profile. Protected by the `auth` middleware,
 * which verifies the JWT and sets `req.admin = { id, role }`.
 * @param {import("express").Request} req - Express request; `req.admin.id` is the admin's id.
 * @param {import("express").Response} res - Express response.
 * @returns {Promise<void>} Responds 200 `{ status: "success", admin }`,
 *   404 when the admin no longer exists, or 500 on failure.
 */
export const me = async (req, res) => {
  try {
    console.log(`[auth] /me lookup for id ${req.admin?.id}`);
    const admin = await Admin.findById(req.admin.id);

    // Token was valid but the referenced admin is gone (e.g. deleted).
    if (!admin) {
      console.warn(`[auth] /me: admin ${req.admin?.id} not found`);
      return res
        .status(404)
        .json({ status: "error", message: "Admin not found" });
    }

    res.status(200).json({ status: "success", admin });
  } catch (error) {
    console.error("[auth] /me error:", error.message);
    res.status(500).json({ status: "error", message: error.message });
  }
};

/**
 * POST /api/auth/admins
 * Create a new admin. Protected by the `auth` middleware, so only an already
 * authenticated admin can create another. The model's pre-save hook hashes the
 * password and its toJSON transform strips the hash from the response.
 * @param {import("express").Request} req - Express request; `req.body` carries `{ username, password, email?, firstName?, lastName? }`.
 * @param {import("express").Response} res - Express response.
 * @returns {Promise<void>} Responds 201 `{ status: "success", admin }`, or
 *   400 `{ status: "error", message }` on validation/duplicate failure.
 */
export const createAdmin = async (req, res) => {
  try {
    const { username, password, email, firstName, lastName } = req.body;
    console.log(`[auth] create admin "${username}" by admin ${req.admin?.id}`);

    // Username + password are the minimum needed to log in afterwards.
    if (!username || !password) {
      return res
        .status(400)
        .json({ status: "error", message: "Username and password are required" });
    }

    // Only allow the safe profile fields — `role` is intentionally not taken
    // from the body so it defaults to "admin" and can't be escalated.
    const admin = await Admin.create({ username, password, email, firstName, lastName });
    console.log(`[auth] admin created "${admin.username}" (id ${admin._id})`);
    res.status(201).json({ status: "success", admin });
  } catch (error) {
    // Mongo duplicate-key (unique username) surfaces as code 11000.
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ status: "error", message: "Username already exists" });
    }
    console.error("[auth] create admin error:", error.message);
    res.status(400).json({ status: "error", message: error.message });
  }
};

/**
 * PUT /api/auth/admins/:id
 * Update an admin by id. Protected — only an authenticated admin may call it
 * (used by the profile popover to edit the logged-in admin). Applies only the
 * provided fields; a blank/omitted password leaves the current hash untouched.
 * Uses `.save()` (not `findByIdAndUpdate`) so the pre-save hook re-hashes a
 * changed password.
 * @param {import("express").Request} req - Express request; `req.params.id` + `req.body` drive the update.
 * @param {import("express").Response} res - Express response.
 * @returns {Promise<void>} Responds 200 `{ status: "success", admin }`,
 *   404 when the admin is gone, or 400 on validation/duplicate failure.
 */
export const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, firstName, lastName, password } = req.body;
    console.log(
      `[auth] update admin ${id} by admin ${req.admin?.id}: fields=[${Object.keys(req.body).join(", ")}]`,
    );

    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({ status: "error", message: "Admin not found" });
    }

    // Patch only the fields that were sent; an empty password means "unchanged".
    if (username !== undefined) admin.username = username;
    if (email !== undefined) admin.email = email;
    if (firstName !== undefined) admin.firstName = firstName;
    if (lastName !== undefined) admin.lastName = lastName;
    if (password) admin.password = password; // re-hashed by the pre-save hook

    await admin.save();
    console.log(`[auth] admin ${id} updated`);
    res.status(200).json({ status: "success", admin });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ status: "error", message: "Username already exists" });
    }
    console.error("[auth] update admin error:", error.message);
    res.status(400).json({ status: "error", message: error.message });
  }
};
