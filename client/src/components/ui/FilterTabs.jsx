import { A11Y, ROUNDED, TRANSITION, TYPOGRAPHY } from "../../config/constants";

/** Default filter values and their display labels (used by the Projects page). */
const DEFAULT_FILTERS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
];

/**
 * Controlled status-filter tab bar. Owns no state: it receives the current
 * filter (and optionally per-value counts), and reports changes upward, so any
 * parent can drive it. When `counts` is supplied each tab shows its count; when
 * omitted (e.g. server-side filtering) tabs show just the label.
 *
 * @param {Object}   props
 * @param {string}   props.filter    - Currently selected filter value.
 * @param {Function} props.onChange  - Called with the new value on click.
 * @param {Array<{ value: string, label: string }>} [props.filters] - Tab set to
 *   render; defaults to All/Active/Completed.
 * @param {{ total: number, [status: string]: number }} [props.counts] - Optional
 *   per-status counts; "all" maps to `total`. Omit to hide counts.
 */
const FilterTabs = ({ filter, onChange, filters = DEFAULT_FILTERS, counts }) => {
  /** Count for a given filter value ("all" maps to the total), or undefined. */
  const countFor = (value) =>
    counts ? (value === "all" ? counts.total : counts[value]) : undefined;

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map(({ value, label }) => {
        const isActive = filter === value;
        const count = countFor(value);

        return (
          <button
            key={value}
            onClick={() => onChange(value)}
            className={`px-3 py-1.5 ${ROUNDED.MD} ${TYPOGRAPHY.TEXT_SM}
              ${TYPOGRAPHY.FONT_MEDIUM} ${TRANSITION.COLORS} ${A11Y.FOCUS_RING}
              ${
                isActive
                  ? "bg-accent-subtle text-accent"
                  : "text-text-secondary hover:bg-accent-subtle hover:text-accent"
              }`}
          >
            {/* Show the count only when the parent supplies one. */}
            {label}{count !== undefined ? ` (${count})` : ""}
          </button>
        );
      })}
    </div>
  );
};

export default FilterTabs;