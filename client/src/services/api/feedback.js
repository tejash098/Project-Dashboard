import api from "./client";

/**
 * @typedef {Object} Feedback
 * @property {string} _id        - MongoDB document id.
 * @property {string} name       - Sender's name.
 * @property {string} email      - Sender's email.
 * @property {string} [phone]    - Sender's phone, if provided.
 * @property {string} message    - The message body.
 * @property {string} [imageUrl] - Cloudinary URL of the uploaded image, if any.
 * @property {string} createdAt  - ISO timestamp, set by Mongoose.
 * @property {string} updatedAt  - ISO timestamp, set by Mongoose.
 */

/**
 * Submit a contact-form feedback (public — no auth required). Pass a `FormData`
 * built from the form fields plus an optional `image` file; axios sets the
 * multipart `Content-Type` (with boundary) automatically for a FormData body.
 * The server uploads the image to Cloudinary and returns the stored document.
 * @param {FormData} formData - Fields: name, email, phone, message, image (optional).
 * @returns {Promise<Feedback>} The created feedback document (includes `imageUrl`).
 * @throws {Error} On validation failure (400) or other non-2xx response.
 */
export const postFeedback = async (formData) => {
  const res = await api.post("/feedback", formData);
  return res.data.data;
};

/**
 * Fetch every feedback submission (private — admin auth required).
 * NOTE: defined for completeness; not yet wired into the UI.
 * @returns {Promise<Feedback[]>} All feedback, newest first.
 * @throws {Error} On a 401 (no/invalid token) or other non-2xx response.
 */
export const getFeedback = async () => {
  const res = await api.get("/feedback");
  return res.data.data;
};

/**
 * Update a feedback submission by its f_id (private — admin auth required).
 * NOTE: defined for completeness; not yet wired into the UI.
 * @param {string} id - The feedback's `f_id` (16-digit business id, not the Mongo _id).
 * @param {Partial<Feedback>|FormData} data - Fields to change. Pass a `FormData`
 *   with an `image` file to replace the uploaded image; otherwise a plain object.
 * @returns {Promise<Feedback>} The updated feedback document.
 * @throws {Error} On a 401/404, validation failure (400), or other non-2xx response.
 */
export const updateFeedback = async (id, data) => {
  const res = await api.put(`/feedback/${id}`, data);
  return res.data.data;
};

/**
 * Delete a feedback submission by its f_id (private — admin auth required).
 * Also removes the associated Cloudinary image on the server.
 * NOTE: defined for completeness; not yet wired into the UI.
 * @param {string} id - The feedback's `f_id` (16-digit business id, not the Mongo _id).
 * @returns {Promise<{ status: string, message: string }>} The API confirmation
 *   body (this endpoint returns no `data` payload).
 * @throws {Error} On a 401/404 or other non-2xx response.
 */
export const deleteFeedback = async (id) => {
  const res = await api.delete(`/feedback/${id}`);
  return res.data;
};
