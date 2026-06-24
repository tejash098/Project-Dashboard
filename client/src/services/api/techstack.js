import api from "./client";

/**
 * @typedef {Object} TechStack
 * @property {string} _id      - MongoDB document id.
 * @property {string} list_id  - Stable public identifier.
 * @property {string} name     - Display name of the technology.
 * @property {string} category - One of frontend/backend/fullstack/cloud/AI/cybersec/testing/others.
 * @property {string} createdAt - ISO timestamp, set by Mongoose.
 * @property {string} updatedAt - ISO timestamp, set by Mongoose.
 */

/**
 * Fetch the full tech-stack catalog (sorted by category then name).
 * @returns {Promise<TechStack[]>} Every catalog entry.
 * @throws {Error} On network failure or a non-2xx response.
 */
export const fetchTechStacks = async () => {
  const res = await api.get("/techstacks");
  return res.data.data;
};

/**
 * Add a tech to the catalog. Used by the picker's "add custom" path, which
 * files new entries under "others". The endpoint is idempotent on (name,
 * category), so re-adding an existing tech simply returns it.
 * @param {{ name: string, category?: string }} input - New tech; category defaults to "others".
 * @returns {Promise<TechStack>} The created (or pre-existing) catalog entry.
 * @throws {Error} On validation failure (400) or other non-2xx response.
 */
export const createTechStack = async ({ name, category = "others" }) => {
  const res = await api.post("/techstacks", { name, category });
  return res.data.data;
};
