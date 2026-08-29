import { useEffect, useState } from "react";
import LaunchIcon from "@mui/icons-material/Launch";
import {
  A11Y,
  BORDER,
  ICON_SIZE,
  PREVIEW,
  ROUNDED,
  TYPOGRAPHY,
} from "../../config/constants";

/**
 * Grace period before an iframe that never reported `load` is treated as refused.
 * Deliberately generous — a cold-started free-tier deployment can be slow.
 */
const LOAD_TIMEOUT_MS = 8000;

/**
 * Parse a stored URL and return it only when it is safe to hand to an iframe
 * `src`. Anything unparseable or non-http(s) — a `javascript:` value, say — is
 * rejected so a bad record can never be executed by the embed.
 *
 * @param {string} [url] - Candidate URL, straight from the project record.
 * @returns {URL|null} The parsed URL, or null when it isn't safe to embed.
 */
const parseEmbeddableUrl = (url) => {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    // Only the two web schemes; everything else (javascript:, data:, file:) is out.
    return parsed.protocol === "https:" || parsed.protocol === "http:"
      ? parsed
      : null;
  } catch {
    // Not a valid absolute URL — a relative path, a typo, or leftover whitespace.
    return null;
  }
};

/**
 * Live preview of a deployed project — embeds the site itself in an iframe, the
 * way a deployment platform previews a build. Nothing is stored or uploaded:
 * the project's existing `liveUrl` is the only input.
 *
 * Two shapes, one embed implementation:
 * - full (default) — the detail page panel, with a host/Open strip and a caption.
 * - `compact` — a bare tile for the left half of a ProjectCard. No chrome, no
 *   caption, and pointer-events off so the card's stretched link keeps the click.
 *
 * Whether a cross-origin frame was refused (`X-Frame-Options`, or a CSP
 * `frame-ancestors` directive) is NOT detectable from here. A refused frame and
 * a healthy cross-origin one are identical to script: both fire `load`, both
 * give `contentDocument === null`, and both throw SecurityError on
 * `contentWindow.location` / `.origin`. A refused site therefore renders as a
 * blank frame, which is why the caption below it is always present and the Open
 * link is rendered in every state — the preview is never a mute dead end.
 *
 * The `blocked` state below is a timeout, so it only catches the other failure:
 * a deployment that never responds at all. Deciding embeddability properly needs
 * the server to read the target's response headers.
 *
 * @param {Object}  props
 * @param {string}  [props.url]     - The project's live deployment URL.
 * @param {string}  props.title     - Project title, used for the frame's accessible name.
 * @param {boolean} [props.canEdit] - Whether the viewer is an admin (tailors the empty state).
 * @param {boolean} [props.compact] - Render the bare card tile instead of the full panel.
 */
