import { useState, useRef, useEffect } from "react";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import DescriptionIcon from "@mui/icons-material/Description";
import ApiIcon from "@mui/icons-material/Api";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useToast } from "../../hooks/useToast";
import {
  A11Y,
  BORDER,
  FLEX,
  ICON_SIZE,
  ROUNDED,
  TYPOGRAPHY,
  Z_INDEX,
} from "../../config/constants";

/**
 * AI assistants the dropdown can hand the page off to. Each entry builds a
 * deep-link that opens the provider with a prompt already typed in. Adding a
 * provider is a data change here, not a JSX change.
 *
 * @type {Array<{ id: string, label: string, buildUrl: (prompt: string) => string }>}
 */
const AI_TARGETS = [
  {
    id: "chatgpt",
    label: "Open in ChatGPT",
    buildUrl: (prompt) =>
      `https://chatgpt.com/?hints=search&q=${encodeURIComponent(prompt)}`,
  },
  {
    id: "claude",
    label: "Open in Claude",
    buildUrl: (prompt) =>
      `https://claude.ai/new?q=${encodeURIComponent(prompt)}`,
  },
  {
    id: "perplexity",
    label: "Open in Perplexity",
    buildUrl: (prompt) =>
      `https://www.perplexity.ai/search?q=${encodeURIComponent(prompt)}`,
  },
  {
    id: "gemini",
    label: "Open in Gemini",
    buildUrl: (prompt) =>
      `https://gemini.google.com/app?q=${encodeURIComponent(prompt)}`,
  },
];

// Shared styling for every row inside the dropdown menu.
const ITEM_CLASS = `w-full ${FLEX.CENTER} gap-2 ${ROUNDED.MD} px-3 py-2 text-left
  ${TYPOGRAPHY.TEXT_SM} text-text-secondary
  hover:bg-accent-subtle hover:text-accent ${A11Y.FOCUS_RING}`;

/**
 * "Copy page" split button with an AI hand-off dropdown — the docs-site pattern
 * for grabbing a page as Markdown and dropping it into an LLM.
 *
 * The left segment copies the Markdown to the clipboard (confirmed via a
 * toast); the attached chevron opens a menu to view the raw Markdown or open
 * the page in ChatGPT / Claude / Perplexity / Gemini with a pre-filled prompt.
 * The menu closes on Escape or an outside click (mirrors `ProfileMenu`).
 *
 * @param {Object} props
 * @param {string} props.markdown    - Rendered Markdown copied to the clipboard.
 * @param {string} props.markdownUrl - Public URL of the `.md` the AI prompt
 *   tells the assistant to read; also the target of "View as Markdown".
 * @param {string} [props.swaggerUrl] - Optional route/URL for an interactive
 *   Swagger UI view; when set, adds a "View in Swagger UI" menu item.
 */
const CopyPageMenu = ({ markdown, markdownUrl, swaggerUrl }) => {
  const { addToast } = useToast();
  const [open, setOpen] = useState(false); // dropdown visibility
  const containerRef = useRef(null);

  // The prompt every AI link pre-fills — points the assistant at the raw .md.
  const prompt = `Read ${markdownUrl} and walk me through it step by step`;

  // Close the menu on an outside click or Escape (same pattern as ProfileMenu).
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      if (!containerRef.current?.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  /** Copy the Markdown to the clipboard and confirm with a toast. */
  const handleCopy = async () => {
    setOpen(false);
    try {
      await navigator.clipboard.writeText(markdown);
      addToast({ type: "success", message: "Copied to clipboard" });
    } catch {
      // Clipboard can be blocked (insecure context or denied permission).
      addToast({ type: "error", message: "Couldn’t copy to clipboard" });
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* ── Split button — copy on the left, dropdown toggle on the right ── */}
      <div
        className={`inline-flex items-stretch ${ROUNDED.MD} border ${BORDER.DEFAULT}
          overflow-hidden`}
      >
        {/* Primary action — copy the page as Markdown. */}
        <button
          type="button"
          onClick={handleCopy}
          className={`${FLEX.CENTER} gap-1.5 px-3 py-1.5
            ${TYPOGRAPHY.TEXT_SM} ${TYPOGRAPHY.FONT_MEDIUM} text-text-secondary
            hover:bg-accent-subtle hover:text-accent ${A11Y.FOCUS_RING}`}
        >
          <ContentCopyIcon sx={{ fontSize: ICON_SIZE.SM }} />
          Copy page
        </button>

        {/* Dropdown toggle — divided from the copy action by a left border. */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="true"
          aria-expanded={open}
          aria-label="More copy options"
          className={`${FLEX.CENTER_JUSTIFY} px-1.5 border-l ${BORDER.DEFAULT}
            text-text-secondary hover:bg-accent-subtle hover:text-accent
            ${A11Y.FOCUS_RING}`}
        >
          <KeyboardArrowDownIcon sx={{ fontSize: ICON_SIZE.MD }} />
        </button>
      </div>

      {/* ── Dropdown — copy / view / AI hand-offs ── */}
      {open && (
        <div
          role="menu"
          className={`absolute right-0 mt-2 w-60 ${ROUNDED.MD} border ${BORDER.DEFAULT}
            bg-surface p-1 shadow-lg ${Z_INDEX.MODAL}`}
        >
          {/* Copy page — duplicated here for discoverability. */}
          <button
            type="button"
            role="menuitem"
            onClick={handleCopy}
            className={ITEM_CLASS}
          >
            <ContentCopyIcon sx={{ fontSize: ICON_SIZE.SM }} />
            Copy page
          </button>

          {/* View the raw Markdown the assistants will read. */}
          <a
            role="menuitem"
            href={markdownUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className={ITEM_CLASS}
          >
            <DescriptionIcon sx={{ fontSize: ICON_SIZE.SM }} />
            View as Markdown
          </a>

          {/* Interactive Swagger UI view — only when a target is provided. */}
          {swaggerUrl && (
            <a
              role="menuitem"
              href={swaggerUrl}
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className={ITEM_CLASS}
            >
              <ApiIcon sx={{ fontSize: ICON_SIZE.SM }} />
              View in Swagger UI
            </a>
          )}

          {/* Divider between local actions and the AI hand-offs. */}
          <div className={`my-1 border-t ${BORDER.DEFAULT}`} />

          {/* One row per AI provider, each opening with the pre-filled prompt. */}
          {AI_TARGETS.map(({ id, label, buildUrl }) => (
            <a
              key={id}
              role="menuitem"
              href={buildUrl(prompt)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className={ITEM_CLASS}
            >
              <OpenInNewIcon sx={{ fontSize: ICON_SIZE.SM }} />
              {label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default CopyPageMenu;
