import { useCallback, useEffect, useState } from "react";
import PageLayout from "../layouts/PageLayout";
import FilterTabs from "../components/ui/FilterTabs";
import FeedbackCard from "../components/ui/FeedbackCard";
import { getFeedback } from "../services/api/feedback";
import {
  FEEDBACK_STATUS_FILTERS,
  FEEDBACK_SORTS,
} from "../config/feedbackStatus";
import { GRID, SPACING, TYPOGRAPHY, ROUNDED, A11Y } from "../config/constants";

/** Page size for the feedback list (matches the server default). */
const PAGE_SIZE = 15;

/** Shared <select> styling — written verbatim so Tailwind's scanner detects it. */
const SELECT_CLASS = `${ROUNDED.MD} border border-border bg-page-bg px-3 py-1.5
  ${TYPOGRAPHY.TEXT_SM} text-text-primary ${A11Y.FOCUS_RING}`;

/**
 * Report page (admin-only) — a paginated, filterable, sortable list of feedback
 * submissions. Filtering/sorting/pagination are server-side; "Load page" appends
 * the next page. Each card links to the detail route.
 */
const Report = () => {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true); // initial / filter / sort load
  const [loadingMore, setLoadingMore] = useState(false); // "load page" append
  const [error, setError] = useState(null);

  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("-creation_time");

  /**
   * Fetch one page of feedback and either replace the list (new filter/sort) or
   * append to it ("load page").
   * @param {number} pageNum - 1-based page to fetch.
   * @param {boolean} replace - Replace the list when true, append when false.
   */
  const load = useCallback(
    async (pageNum, replace) => {
      if (replace) setLoading(true);
      else setLoadingMore(true);
      setError(null);
      try {
        const params = { sort, page: pageNum, limit: PAGE_SIZE };
        if (status !== "all") params.status = status; // omit for "all"
        console.log(`[Report] fetching page ${pageNum} (status=${status}, sort=${sort})`);
        const res = await getFeedback(params);
        setItems((prev) => (replace ? res.data : [...prev, ...res.data]));
        setTotal(res.total);
        setPage(res.page);
      } catch (err) {
        console.error("[Report] load failed:", err.message);
        setError(err.response?.data?.message || err.message);
      } finally {
        if (replace) setLoading(false);
        else setLoadingMore(false);
      }
    },
    [status, sort],
  );

  // Reload from page 1 whenever the filter or sort changes (and on mount).
  useEffect(() => {
    // load() flips loading/error synchronously to drive the spinner — an
    // intentional async-fetch transition, not a cascading-render bug.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(1, true);
  }, [load]);

  const hasMore = items.length < total;

  return (
    <PageLayout
      title="Report"
      subtitle="Feedback submissions"
      actions={
        // Sort control — newest/oldest by creation or update time.
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="Sort feedback"
          className={SELECT_CLASS}
        >
          {FEEDBACK_SORTS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      }
    >
      {/* ── Status filter tabs (server-side filter; no per-status counts) ── */}
      <FilterTabs
        filter={status}
        onChange={setStatus}
        filters={FEEDBACK_STATUS_FILTERS}
      />

      {/* ── Loading / error / empty, then the grid ── */}
      {loading ? (
        <p className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary mt-6`}>
          Loading feedback…
        </p>
      ) : error ? (
        <p className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary mt-6`}>
          Couldn’t load feedback: {error}
        </p>
      ) : items.length === 0 ? (
        <p className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary mt-6`}>
          No feedback found.
        </p>
      ) : (
        <>
          <div className={`${GRID.PROJECTS} ${SPACING.GAP_4} mt-6`}>
            {items.map((f) => (
              <FeedbackCard key={f.f_id} feedback={f} />
            ))}
          </div>

          {/* ── Load more — only while unseen pages remain ── */}
          {hasMore && (
            <div className="flex justify-center mt-6">
              <button
                type="button"
                onClick={() => load(page + 1, false)}
                disabled={loadingMore}
                className={`${ROUNDED.MD} border border-border px-4 py-2
                  ${TYPOGRAPHY.TEXT_SM} ${TYPOGRAPHY.FONT_MEDIUM} text-text-primary
                  hover:bg-accent-subtle hover:text-accent disabled:opacity-60
                  ${A11Y.FOCUS_RING}`}
              >
                {loadingMore ? "Loading…" : "Load page"}
              </button>
            </div>
          )}
        </>
      )}
    </PageLayout>
  );
};

export default Report;
