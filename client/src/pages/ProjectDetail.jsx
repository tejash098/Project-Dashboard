import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import LaunchIcon from "@mui/icons-material/Launch";
import GitHubIcon from "@mui/icons-material/GitHub";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import PageLayout from "../layouts/PageLayout";
import BackLink from "../components/ui/BackLink";
import StatusBadge from "../components/ui/StatusBadge";
import EditableField from "../components/ui/EditableField";
import TechStackPicker from "../components/ui/TechStackPicker";
import Modal from "../components/ui/Modal";
import { fetchProjectBySlug, updateProject, deleteProject } from "../services/api";
import { formatDate } from "../lib/formatters";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import {
  CONTAINER,
  ICON_SIZE,
  ROUNDED,
  SPACING,
  TYPOGRAPHY,
  A11Y,
} from "../config/constants";

/** Options for the editable status field. */
const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
];

/**
 * Project detail page — full record for a single project, fetched by the
 * `:slug` route param. Renders a not-found state when the slug doesn't match.
 */
const ProjectDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { addToast } = useToast();

  // ── Fetched data lifecycle ──
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadedSlug, setLoadedSlug] = useState(slug);

  // ── Tech-stack inline editor (uses the cascading picker, not EditableField,
  // whose blur-commit would fight the picker's native dropdowns) ──
  const [techEditing, setTechEditing] = useState(false);
  const [techDraft, setTechDraft] = useState([]);
  const [techSaving, setTechSaving] = useState(false);

  // ── Delete confirmation ──
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Reset to the loading state when navigating to a different slug. Adjusting
  // state during render (rather than inside the effect) is React's recommended
  // way to reset on a param change and avoids a cascading-render warning.
  if (slug !== loadedSlug) {
    setLoadedSlug(slug);
    setProject(null);
    setError(null);
    setLoading(true);
  }

  // Fetch whenever the slug changes. A 404 rejects the promise, landing in
  // catch → renders the not-found state. The `ignore` flag drops a stale
  // response if the slug changes again before the request resolves.
  useEffect(() => {
    let ignore = false;
    // Effect callbacks can't be async, so fetch inside an inner async function.
    const loadProject = async () => {
      console.log(`[ProjectDetail] fetching "${slug}"…`);
      try {
        const data = await fetchProjectBySlug(slug);
        if (!ignore) {
          console.log(`[ProjectDetail] loaded "${slug}"`);
          setProject(data);
        }
      } catch (err) {
        console.error(`[ProjectDetail] load failed for "${slug}":`, err.message);
        if (!ignore) setError(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    loadProject();
    return () => {
      ignore = true;
    };
  }, [slug]);

  /**
   * Persist a single edited field. The PUT returns the full updated project, so
   * we replace local state with it — refreshing the field *and* `updatedAt`.
   * Rethrows on failure so EditableField can revert its draft.
   * @param {string} field - Project field key to update.
   * @param {string|string[]} nextValue - The new value.
   * @returns {Promise<void>}
   */
  const handleSave = async (field, nextValue) => {
    console.log(`[ProjectDetail] save "${field}" on "${slug}" →`, nextValue);
    try {
      const updated = await updateProject(slug, { [field]: nextValue });
      console.log(`[ProjectDetail] saved "${field}"; updatedAt=${updated.updatedAt}`);
      setProject(updated);
      addToast({ type: "success", message: "Project updated" });
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Update failed";
      console.error(`[ProjectDetail] save "${field}" failed:`, message);
      addToast({ type: "error", message: `Couldn’t save: ${message}` });
      throw err; // let EditableField revert its draft
    }
  };

  /** Enter tech-stack edit mode, seeding the draft from the current value. */
  const startTechEdit = () => {
    setTechDraft([...(project.techStack ?? [])]);
    setTechEditing(true);
  };

  /** Persist the edited tech stack via the shared save handler. */
  const saveTechStack = async () => {
    if (techSaving) return;
    setTechSaving(true);
    try {
      await handleSave("techStack", techDraft);
      setTechEditing(false);
    } catch {
      // handleSave already toasted the error; keep the editor open for a retry.
    } finally {
      setTechSaving(false);
    }
  };

  /**
   * Delete this project after confirmation, then return to the project list.
   * Keeps the modal open on failure so the admin can retry.
   * @returns {Promise<void>}
   */
  const handleDelete = async () => {
    if (deleting) return;
    console.log(`[ProjectDetail] deleting "${slug}"…`);
    setDeleting(true);
    try {
      await deleteProject(slug);
      addToast({ type: "success", message: "Project deleted" });
      navigate("/projects");
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Delete failed";
      console.error(`[ProjectDetail] delete failed:`, message);
      addToast({ type: "error", message: `Couldn’t delete: ${message}` });
      setDeleting(false);
    }
  };

  // ── Loading — still fetching ──
  if (loading) {
    return (
      <PageLayout title="Loading…">
        <p className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary`}>
          Loading project…
        </p>
      </PageLayout>
    );
  }

  // ── Not found — fetch failed or the slug matched no project ──
  if (error || !project) {
    return (
      <PageLayout title="Project Not Found">
        <p
          className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary ${SPACING.MB_6}`}
        >
          Project Not Found. Go back to the Project List and Select existing
          one.
        </p>
        <BackLink />
      </PageLayout>
    );
  }

  const {
    title,
    description,
    status,
    techStack,
    tags,
    liveUrl,
    repoUrl,
    createdAt,
    updatedAt,
  } = project;

  return (
    <>
      {/* ── Back link — sits above the page title, same width as content ── */}
      <div className={`${CONTAINER.MAX_W} mb-4`}>
        <BackLink />
      </div>

      <PageLayout
        title={
          // Editable title — renders the plain heading text for visitors.
          <EditableField
            value={title}
            onSave={handleSave}
            type="text"
            fieldName="title"
            canEdit={isAdmin}
            inputClassName="text-xl w-72"
          >
            {title}
          </EditableField>
        }
        actions={
          <>
            {/* Editable status — StatusBadge in view mode, a select while editing. */}
            <EditableField
              value={status}
              onSave={handleSave}
              type="select"
              fieldName="status"
              canEdit={isAdmin}
              options={STATUS_OPTIONS}
            >
              <StatusBadge status={status} />
            </EditableField>

            {/* Admin-only delete — opens a confirmation modal. */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                className={`inline-flex items-center gap-1 ${ROUNDED.MD} border border-border
                  px-2 py-1 ${TYPOGRAPHY.TEXT_SM} ${TYPOGRAPHY.FONT_MEDIUM} text-danger
                  hover:bg-danger hover:text-white ${A11Y.FOCUS_RING}`}
              >
                <DeleteOutlineIcon sx={{ fontSize: ICON_SIZE.SM }} />
                Delete
              </button>
            )}
          </>
        }
      >
        {/* ── Full description — no clamp here ── */}
        <p className={`${TYPOGRAPHY.TEXT_SM} text-text-primary`}>
          <EditableField
            value={description}
            onSave={handleSave}
            type="textarea"
            fieldName="description"
            canEdit={isAdmin}
          >
            {description}
          </EditableField>
        </p>

        {/* ── Tech stack — bordered neutral chips ── */}
        <div className={SPACING.MT_2}>
          <h2
            className={`${TYPOGRAPHY.TEXT_XS} ${TYPOGRAPHY.FONT_SEMIBOLD} text-text-secondary mb-2`}
          >
            Tech Stack
          </h2>
          {techEditing ? (
            // ── Edit mode — cascading picker + explicit Save/Cancel ──
            <div className="flex flex-col gap-3">
              <TechStackPicker
                value={techDraft}
                onChange={setTechDraft}
                disabled={techSaving}
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={saveTechStack}
                  disabled={techSaving}
                  className={`${ROUNDED.MD} bg-accent px-3 py-1 ${TYPOGRAPHY.TEXT_SM}
                    ${TYPOGRAPHY.FONT_MEDIUM} text-white hover:opacity-90
                    disabled:opacity-60 ${A11Y.FOCUS_RING}`}
                >
                  {techSaving ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setTechEditing(false)}
                  disabled={techSaving}
                  className={`${ROUNDED.MD} border border-border px-3 py-1
                    ${TYPOGRAPHY.TEXT_SM} ${TYPOGRAPHY.FONT_MEDIUM} text-text-secondary
                    hover:text-accent disabled:opacity-60 ${A11Y.FOCUS_RING}`}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            // ── View mode — chips + a pencil affordance for admins ──
            <span className="group/edit inline-flex items-start gap-1.5">
              <div className="flex flex-wrap gap-2">
                {techStack?.map((tech) => (
                  <span
                    key={tech}
                    className={`${ROUNDED.MD} border border-border px-2 py-0.5
                      ${TYPOGRAPHY.TEXT_XS} text-text-secondary`}
                  >
                    {tech}
                  </span>
                ))}
              </div>
              {isAdmin && (
                <button
                  type="button"
                  onClick={startTechEdit}
                  aria-label="Edit techStack"
                  className={`shrink-0 text-text-secondary opacity-0
                    group-hover/edit:opacity-100 focus:opacity-100
                    hover:text-accent ${ROUNDED.SM} ${A11Y.FOCUS_RING}`}
                >
                  <EditOutlinedIcon sx={{ fontSize: ICON_SIZE.SM }} />
                </button>
              )}
            </span>
          )}
        </div>

        {/* ── Tags — muted #-prefixed pills ── */}
        <div className="mt-5">
          <h2
            className={`${TYPOGRAPHY.TEXT_XS} ${TYPOGRAPHY.FONT_SEMIBOLD} text-text-secondary mb-2`}
          >
            Tags
          </h2>
          <EditableField
            value={tags}
            onSave={handleSave}
            type="tags"
            fieldName="tags"
            canEdit={isAdmin}
          >
            <div className="flex flex-wrap gap-2">
              {tags?.map((tag) => (
                <span
                  key={tag}
                  className={`${ROUNDED.FULL} bg-page-bg px-2 py-0.5
                    ${TYPOGRAPHY.TEXT_XS} text-text-secondary`}
                >
                  #{tag}
                </span>
              ))}
            </div>
          </EditableField>
        </div>

        {/* ── Links — external, open in a new tab. Admins can add/edit URLs;
             visitors only see the Live link when one is present. ── */}
        <div className="flex items-center gap-4 mt-5">
          {(liveUrl || isAdmin) && (
            <EditableField
              value={liveUrl || ""}
              onSave={handleSave}
              type="text"
              fieldName="liveUrl"
              canEdit={isAdmin}
            >
              {liveUrl ? (
                <a
                  href={liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1 ${TYPOGRAPHY.TEXT_SM}
                    ${TYPOGRAPHY.FONT_MEDIUM} text-accent hover:underline`}
                >
                  <LaunchIcon sx={{ fontSize: ICON_SIZE.SM }} />
                  Live
                </a>
              ) : (
                <span className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary italic`}>
                  Add live URL
                </span>
              )}
            </EditableField>
          )}
          <EditableField
            value={repoUrl || ""}
            onSave={handleSave}
            type="text"
            fieldName="repoUrl"
            canEdit={isAdmin}
          >
            {repoUrl ? (
              <a
                href={repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1 ${TYPOGRAPHY.TEXT_SM}
                  ${TYPOGRAPHY.FONT_MEDIUM} text-accent hover:underline`}
              >
                <GitHubIcon sx={{ fontSize: ICON_SIZE.SM }} />
                Code
              </a>
            ) : (
              <span className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary italic`}>
                Add repo URL
              </span>
            )}
          </EditableField>
        </div>

        {/* ── Dates — created / last updated ── */}
        <p className={`${TYPOGRAPHY.TEXT_XS} text-text-secondary mt-5`}>
          Created {formatDate(createdAt)} · Updated {formatDate(updatedAt)}
        </p>
      </PageLayout>

      {/* ── Delete confirmation modal ── */}
      <Modal
        open={confirmOpen}
        onClose={() => !deleting && setConfirmOpen(false)}
        title="Delete project?"
      >
        <p className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary`}>
          This permanently deletes “{title}”. This action can’t be undone.
        </p>
        <div className="flex items-center justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={() => setConfirmOpen(false)}
            disabled={deleting}
            className={`${ROUNDED.MD} border border-border px-3 py-1.5
              ${TYPOGRAPHY.TEXT_SM} ${TYPOGRAPHY.FONT_MEDIUM} text-text-secondary
              hover:text-accent disabled:opacity-60 ${A11Y.FOCUS_RING}`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className={`${ROUNDED.MD} bg-danger px-3 py-1.5 ${TYPOGRAPHY.TEXT_SM}
              ${TYPOGRAPHY.FONT_MEDIUM} text-white hover:opacity-90
              disabled:opacity-60 ${A11Y.FOCUS_RING}`}
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </Modal>
    </>
  );
};

export default ProjectDetail;
