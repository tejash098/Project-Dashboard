import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import PageLayout from "../layouts/PageLayout";
import BackLink from "../components/ui/BackLink";
import Card from "../components/ui/Card";
import CopyButton from "../components/ui/CopyButton";
import ImageLightbox from "../components/ui/ImageLightbox";
import Modal from "../components/ui/Modal";
import {
  getFeedbackById,
  updateFeedback,
  deleteFeedback,
} from "../services/api/feedback";
import { useToast } from "../hooks/useToast";
import { formatDate } from "../lib/formatters";
import { FEEDBACK_STATUSES } from "../config/feedbackStatus";
import {
  CONTAINER,
  ROUNDED,
  SPACING,
  TYPOGRAPHY,
  A11Y,
  ICON_SIZE,
} from "../config/constants";

/** Shared <select> styling — written verbatim so Tailwind's scanner detects it. */
const SELECT_CLASS = `${ROUNDED.MD} border border-border bg-page-bg px-3 py-1.5
  ${TYPOGRAPHY.TEXT_SM} text-text-primary ${A11Y.FOCUS_RING}`;

/**
 * One labelled detail row. When `copyValue` is a non-empty string, a copy
 * button is shown next to the value.
 * @param {{ label: string, children: React.ReactNode, copyValue?: string }} props
 */
const Field = ({ label, children, copyValue }) => (
  <div>
    <p className={`${TYPOGRAPHY.TEXT_XS} ${TYPOGRAPHY.FONT_MEDIUM} text-text-secondary`}>
      {label}
    </p>
    <div className={`flex items-center gap-1 ${SPACING.MT_1}`}>
      <p className={`${TYPOGRAPHY.TEXT_SM} text-text-primary wrap-break-words min-w-0`}>
        {children || "—"}
      </p>
      {copyValue ? (
        <CopyButton value={copyValue} label={`Copy ${label.toLowerCase()}`} />
      ) : null}
    </div>
  </div>
);

/**
 * Report detail page (admin-only) — shows every field of one feedback plus its
 * image, lets the admin change the status (persisted via the feedback PUT API),
 * and enlarges the image in a full-screen lightbox on click.
 */
