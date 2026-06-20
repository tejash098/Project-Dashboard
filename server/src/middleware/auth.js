import jwt from "jsonwebtoken";
import config from "../config/env.js";

/**
 * Express middleware guarding protected routes. Expects an
 * `Authorization: Bearer <token>` header, verifies the JWT, and either passes
 * control to the next handler or short-circuits with a 401.
 *
 * Calling `next()` lets the request continue to the controller; responding
 * instead (without calling `next()`) stops the request here — the core
 * mechanic of middleware.
 *
 * @param {import("express").Request} req - Express request; reads `req.headers.authorization`.
 * @param {import("express").Response} res - Express response.
 * @param {import("express").NextFunction} next - Passes control to the next handler.
 * @returns {void} Responds 401 `{ status: "error", message }` when the token is
 *   missing, malformed, invalid, or expired; otherwise calls `next()`.
 */
export const auth = (req, res, next) => {
  try {
    const header = req.headers.authorization;

    // Reject anything that isn't a well-formed "Bearer <token>" header.
    if (!header || !header.startsWith("Bearer ")) {
      console.warn(`[auth:mw] ${req.method} ${req.originalUrl}: missing/malformed Authorization header`);
      return res
        .status(401)
        .json({ status: "error", message: "No token provided" });
    }

    const token = header.split(" ")[1];
    if (!token) {
      console.warn(`[auth:mw] ${req.method} ${req.originalUrl}: empty token`);
      return res
        .status(401)
        .json({ status: "error", message: "No token provided" });
    }

    // Throws on an invalid signature or an expired token, landing in catch.
    const decoded = jwt.verify(token, config.jwtSecret);
    req.admin = decoded; // make the payload available to downstream handlers
    console.log(`[auth:mw] verified token for admin ${decoded.id} → ${req.method} ${req.originalUrl}`);
    next();
  } catch (error) {
    console.warn(`[auth:mw] token rejected (${error.message}) → ${req.method} ${req.originalUrl}`);
    return res
      .status(401)
      .json({ status: "error", message: "Invalid token" });
  }
};
