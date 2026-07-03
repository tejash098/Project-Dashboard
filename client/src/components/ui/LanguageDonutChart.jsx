import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { getLanguageColor } from "../../config/languageColors";
import { buildDonutData, OTHER_LABEL } from "../../lib/languageStats";
import { BORDER, ROUNDED, TYPOGRAPHY } from "../../config/constants";

/**
 * Format a byte count for humans (B / KB / MB), 1 decimal place.
 * @param {number} bytes - Raw byte count.
 * @returns {string} e.g. "412.5 KB".
 */
const formatBytes = (bytes) => {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
};

/**
 * Hover tooltip for a donut slice — a plain HTML card so the theme tokens
 * resolve normally (recharts' default tooltip is hard to theme).
 * @param {Object} props - Injected by recharts' <Tooltip content={...} />.
 * @param {boolean} [props.active] - Whether a slice is hovered.
 * @param {Array}   [props.payload] - Hovered slice data (recharts shape).
 */
const LanguageTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, percent, value } = payload[0].payload;
  return (
    <div
      className={`border ${BORDER.DEFAULT} ${ROUNDED.MD} bg-surface px-3 py-2 shadow-sm`}
    >
      <p
        className={`${TYPOGRAPHY.TEXT_SM} ${TYPOGRAPHY.FONT_MEDIUM} text-text-primary`}
      >
        {name}
      </p>
      <p className={`${TYPOGRAPHY.TEXT_XS} text-text-secondary`}>
        {percent}% · {formatBytes(value)}
      </p>
    </div>
  );
};

/**
 * Donut chart of code bytes per language across all public repos. Top
 * languages get their own slice (colored to match the repo cards' language
 * dots); the long tail folds into a neutral "Other". Identity is never
 * color-alone: the HTML legend beside the chart names every slice.
 *
 * Theming note: CSS variables don't resolve inside SVG presentation
 * attributes, so theme-reactive colors (slice-gap stroke, the "Other" fill)
 * are applied via CSS classes — a stylesheet rule beats the attribute, and it
 * tracks dark-mode toggles live.
 *
 * @param {Object} props
 * @param {import("../../services/api/github").LanguageTotals} props.totals -
 *   Bytes of code per language (the page owns the empty-state message).
 */
const LanguageDonutChart = ({ totals }) => {
  const data = buildDonutData(totals);
  if (data.length === 0) return null;

  // Largest slice — shown in the donut hole as the headline stat.
  const top = data[0];
  // Screen-reader summary; the visible legend carries the same information.
  const summary = data.map((d) => `${d.name} ${d.percent}%`).join(", ");

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-10">
      {/* Wrapper supplies the definite height ResponsiveContainer needs, plus
          the slice-gap stroke (also overrides recharts' default white). */}
      <div
        role="img"
        aria-label={`Language breakdown: ${summary}`}
        className="relative h-56 w-full max-w-xs shrink-0 sm:w-56 [&_.recharts-sector]:stroke-surface"
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="65%"
              outerRadius="90%"
              strokeWidth={2}
            >
              {data.map((slice) => (
                // "Other" is neutral by design — its color is a CSS var, which
                // only works as a class here (see theming note above).
                <Cell
                  key={slice.name}
                  fill={getLanguageColor(slice.name)}
                  className={
                    slice.name === OTHER_LABEL ? "fill-text-secondary" : undefined
                  }
                />
              ))}
            </Pie>
            <Tooltip content={<LanguageTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Donut-hole headline — hover-transparent so slice tooltips work. */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`${TYPOGRAPHY.TEXT_2XL} ${TYPOGRAPHY.FONT_BOLD} text-text-primary`}
          >
            {top.percent}%
          </span>
          <span className={`${TYPOGRAPHY.TEXT_XS} text-text-secondary`}>
            {top.name}
          </span>
        </div>
      </div>

      {/* Custom HTML legend — names + percents in text tokens, with the same
          colored-dot idiom as RepoCard (inline style resolves the CSS-var
          fallback for "Other" just fine, unlike SVG attributes). */}
      <ul className="flex w-full max-w-xs flex-col gap-2">
        {data.map((slice) => (
          <li key={slice.name} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: getLanguageColor(slice.name) }}
            />
            <span className={`${TYPOGRAPHY.TEXT_SM} text-text-primary`}>
              {slice.name}
            </span>
            <span
              className={`ml-auto ${TYPOGRAPHY.TEXT_SM} text-text-secondary tabular-nums`}
            >
              {slice.percent}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LanguageDonutChart;
