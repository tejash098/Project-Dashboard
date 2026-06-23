/**
 * Feedback triage statuses and sort options — the single source of truth shared
 * by the Report list filter, the detail-page status selector, and the sort menu.
 * The values mirror the `status` enum on the server's Feedback model and the
 * `?sort=` keys the feedback list endpoint accepts.
 */

/** Selectable statuses (value matches the Feedback model enum). */
export const FEEDBACK_STATUSES = [
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "onhold", label: "On hold" },
];

/** Status filter tabs for the Report list — "All" plus each status. */
export const FEEDBACK_STATUS_FILTERS = [
  { value: "all", label: "All" },
  ...FEEDBACK_STATUSES,
];

/** Sort options for the Report list (value = the API `?sort=` key). */
export const FEEDBACK_SORTS = [
  { value: "-creation_time", label: "Newest first" },
  { value: "creation_time", label: "Oldest first" },
  { value: "-updation_time", label: "Recently updated" },
  { value: "updation_time", label: "Least recently updated" },
];
