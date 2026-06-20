import { useState, useRef, useEffect } from "react";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import EditOffOutlinedIcon from "@mui/icons-material/EditOffOutlined";
import CloseIcon from "@mui/icons-material/Close";
import { Loader2 } from "lucide-react";
import { ROUNDED, TYPOGRAPHY, A11Y, ICON_SIZE } from "../../config/constants";

/** Shared control styling for the text/textarea/select editors. */
const CONTROL_CLASS = `${ROUNDED.MD} border border-border bg-page-bg px-2 py-1
  ${TYPOGRAPHY.TEXT_SM} text-text-primary ${A11Y.FOCUS_RING}`;

/**
 * Compare an edited value against the original to decide whether a save is
 * needed. Arrays compare element-wise; everything else compares trimmed strings.
 * @param {*} a - Candidate value.
 * @param {*} b - Original value.
 * @returns {boolean} True when the two are equivalent (no save required).
 */
const valuesEqual = (a, b) => {
  if (Array.isArray(a) || Array.isArray(b)) {
    const arrA = a ?? [];
    const arrB = b ?? [];
    return arrA.length === arrB.length && arrA.every((v, i) => v === arrB[i]);
  }
  return String(a ?? "").trim() === String(b ?? "").trim();
};

/**
 * Inline-editable wrapper around a project field. In read-only mode (or for
 * visitors) it renders `children` exactly as the page would normally — so the
 * non-admin experience is unchanged. For admins it adds a pencil affordance that
 * swaps the display for the matching editor; the value saves on blur/Enter and
 * reverts (no request) via the cancel icon.
 *
 * @param {Object} props
 * @param {string|string[]} props.value - Current field value (array for "tags").
 * @param {(field: string, next: string|string[]) => Promise<void>} props.onSave - Persist handler; must reject on failure.
 * @param {"text"|"textarea"|"select"|"tags"} [props.type] - Editor variant.
 * @param {string} props.fieldName - Project field key sent to `onSave`.
 * @param {boolean} props.canEdit - Whether editing is allowed (admin only).
 * @param {{ value: string, label: string }[]} [props.options] - Options for "select".
 * @param {string} [props.inputClassName] - Extra classes for the text input (e.g. larger title).
 * @param {React.ReactNode} props.children - The normal read-only rendering of the field.
 */
