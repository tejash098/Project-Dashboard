import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CloseIcon from "@mui/icons-material/Close";
import PageLayout from "../layouts/PageLayout";
import BackLink from "../components/ui/BackLink";
import Card from "../components/ui/Card";
import TechStackPicker from "../components/ui/TechStackPicker";
import { createProject } from "../services/api";
import { useToast } from "../hooks/useToast";
import {
  CONTAINER,
  ROUNDED,
  TYPOGRAPHY,
  WIDTH,
  A11Y,
} from "../config/constants";

/** Shared input styling — kept as a static string for the Tailwind scanner. */
const INPUT_CLASS = `${WIDTH.FULL} ${ROUNDED.MD} border border-border bg-page-bg
  px-3 py-2 ${TYPOGRAPHY.TEXT_SM} text-text-primary
  placeholder:text-text-secondary ${A11Y.FOCUS_RING}`;

/** Shared label styling for each field's caption. */
const LABEL_CLASS = `${TYPOGRAPHY.TEXT_XS} ${TYPOGRAPHY.FONT_MEDIUM} text-text-secondary`;

/** Initial (empty) state for the create-project form. */
const EMPTY_FORM = {
  title: "",
  description: "",
  tags: [],
  liveUrl: "",
  repoUrl: "",
  techStack: [],
  status: "active",
  featured: false,
};

/**
 * Add Project page — a full-page form (not a modal) for admins to create a new
 * project. The server derives a unique slug from the title, so we navigate to
 * the freshly created project's detail page on success. Route access is gated
 * by <ProtectedRoute> in App.jsx, so only admins reach this component.
 */
