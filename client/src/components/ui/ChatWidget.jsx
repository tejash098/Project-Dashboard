import { useEffect, useRef, useState } from "react";
import ChatOutlinedIcon from "@mui/icons-material/ChatOutlined";
import CloseIcon from "@mui/icons-material/Close";
import { useChat } from "../../hooks/useChat";
import { CHAT_GREETING } from "../../data/chatStarters";
import ChatMessageList from "./ChatMessageList";
import ChatSuggestions from "./ChatSuggestions";
import ChatComposer from "./ChatComposer";
import {
  A11Y,
  CHAT,
  FLEX,
  ICON_SIZE,
  ROUNDED,
  TRANSITION,
  TYPOGRAPHY,
  Z_INDEX,
} from "../../config/constants";

const PANEL_ID = "chat-panel";
const TITLE_ID = "chat-panel-title";

/**
 * Floating assistant — a launcher pinned to the bottom-right corner that toggles
 * a chat panel answering questions about Tejash and this dashboard.
 *
 * Rendered once inside `AppShell`, so it appears on every route. `AppShell`
 * itself sits outside `<Routes>`, which is what makes the conversation survive
 * navigation and reset only on a full reload — the intended lifetime, and the
 * reason no context provider is needed for a single consumer.
 *
 * Uses `position: fixed`, so its place in the tree affects only stacking, not
 * layout. It is mounted after FeedbackWidget and shares that widget's z-40, so
 * an open panel paints over the feedback pull-tab on shorter viewports —
 * deliberate: an open panel legitimately owns that space, and the tab is
 * reachable again the moment it closes.
 */
const ChatWidget = () => {
  const { messages, suggestions, pending, send } = useChat();
  const [open, setOpen] = useState(false);

  const fabRef = useRef(null);
  // Only pull focus back if this close follows an open — otherwise the very
  // first render would steal focus from whatever the page had.
  const openedOnce = useRef(false);

  // Close on Escape while open (the × button is the pointer affordance).
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Focus follows the panel: the composer autofocuses on open, and closing
  // returns focus to the launcher that opened it.
  useEffect(() => {
    if (open) {
      openedOnce.current = true;
      return;
    }
    if (openedOnce.current) fabRef.current?.focus();
  }, [open]);

  return (
    <>
      {/* ── Launcher — before the panel in the DOM, so tab order runs from the
          control to the thing it controls ── */}
      <button
        ref={fabRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={PANEL_ID}
        // Deliberately a stable name rather than one that flips to "Close…":
        // aria-expanded already conveys the state, and a second control named
        // "Close the assistant" (the panel's ×) would otherwise be
        // indistinguishable from this one in a screen reader's element list.
        aria-label="Ask the assistant"
        className={`${CHAT.FAB} ${Z_INDEX.DRAWER} ${FLEX.CENTER_JUSTIFY}
          ${ROUNDED.FULL} bg-accent text-white shadow-lg hover:opacity-90
          ${TRANSITION.COLORS} ${A11Y.FOCUS_RING} ${A11Y.MOTION_SAFE}`}
      >
        {open ? (
          <CloseIcon sx={{ fontSize: ICON_SIZE.LG }} />
        ) : (
          <ChatOutlinedIcon sx={{ fontSize: ICON_SIZE.LG }} />
        )}
      </button>

      {/* ── Panel — non-modal by design: no aria-modal, no focus trap and no
          backdrop, because the whole point is asking about the page you can
          still see and scroll behind it. Modal.jsx owns the modal case. ── */}
      {open && (
        <div
          id={PANEL_ID}
          role="dialog"
          aria-labelledby={TITLE_ID}
          className={`${CHAT.PANEL} ${Z_INDEX.DRAWER} ${ROUNDED.LG}
            border border-border bg-surface shadow-lg`}
        >
          {/* ── Header — the dialog's accessible name, with the close control
             on the right. Escape and the launcher below also close. ── */}
          <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
            <h2
              id={TITLE_ID}
              className={`${TYPOGRAPHY.TEXT_SM} ${TYPOGRAPHY.FONT_SEMIBOLD} text-text-primary`}
            >
              Ask about Tejash
            </h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close the assistant"
              className={`${ROUNDED.MD} p-0.5 text-text-secondary
                hover:bg-accent-subtle hover:text-accent
                ${TRANSITION.COLORS} ${A11Y.FOCUS_RING}`}
            >
              <CloseIcon sx={{ fontSize: ICON_SIZE.MD }} />
            </button>
          </div>

          <ChatMessageList
            messages={messages}
            pending={pending}
            greeting={CHAT_GREETING}
          />

          <ChatSuggestions
            questions={suggestions}
            disabled={pending}
            onSelect={send}
          />

          <ChatComposer pending={pending} onSend={send} />
        </div>
      )}
    </>
  );
};

export default ChatWidget;