const ReportDetail = () => {
  const { fId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false); // confirmation modal
  const [deleting, setDeleting] = useState(false); // in-flight delete

  // Fetch the feedback by f_id; ignore stale responses if fId changes mid-flight.
  useEffect(() => {
    let ignore = false;
    (async () => {
      // Reset inside the async fn (not the effect body) so the lint rule about
      // synchronous setState in effects stays happy; behavior is unchanged.
      setLoading(true);
      setError(null);
      console.log(`[ReportDetail] fetching feedback ${fId}`);
      try {
        const data = await getFeedbackById(fId);
        if (!ignore) setItem(data);
      } catch (err) {
        if (!ignore) setError(err.response?.data?.message || err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [fId]);

  /**
   * Persist a status change via the feedback PUT API (optimistic; reverts on
   * failure).
   * @param {string} nextStatus - The new status value.
   */
  const handleStatusChange = async (nextStatus) => {
    const previous = item.status;
    setSaving(true);
    setItem((prev) => ({ ...prev, status: nextStatus })); // optimistic
    try {
      const updated = await updateFeedback(fId, { status: nextStatus });
      setItem(updated);
      addToast({ type: "success", message: "Status updated." });
    } catch (err) {
      console.warn(`[ReportDetail] status update failed: ${err.message}`);
      setItem((prev) => ({ ...prev, status: previous })); // revert
      addToast({ type: "error", message: "Couldn’t update status." });
    } finally {
      setSaving(false);
    }
  };

  /**
   * Permanently delete this feedback (and its uploaded image) via the feedback
   * DELETE API, then return to the report list. On failure the admin stays on
   * the detail page with the delete controls re-enabled.
   */
  const handleDelete = async () => {
    setDeleting(true);
    console.log(`[ReportDetail] deleting feedback ${fId}`);
    try {
      await deleteFeedback(fId);
      addToast({ type: "success", message: "Feedback deleted." });
      navigate("/report");
    } catch (err) {
      console.warn(`[ReportDetail] delete failed: ${err.message}`);
      addToast({ type: "error", message: "Couldn’t delete feedback." });
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  return (
    <>
      <div className={`${CONTAINER.MAX_W} mb-4`}>
        <BackLink to="/report" label="Back to report" />
      </div>

      {loading ? (
        <PageLayout title="Feedback">
          <p className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary`}>Loading…</p>
        </PageLayout>
      ) : error ? (
        <PageLayout title="Feedback">
          <p className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary`}>
            Couldn’t load feedback: {error}
          </p>
        </PageLayout>
      ) : !item ? (
        <PageLayout title="Feedback">
          <p className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary`}>
            Feedback not found.
          </p>
        </PageLayout>
      ) : (
        <PageLayout
          title={item.title}
          subtitle={`Submitted ${formatDate(item.createdAt)}`}
          actions={
            // Status control + destructive delete action, side by side.
            <div className="flex items-center gap-2">
              {/* Status control — persists through the feedback PUT API.
                  Disabled while deleting to avoid conflicting requests. */}
              <select
                value={item.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={saving || deleting}
                aria-label="Change status"
                className={`${SELECT_CLASS} disabled:opacity-60`}
              >
                {FEEDBACK_STATUSES.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>

              {/* Delete — opens a confirmation modal. Disabled while a status
                  save or a delete is already in progress. */}
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                disabled={saving || deleting}
                aria-label="Delete feedback"
                className={`flex items-center gap-1 ${ROUNDED.MD} bg-danger-subtle
                  px-3 py-1.5 ${TYPOGRAPHY.TEXT_SM} ${TYPOGRAPHY.FONT_MEDIUM}
                  text-danger hover:opacity-90 disabled:opacity-60 ${A11Y.FOCUS_RING}`}
              >
                <DeleteOutlineIcon sx={{ fontSize: ICON_SIZE.SM }} />
                Delete
              </button>
            </div>
          }
        >
          <Card>
            {/* Core fields in a responsive two-column grid. */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Name">{item.name}</Field>
              <Field label="Email" copyValue={item.email}>{item.email}</Field>
              <Field label="Phone" copyValue={item.phone}>{item.phone}</Field>
              <Field label="Feedback ID">{item.f_id}</Field>
              <Field label="Created">{formatDate(item.createdAt)}</Field>
              <Field label="Last updated">{formatDate(item.updatedAt)}</Field>
            </div>

            {/* Message — full width below the grid. */}
            <div className="mt-4">
              <Field label="Message">{item.message}</Field>
            </div>

            {/* Image — responsive thumbnail; click to enlarge in the lightbox. */}
            {item.imageUrl && (
              <div className="mt-4">
                {/* Label + copy-URL button. */}
                <div className="flex items-center gap-1 mb-2">
                  <p className={`${TYPOGRAPHY.TEXT_XS} ${TYPOGRAPHY.FONT_MEDIUM} text-text-secondary`}>
                    Image
                  </p>
                  <CopyButton value={item.imageUrl} label="Copy image URL" />
                </div>
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  className={`block ${ROUNDED.MD} ${A11Y.FOCUS_RING}`}
                  aria-label="Enlarge image"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full max-h-80 object-contain rounded-lg border border-border"
                  />
                </button>
              </div>
            )}
          </Card>

          <ImageLightbox
            open={lightboxOpen}
            src={item.imageUrl}
            alt={item.title}
            onClose={() => setLightboxOpen(false)}
          />

          {/* Destructive confirmation — both buttons disable while a delete is
              in flight to prevent duplicate requests. */}
          <Modal
            open={deleteOpen}
            onClose={() => setDeleteOpen(false)}
            title="Delete feedback?"
          >
            <p className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary mb-4`}>
              This will permanently delete this feedback and its uploaded image,
              if any.
            </p>
            <div className="flex justify-end gap-2">
              {/* Cancel — dismiss without deleting. */}
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                disabled={deleting}
                className={`${ROUNDED.MD} border border-border bg-page-bg px-3 py-1.5
                  ${TYPOGRAPHY.TEXT_SM} ${TYPOGRAPHY.FONT_MEDIUM} text-text-primary
                  hover:border-accent disabled:opacity-60 ${A11Y.FOCUS_RING}`}
              >
                Cancel
              </button>
              {/* Confirm — calls the DELETE API; uses the danger theme tokens. */}
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className={`${ROUNDED.MD} bg-danger px-3 py-1.5
                  ${TYPOGRAPHY.TEXT_SM} ${TYPOGRAPHY.FONT_MEDIUM} text-white
                  hover:opacity-90 disabled:opacity-60 ${A11Y.FOCUS_RING}`}
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </Modal>
        </PageLayout>
      )}
    </>
  );
};

export default ReportDetail;