const AddProject = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [form, setForm] = useState(EMPTY_FORM);
  const [tagInput, setTagInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /**
   * Update a single text/textarea field on change.
   * @param {React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>} e - Change event.
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  /** Commit the pending tag input as a chip (ignoring empties/dups). */
  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, t] }));
    }
    setTagInput("");
  };

  /** Remove a tag chip by value. */
  const removeTag = (tag) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  // Title + description are required (the server enforces this too).
  const isValid = form.title.trim() && form.description.trim();

  /**
   * Create the project, then land on its detail page. The payload omits `slug`
   * so the server generates a unique one from the title.
   * @param {React.FormEvent} e - The form submit event.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid || submitting) return;

    console.log("[AddProject] submitting new project…");
    setSubmitting(true);
    try {
      const created = await createProject({
        title: form.title.trim(),
        description: form.description.trim(),
        tags: form.tags,
        liveUrl: form.liveUrl.trim(),
        repoUrl: form.repoUrl.trim(),
        techStack: form.techStack,
        status: form.status,
        featured: form.featured,
      });
      console.log(`[AddProject] created "${created.slug}"`);
      addToast({ type: "success", message: "Project created" });
      navigate(`/projects/${created.slug}`);
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Create failed";
      console.error("[AddProject] create failed:", message);
      addToast({ type: "error", message: `Couldn’t create: ${message}` });
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* ── Back link — sits above the page title, same width as content ── */}
      <div className={`${CONTAINER.MAX_W} mb-4`}>
        <BackLink />
      </div>

      <PageLayout title="Add Project" subtitle="Create a new project">
        <Card>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Title */}
            <label className="flex flex-col gap-1">
              <span className={LABEL_CLASS}>Title</span>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                className={INPUT_CLASS}
                placeholder="Project name"
              />
            </label>

            {/* Description */}
            <label className="flex flex-col gap-1">
              <span className={LABEL_CLASS}>Description</span>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                rows={5}
                className={`${INPUT_CLASS} resize-y`}
                placeholder="What is this project about?"
              />
            </label>

            {/* Tags — free-form chips. */}
            <div className="flex flex-col gap-1">
              <span className={LABEL_CLASS}>Tags</span>
              <div className="flex flex-wrap items-center gap-2">
                {form.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`inline-flex items-center gap-1 ${ROUNDED.FULL}
                      bg-page-bg border border-border px-2 py-0.5 ${TYPOGRAPHY.TEXT_XS}
                      text-text-secondary`}
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      aria-label={`Remove ${tag}`}
                      className="hover:text-accent"
                    >
                      <CloseIcon sx={{ fontSize: 12 }} />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    } else if (e.key === "Backspace" && !tagInput) {
                      setForm((prev) => ({ ...prev, tags: prev.tags.slice(0, -1) }));
                    }
                  }}
                  placeholder="Add tag…"
                  className={`${ROUNDED.MD} border border-border bg-page-bg px-3 py-2
                    ${TYPOGRAPHY.TEXT_SM} text-text-primary placeholder:text-text-secondary
                    w-40 ${A11Y.FOCUS_RING}`}
                />
              </div>
            </div>

            {/* Tech stack — cascading category → tech picker. */}
            <div className="flex flex-col gap-1">
              <span className={LABEL_CLASS}>Tech Stack</span>
              <TechStackPicker
                value={form.techStack}
                onChange={(next) =>
                  setForm((prev) => ({ ...prev, techStack: next }))
                }
                disabled={submitting}
              />
            </div>

            {/* Live URL */}
            <label className="flex flex-col gap-1">
              <span className={LABEL_CLASS}>Live URL</span>
              <input
                type="url"
                name="liveUrl"
                value={form.liveUrl}
                onChange={handleChange}
                className={INPUT_CLASS}
                placeholder="https://… (optional)"
              />
            </label>

            {/* Repo URL */}
            <label className="flex flex-col gap-1">
              <span className={LABEL_CLASS}>Repository URL</span>
              <input
                type="url"
                name="repoUrl"
                value={form.repoUrl}
                onChange={handleChange}
                className={INPUT_CLASS}
                placeholder="https://github.com/… (optional)"
              />
            </label>

            {/* Status + Featured */}
            <div className="flex flex-wrap items-center gap-6">
              <label className="flex flex-col gap-1">
                <span className={LABEL_CLASS}>Status</span>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className={`${ROUNDED.MD} border border-border bg-page-bg px-3 py-2
                    ${TYPOGRAPHY.TEXT_SM} text-text-primary ${A11Y.FOCUS_RING}`}
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </label>

              <label className="flex items-center gap-2 mt-5 cursor-pointer">
                <span className={`${TYPOGRAPHY.TEXT_SM} text-text-primary`}>
                  Featured
                </span>
                {/* Themed pill toggle — a visually-hidden checkbox drives a
                    track + sliding knob via Tailwind `peer-*` variants. */}
                <span className="relative inline-flex items-center">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={form.featured}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, featured: e.target.checked }))
                    }
                    className="peer sr-only"
                  />
                  {/* Track — neutral when off, accent when on. */}
                  <span
                    className={`block h-5 w-9 ${ROUNDED.FULL} bg-border
                      transition-colors peer-checked:bg-accent
                      peer-focus-visible:ring-2 peer-focus-visible:ring-accent
                      ${A11Y.MOTION_SAFE}`}
                  />
                  {/* Knob — slides right when on. */}
                  <span
                    className={`pointer-events-none absolute left-0.5 top-0.5 h-4 w-4
                      ${ROUNDED.FULL} bg-white shadow transition-transform
                      peer-checked:translate-x-4 ${A11Y.MOTION_SAFE}`}
                  />
                </span>
              </label>
            </div>

            {/* Submit — disabled until valid and while a request is in flight. */}
            <button
              type="submit"
              disabled={!isValid || submitting}
              className={`${WIDTH.FULL} ${ROUNDED.MD} bg-accent px-3 py-2
                ${TYPOGRAPHY.TEXT_SM} ${TYPOGRAPHY.FONT_MEDIUM} text-white
                hover:opacity-90 disabled:opacity-60 ${A11Y.FOCUS_RING}`}
            >
              {submitting ? "Creating…" : "Create Project"}
            </button>
          </form>
        </Card>
      </PageLayout>
    </>
  );
};

export default AddProject;
