import { useState } from "react";
import Modal from "./Modal";
import { useToast } from "../../hooks/useToast";
import { createAdmin, updateAdmin } from "../../services/api";
import { ROUNDED, TYPOGRAPHY, A11Y, WIDTH } from "../../config/constants";

/** Shared input styling — kept as a static string for the Tailwind scanner. */
const INPUT_CLASS = `${WIDTH.FULL} ${ROUNDED.MD} border border-border bg-page-bg
  px-3 py-2 ${TYPOGRAPHY.TEXT_SM} text-text-primary
  placeholder:text-text-secondary ${A11Y.FOCUS_RING}`;

/** Empty form — the create-mode starting point. */
const EMPTY_FORM = { username: "", firstName: "", lastName: "", email: "", password: "" };

/**
 * Create/edit admin modal. Reuses the login modal's look but adds profile
 * fields (name, email). One component serves both flows:
 *  - `mode="create"` → blank form, "Create" button, POSTs a new admin.
 *  - `mode="edit"`   → fields pre-filled from `admin`, "Update" button, PUTs the
 *    change. The password field is optional here — left blank, the current
 *    password is kept.
 *
 * On success it raises a toast, hands the saved admin back via `onSuccess`, and
 * closes; on failure it shows an inline error and an error toast and stays open.
 *
 * The form seeds itself once from props via a lazy initializer; the parent gives
 * it a `key` that changes per open/mode/admin so React remounts it fresh each
 * time (the recommended alternative to re-seeding state in an effect).
 *
 * @param {Object} props
 * @param {boolean} props.open - Whether the modal is visible.
 * @param {"create"|"edit"} [props.mode] - Which flow to render (default "create").
 * @param {Object|null} [props.admin] - The admin to edit (required for edit mode).
 * @param {() => void} props.onClose - Dismiss the modal.
 * @param {(admin: Object) => void} [props.onSuccess] - Called with the saved admin.
 */
const AdminFormModal = ({ open, mode = "create", admin = null, onClose, onSuccess }) => {
  const { addToast } = useToast();
  const isEdit = mode === "edit";

  // Seed once on mount: edit pre-fills from the target admin (password always
  // blank), create starts empty. Re-seeding on prop change is unnecessary
  // because the parent remounts this component via `key`.
  const [form, setForm] = useState(() =>
    isEdit && admin
      ? {
          username: admin.username ?? "",
          firstName: admin.firstName ?? "",
          lastName: admin.lastName ?? "",
          email: admin.email ?? "",
          password: "",
        }
      : EMPTY_FORM,
  );
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  /**
   * Update a single field on input change.
   * @param {React.ChangeEvent<HTMLInputElement>} e - Change event.
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * Create or update the admin, depending on `mode`.
   * @param {React.FormEvent} e - The form submit event.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      let saved;
      if (isEdit) {
        // Only include the password when a new one was actually typed.
        const payload = {
          username: form.username,
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
        };
        if (form.password) payload.password = form.password;
        saved = await updateAdmin(admin._id, payload);
        addToast({ type: "success", message: "Admin updated" });
      } else {
        saved = await createAdmin(form);
        addToast({ type: "success", message: `Admin "${saved.username}" created` });
      }
      onSuccess?.(saved);
      onClose();
    } catch (err) {
      // Surface the API's message (e.g. "Username already exists").
      const message = err.response?.data?.message || err.message || "Something went wrong";
      setError(message);
      addToast({ type: "error", message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Admin" : "Add Admin"}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* Username — the login identifier (required). */}
        <label className="flex flex-col gap-1">
          <span className={`${TYPOGRAPHY.TEXT_XS} ${TYPOGRAPHY.FONT_MEDIUM} text-text-secondary`}>
            Username
          </span>
          <input
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
            autoComplete="username"
            className={INPUT_CLASS}
            placeholder="admin"
          />
        </label>

        {/* First + last name side by side. */}
        <div className="flex gap-3">
          <label className="flex flex-col gap-1 flex-1">
            <span className={`${TYPOGRAPHY.TEXT_XS} ${TYPOGRAPHY.FONT_MEDIUM} text-text-secondary`}>
              First name
            </span>
            <input
              type="text"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              autoComplete="given-name"
              className={INPUT_CLASS}
              placeholder="Ada"
            />
          </label>
          <label className="flex flex-col gap-1 flex-1">
            <span className={`${TYPOGRAPHY.TEXT_XS} ${TYPOGRAPHY.FONT_MEDIUM} text-text-secondary`}>
              Last name
            </span>
            <input
              type="text"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              autoComplete="family-name"
              className={INPUT_CLASS}
              placeholder="Lovelace"
            />
          </label>
        </div>

        {/* Email. */}
        <label className="flex flex-col gap-1">
          <span className={`${TYPOGRAPHY.TEXT_XS} ${TYPOGRAPHY.FONT_MEDIUM} text-text-secondary`}>
            Email
          </span>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
            className={INPUT_CLASS}
            placeholder="admin@example.com"
          />
        </label>

        {/* Password — required to create; optional when editing. */}
        <label className="flex flex-col gap-1">
          <span className={`${TYPOGRAPHY.TEXT_XS} ${TYPOGRAPHY.FONT_MEDIUM} text-text-secondary`}>
            Password
          </span>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            autoComplete="new-password"
            className={INPUT_CLASS}
            placeholder={isEdit ? "Leave blank to keep current" : "••••••••"}
          />
        </label>

        {/* Inline error — only after a failed submit. */}
        {error && (
          <p className={`${TYPOGRAPHY.TEXT_XS} text-red-500`} role="alert">
            {error}
          </p>
        )}

        {/* Submit — disabled while a request is in flight. */}
        <button
          type="submit"
          disabled={loading}
          className={`${WIDTH.FULL} ${ROUNDED.MD} bg-accent px-3 py-2
            ${TYPOGRAPHY.TEXT_SM} ${TYPOGRAPHY.FONT_MEDIUM} text-white
            hover:opacity-90 disabled:opacity-60 ${A11Y.FOCUS_RING}`}
        >
          {loading
            ? isEdit
              ? "Updating…"
              : "Creating…"
            : isEdit
              ? "Update"
              : "Create"}
        </button>
      </form>
    </Modal>
  );
};

export default AdminFormModal;
