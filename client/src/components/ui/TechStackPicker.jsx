import { useEffect, useMemo, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import { Loader2 } from "lucide-react";
import { fetchTechStacks, createTechStack } from "../../services/api";
import { useToast } from "../../hooks/useToast";
import { ROUNDED, TYPOGRAPHY, A11Y, ICON_SIZE } from "../../config/constants";

/** Fixed category list — mirrors the TechStack model's enum (client-owned). */
const CATEGORIES = [
  "frontend",
  "backend",
  "fullstack",
  "cloud",
  "AI",
  "cybersec",
  "testing",
  "others",
];

/** Shared control styling for the category/tech selects and the custom input. */
const CONTROL_CLASS = `${ROUNDED.MD} border border-border bg-page-bg px-2 py-1
  ${TYPOGRAPHY.TEXT_SM} text-text-primary ${A11Y.FOCUS_RING}`;

/**
 * Controlled cascading tech-stack picker. The parent owns the selected names
 * (`value`) and is notified of every add/remove via `onChange`, so the same
 * component drives both the create form and the detail-page inline editor.
 *
 * Flow: pick a category → pick a tech from that category → it becomes a chip.
 * A custom tech can be typed in; it's persisted to the catalog under "others"
 * (so it's reusable next time) and added to the selection.
 *
 * @param {Object} props
 * @param {string[]} props.value - Currently selected tech names.
 * @param {(next: string[]) => void} props.onChange - Called with the new selection.
 * @param {boolean} [props.disabled] - Disable all controls (e.g. during a parent save).
 */
const TechStackPicker = ({ value = [], onChange, disabled = false }) => {
  const { addToast } = useToast();

  // ── Catalog lifecycle ──
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Cascade + custom-add state ──
  const [category, setCategory] = useState("");
  const [customName, setCustomName] = useState("");
  const [adding, setAdding] = useState(false);

  // Load the catalog once on mount.
  useEffect(() => {
    const loadCatalog = async () => {
      console.log("[TechStackPicker] fetching catalog…");
      try {
        const list = await fetchTechStacks();
        console.log(`[TechStackPicker] loaded ${list.length} techs`);
        setCatalog(list);
      } catch (err) {
        console.error("[TechStackPicker] catalog load failed:", err.message);
        addToast({ type: "error", message: "Couldn’t load tech list" });
      } finally {
        setLoading(false);
      }
    };
    loadCatalog();
  }, [addToast]);

  // Techs in the chosen category that aren't already selected (can't pick dups).
  const availableTechs = useMemo(
    () =>
      catalog
        .filter((t) => t.category === category && !value.includes(t.name))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [catalog, category, value],
  );

  /** Add a tech name to the selection (no-op if already present). */
  const addTech = (name) => {
    if (!name || value.includes(name)) return;
    console.log(`[TechStackPicker] add "${name}"`);
    onChange([...value, name]);
  };

  /** Remove a tech name from the selection. */
  const removeTech = (name) => {
    console.log(`[TechStackPicker] remove "${name}"`);
    onChange(value.filter((t) => t !== name));
  };

  /** Selecting a tech in the dropdown adds it, then resets the dropdown. */
  const handleTechSelect = (e) => {
    addTech(e.target.value);
    // Reset back to the placeholder so the same tech can't get "stuck" selected.
    e.target.value = "";
  };

  /**
   * Persist a custom tech under "others" and add it to the selection. The POST
   * is idempotent server-side, so re-adding an existing name is safe.
   */
  const handleAddCustom = async () => {
    const name = customName.trim();
    if (!name || adding) return;
    // Skip an obvious case-insensitive dup already in the selection.
    if (value.some((t) => t.toLowerCase() === name.toLowerCase())) {
      setCustomName("");
      return;
    }
    console.log(`[TechStackPicker] add custom "${name}" → others`);
    setAdding(true);
    try {
      const created = await createTechStack({ name, category: "others" });
      // Reflect it in the local catalog so it shows up in the dropdown too.
      setCatalog((prev) =>
        prev.some((t) => t._id === created._id) ? prev : [...prev, created],
      );
      addTech(created.name);
      setCustomName("");
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Add failed";
      console.error(`[TechStackPicker] add custom failed:`, message);
      addToast({ type: "error", message: `Couldn’t add tech: ${message}` });
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* ── Selected chips ── */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tech) => (
            <span
              key={tech}
              className={`inline-flex items-center gap-1 ${ROUNDED.MD}
                border border-border px-2 py-0.5 ${TYPOGRAPHY.TEXT_XS}
                text-text-primary`}
            >
              {tech}
              <button
                type="button"
                onClick={() => removeTech(tech)}
                disabled={disabled}
                aria-label={`Remove ${tech}`}
                className="hover:text-accent disabled:opacity-50"
              >
                <CloseIcon sx={{ fontSize: 12 }} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* ── Cascade: category → tech ── */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={category}
          disabled={disabled || loading}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Tech category"
          className={CONTROL_CLASS}
        >
          <option value="">{loading ? "Loading…" : "Select category…"}</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <select
          value=""
          disabled={disabled || !category}
          onChange={handleTechSelect}
          aria-label="Tech"
          className={CONTROL_CLASS}
        >
          <option value="">
            {!category
              ? "Pick a category first"
              : availableTechs.length === 0
                ? "No more in this category"
                : "Select tech…"}
          </option>
          {availableTechs.map((tech) => (
            <option key={tech._id} value={tech.name}>
              {tech.name}
            </option>
          ))}
        </select>
      </div>

      {/* ── Custom add — files the new tech under "others" ── */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={customName}
          disabled={disabled || adding}
          placeholder="Add custom tech…"
          onChange={(e) => setCustomName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddCustom();
            }
          }}
          aria-label="Add custom tech"
          className={`${CONTROL_CLASS} w-44`}
        />
        <button
          type="button"
          onClick={handleAddCustom}
          disabled={disabled || adding || !customName.trim()}
          className={`inline-flex items-center gap-1 ${ROUNDED.MD} border border-border
            px-3 py-1 ${TYPOGRAPHY.TEXT_SM} ${TYPOGRAPHY.FONT_MEDIUM} text-text-primary
            hover:bg-accent-subtle hover:text-accent disabled:opacity-50
            ${A11Y.FOCUS_RING}`}
        >
          {adding && (
            <Loader2 size={ICON_SIZE.SM} className="animate-spin text-text-secondary" />
          )}
          Add
        </button>
      </div>
    </div>
  );
};

export default TechStackPicker;
