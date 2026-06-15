import { getStatusCounts } from "../../lib/projectSelectors";
import { A11Y, ROUNDED, TRANSITION, TYPOGRAPHY } from "../../config/constants";

/** Selectable filter values and their display labels. */
const FILTERS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
];

/**
 * Controlled status-filter tab bar. Owns no state: it receives the current
 * filter and reports changes upward, so any parent can drive it.
 * Each tab shows a live count from getStatusCounts().
 *
 * @param {Object}   props
 * @param {string}   props.filter   - Currently selected filter value.
 * @param {Function} props.onChange - Called with the new value on click.
 */
const FilterTabs = ({ filter, onChange }) => {
  const counts = getStatusCounts();

  /** Count for a given filter value ("all" maps to the total). */
  const countFor = (value) => (value === "all" ? counts.total : counts[value]);

  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map(({ value, label }) => {
        const isActive = filter === value;

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
            {label} ({countFor(value)})
          </button>
        );
      })}
    </div>
  );
};

export default FilterTabs;