const EditableField = ({
  value,
  onSave,
  type = "text",
  fieldName,
  canEdit,
  options = [],
  inputClassName = "",
  children,
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value); // string, or array for "tags"
  const [tagInput, setTagInput] = useState(""); // in-progress chip text ("tags")
  const [saving, setSaving] = useState(false);

  // Set true the instant a cancel is requested so the trailing blur-commit skips.
  const cancelingRef = useRef(false);
  const controlRef = useRef(null);

  // Focus the editor when entering edit mode.
  useEffect(() => {
    if (editing) controlRef.current?.focus();
  }, [editing]);

  // Read-only / visitor — render the field exactly as normal, no affordance.
  if (!canEdit) return children;

  /** Enter edit mode, seeding the draft from the current value. */
  const startEdit = () => {
    console.log(`[EditableField] start editing "${fieldName}"`);
    setDraft(Array.isArray(value) ? [...value] : (value ?? ""));
    setTagInput("");
    setEditing(true);
  };

  /** Revert to the original value and exit without saving. */
  const cancel = () => {
    console.log(`[EditableField] cancel "${fieldName}" (no request)`);
    cancelingRef.current = true;
    setEditing(false);
  };

  /**
   * Persist the draft if it actually changed. Triggered by Enter (which blurs
   * the control) or by focus leaving the editor. A dirty-check skips no-op PUTs;
   * a failure reverts the draft (the parent toasts the error).
   */
  const commit = async () => {
    // A cancel just happened — swallow the trailing blur and reset the flag.
    if (cancelingRef.current) {
      cancelingRef.current = false;
      console.log(`[EditableField] commit skipped for "${fieldName}" (canceled)`);
      return;
    }
    if (!editing || saving) return;

    // Fold any pending (un-entered) chip text into the tag list before saving.
    let next;
    if (type === "tags") {
      next = [...draft];
      const pending = tagInput.trim();
      if (pending && !next.includes(pending)) next.push(pending);
    } else {
      next = typeof draft === "string" ? draft.trim() : draft;
    }

    if (valuesEqual(next, value)) {
      console.log(`[EditableField] "${fieldName}" unchanged → no request`);
      setEditing(false); // unchanged → no request
      return;
    }

    console.log(`[EditableField] committing "${fieldName}"…`);
    setSaving(true);
    try {
      await onSave(fieldName, next);
      setEditing(false);
    } catch {
      console.warn(`[EditableField] "${fieldName}" save failed → reverting draft`);
      setDraft(value); // parent already surfaced the error via a toast
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Save when focus leaves the whole editor. Checking `relatedTarget` keeps
   * focus moves *within* the editor (e.g. onto the cancel button) from saving —
   * this is what defuses the classic cancel-vs-blur race.
   * @param {React.FocusEvent} e - The blur event on the editor container.
   */
  const handleContainerBlur = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) commit();
  };

  /** Add the current chip text as a tag ("tags" editor). */
  const addTag = () => {
    const t = tagInput.trim();
    if (t && !draft.includes(t)) setDraft((prev) => [...prev, t]);
    setTagInput("");
  };

  // ── Read-only display + pencil affordance ──
  if (!editing) {
    return (
      <span className="group/edit inline-flex items-start gap-1.5">
        {children}
        <button
          type="button"
          onClick={startEdit}
          aria-label={`Edit ${fieldName}`}
          className={`shrink-0 text-text-secondary opacity-0
            group-hover/edit:opacity-100 focus:opacity-100
            hover:text-accent ${ROUNDED.SM} ${A11Y.FOCUS_RING}`}
        >
          <EditOutlinedIcon sx={{ fontSize: ICON_SIZE.SM }} />
        </button>
      </span>
    );
  }

  // ── Edit mode — the matching control + cancel + saving indicator ──
  return (
    <span
      onBlur={handleContainerBlur}
      className="inline-flex items-start gap-1.5"
    >
      {type === "text" && (
        <input
          ref={controlRef}
          type="text"
          value={draft}
          disabled={saving}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.currentTarget.blur(); // blur → container onBlur → commit (once)
            } else if (e.key === "Escape") {
              cancel();
            }
          }}
          className={`${CONTROL_CLASS} ${inputClassName}`}
        />
      )}

      {type === "textarea" && (
        <textarea
          ref={controlRef}
          rows={4}
          value={draft}
          disabled={saving}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            // Plain Enter inserts a newline; Ctrl/Cmd+Enter saves.
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              e.currentTarget.blur();
            } else if (e.key === "Escape") {
              cancel();
            }
          }}
          className={`${CONTROL_CLASS} w-full min-w-72`}
        />
      )}

      {type === "select" && (
        <select
          ref={controlRef}
          value={draft}
          disabled={saving}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.currentTarget.blur();
            } else if (e.key === "Escape") {
              cancel();
            }
          }}
          className={CONTROL_CLASS}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {type === "tags" && (
        <span className="inline-flex flex-wrap items-center gap-1.5 max-w-md">
          {/* Existing chips, each removable. */}
          {draft.map((tag, i) => (
            <span
              key={tag}
              className={`inline-flex items-center gap-1 ${ROUNDED.FULL}
                bg-page-bg border border-border px-2 py-0.5 ${TYPOGRAPHY.TEXT_XS}
                text-text-secondary`}
            >
              {tag}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setDraft((prev) => prev.filter((_, idx) => idx !== i))}
                aria-label={`Remove ${tag}`}
                className="hover:text-accent"
              >
                <CloseIcon sx={{ fontSize: 12 }} />
              </button>
            </span>
          ))}
          {/* Add-new input — Enter commits a chip, Backspace pops the last. */}
          <input
            ref={controlRef}
            type="text"
            value={tagInput}
            disabled={saving}
            placeholder="add…"
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              } else if (e.key === "Backspace" && !tagInput) {
                setDraft((prev) => prev.slice(0, -1));
              } else if (e.key === "Escape") {
                cancel();
              }
            }}
            className={`${CONTROL_CLASS} w-20`}
          />
        </span>
      )}

      {/* Saving spinner, or the cancel (revert) button. */}
      {saving ? (
        <Loader2 size={ICON_SIZE.SM} className="animate-spin text-text-secondary mt-1" />
      ) : (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()} // don't steal focus / trigger blur-save
          onClick={cancel}
          aria-label={`Cancel editing ${fieldName}`}
          className={`shrink-0 text-text-secondary hover:text-accent mt-1
            ${ROUNDED.SM} ${A11Y.FOCUS_RING}`}
        >
          <EditOffOutlinedIcon sx={{ fontSize: ICON_SIZE.SM }} />
        </button>
      )}
    </span>
  );
};

export default EditableField;