const LivePreview = ({ url, title, canEdit = false, compact = false }) => {
  const parsed = parseEmbeddableUrl(url);
  const href = parsed?.href ?? null;

  // "loading" until the frame reports load; "blocked" once the timeout wins.
  const [status, setStatus] = useState("loading");

  // Admins can edit liveUrl inline on the detail page, so reset back to the
  // loading state whenever it changes. Adjusting state during render (rather than
  // in an effect) is React's recommended way to reset on a prop change and avoids
  // a cascading-render warning — the same idiom as the slug reset in ProjectDetail.
  const [trackedHref, setTrackedHref] = useState(href);
  if (href !== trackedHref) {
    setTrackedHref(href);
    setStatus("loading");
  }

  // Arm the refused-to-frame fallback for as long as this URL is on screen. The
  // functional update leaves an already-loaded frame alone.
  useEffect(() => {
    if (!href) return;
    const timer = setTimeout(() => {
      setStatus((current) => (current === "loading" ? "blocked" : current));
    }, LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [href]);

  // Trace the fallback separately, so the log stays out of the state updater.
  useEffect(() => {
    if (status === "blocked") {
      console.warn(`[LivePreview] "${href}" never loaded — assuming it refuses framing`);
    }
  }, [status, href]);

  /** Aspect + sizing of the framed box, which differs between the two shapes. */
  const frameClass = compact ? PREVIEW.CARD_FRAME : PREVIEW.FRAME;
  /** Surface styling shared by the frame and the empty-state tile. */
  const panelClass = `${ROUNDED.LG} border ${BORDER.DEFAULT} bg-page-bg`;

  // ── Nothing to embed — no live URL, or one we won't put in an iframe ──
  if (!parsed) {
    const emptyTile = (
      <div
        className={`${frameClass} ${panelClass} flex flex-col items-center
          justify-center gap-1 px-6 text-center`}
      >
        <p className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary`}>
          No live deployment{compact ? "" : " to preview yet."}
        </p>
        {/* Admins get the next step; visitors don't need to know about it. The
            card tile is too small for the hint, and its own detail page has it. */}
        {canEdit && !compact && (
          <p className={`${TYPOGRAPHY.TEXT_XS} text-text-secondary`}>
            Add a Live URL below and it will show up here.
          </p>
        )}
      </div>
    );
    return compact ? (
      emptyTile
    ) : (
      <section className={`mb-6 ${PREVIEW.MAX_W}`}>{emptyTile}</section>
    );
  }

  /** Shared styling for the Open-in-new-tab anchor, which appears in every state. */
  const openLinkClass = `inline-flex items-center gap-1 shrink-0 ${TYPOGRAPHY.TEXT_SM}
    ${TYPOGRAPHY.FONT_MEDIUM} text-accent hover:underline ${ROUNDED.SM} ${A11Y.FOCUS_RING}`;

  // ── Frame — the embedded site, or a message when it refuses to be framed ──
  const frame = (
    <div className={`relative ${frameClass} ${panelClass}`}>
      {status === "blocked" ? (
        // Refused (or simply never responded) — say so and hand over the link.
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
          <p className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary`}>
            This site can’t be embedded here.
          </p>
          {/* Omitted in a card: the whole card is already one link, and this tile
              has pointer-events off, so a nested anchor would be unreachable. */}
          {!compact && (
            <a
              href={parsed.href}
              target="_blank"
              rel="noopener noreferrer"
              className={openLinkClass}
            >
              <LaunchIcon sx={{ fontSize: ICON_SIZE.SM }} />
              Open {parsed.host}
            </a>
          )}
        </div>
      ) : (
        <>
          {/* `key` forces a fresh frame when an admin edits the URL, rather
              than letting the old document linger through the src swap. */}
          <iframe
            key={parsed.href}
            src={parsed.href}
            title={`Live preview of ${title}`}
            loading="lazy"
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            onLoad={() => setStatus("ready")}
            className={PREVIEW.IFRAME}
          />

          {/* Cover the frame while it boots so visitors don't stare at white. */}
          {status === "loading" && (
            <div className="absolute inset-0 flex items-center justify-center bg-page-bg">
              <p className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary`}>
                Loading preview…
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );

  // ── Card variant — a bare tile; the card supplies its own title and links ──
  if (compact) return frame;

  return (
    <section className={`mb-6 ${PREVIEW.MAX_W}`}>
      {/* ── Chrome strip — host on the left, escape hatch on the right ── */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className={`${TYPOGRAPHY.TEXT_XS} text-text-secondary truncate`}>
          {parsed.host}
        </span>
        <a
          href={parsed.href}
          target="_blank"
          rel="noopener noreferrer"
          className={openLinkClass}
        >
          <LaunchIcon sx={{ fontSize: ICON_SIZE.SM }} />
          Open
        </a>
      </div>

      {frame}

      {/* Always present: a blank frame is indistinguishable from a working one
          in script, so the explanation can't be conditional. */}
      <p className={`${TYPOGRAPHY.TEXT_XS} text-text-secondary mt-2`}>
        Preview blank? Some sites don’t allow being embedded — open it directly.
      </p>
    </section>
  );
};

export default LivePreview;
