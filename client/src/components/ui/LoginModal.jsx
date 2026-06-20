import { useState } from "react";
import Modal from "./Modal";
import { useAuth } from "../../hooks/useAuth";
import { ROUNDED, TYPOGRAPHY, A11Y, WIDTH } from "../../config/constants";

/** Shared input styling — kept as a static string for the Tailwind scanner. */
const INPUT_CLASS = `${WIDTH.FULL} ${ROUNDED.MD} border border-border bg-page-bg
  px-3 py-2 ${TYPOGRAPHY.TEXT_SM} text-text-primary
  placeholder:text-text-secondary ${A11Y.FOCUS_RING}`;

/**
 * Admin login modal. Renders a username/password form on a blurred backdrop
 * (via Modal). Submitting calls `login()`; on success it closes, on failure it
 * shows an inline error and stays open.
 *
 * @param {Object} props
 * @param {boolean} props.open - Whether the modal is visible.
 * @param {() => void} props.onClose - Called to dismiss the modal.
 */
const LoginModal = ({ open, onClose }) => {
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  /**
   * Attempt login. Native form submit fires this on the submit button or Enter.
   * @param {React.FormEvent} e - The form submit event.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(`[LoginModal] submit for "${username}"`);
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
      // Reset and close on success so the next open starts clean.
      setUsername("");
      setPassword("");
      onClose();
    } catch (err) {
      // Surface the API's message (e.g. "Invalid username or password").
      const message = err.response?.data?.message || err.message || "Login failed";
      console.warn(`[LoginModal] login failed: ${message}`);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Admin Login">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* Username */}
        <label className="flex flex-col gap-1">
          <span className={`${TYPOGRAPHY.TEXT_XS} ${TYPOGRAPHY.FONT_MEDIUM} text-text-secondary`}>
            Username
          </span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            className={INPUT_CLASS}
            placeholder="admin"
          />
        </label>

        {/* Password */}
        <label className="flex flex-col gap-1">
          <span className={`${TYPOGRAPHY.TEXT_XS} ${TYPOGRAPHY.FONT_MEDIUM} text-text-secondary`}>
            Password
          </span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className={INPUT_CLASS}
            placeholder="••••••••"
          />
        </label>

        {/* Inline error — only when a login attempt failed. */}
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
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </Modal>
  );
};

export default LoginModal;
