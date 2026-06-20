import { useState, useRef, useEffect } from "react";
import LogoutIcon from "@mui/icons-material/Logout";
import LoginIcon from "@mui/icons-material/Login";
import { useAuth } from "../../hooks/useAuth";
import LoginModal from "./LoginModal";
import {
  ROUNDED,
  TYPOGRAPHY,
  A11Y,
  FLEX,
  ICON_SIZE,
} from "../../config/constants";

/**
 * TopBar account control.
 *  - Admin: a circular avatar (first letter of the username) that toggles a
 *    popover with the admin's name/email/role and a Logout action.
 *  - Visitor: a "Sign in" button that opens the login modal — the persistent
 *    way to switch from visitor to admin after the gateway has been dismissed.
 *
 * The popover closes on Escape or an outside click.
 */
const ProfileMenu = () => {
  const { isAdmin, admin, logout } = useAuth();

  const [open, setOpen] = useState(false); // popover visibility (admin)
  const [loginOpen, setLoginOpen] = useState(false); // login modal (visitor)
  const containerRef = useRef(null);

  // Close the popover on an outside click or Escape.
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

  // ── Visitor — a Sign in button that opens the login modal ──
  if (!isAdmin) {
    return (
      <>
        <button
          type="button"
          onClick={() => {
            console.log("[ProfileMenu] visitor opened login");
            setLoginOpen(true);
          }}
          className={`${FLEX.CENTER} gap-1.5 ${ROUNDED.MD} px-3 py-1.5
            ${TYPOGRAPHY.TEXT_SM} ${TYPOGRAPHY.FONT_MEDIUM} text-text-secondary
            hover:bg-accent-subtle hover:text-accent ${A11Y.FOCUS_RING}`}
        >
          <LoginIcon sx={{ fontSize: ICON_SIZE.SM }} />
          Sign in
        </button>
        <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      </>
    );
  }

  // First letter of the username for the avatar (fallback "A").
  const initial = (admin?.username?.[0] ?? "A").toUpperCase();

  // ── Admin — avatar + details popover ──
  return (
    <div ref={containerRef} className="relative">
      {/* Avatar toggle */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Account menu"
        className={`${FLEX.CENTER_JUSTIFY} h-8 w-8 ${ROUNDED.FULL}
          bg-accent ${TYPOGRAPHY.TEXT_SM} ${TYPOGRAPHY.FONT_SEMIBOLD} text-white
          hover:opacity-90 ${A11Y.FOCUS_RING}`}
      >
        {initial}
      </button>

      {/* Details popover */}
      {open && (
        <div
          role="menu"
          className={`absolute right-0 mt-2 w-56 ${ROUNDED.MD} border border-border
            bg-surface p-4 shadow-lg z-50`}
        >
          {/* Identity block */}
          <p className={`${TYPOGRAPHY.TEXT_SM} ${TYPOGRAPHY.FONT_SEMIBOLD} text-text-primary`}>
            {admin?.fullName || admin?.username}
          </p>
          {admin?.email && (
            <p className={`${TYPOGRAPHY.TEXT_XS} text-text-secondary mt-0.5 break-all`}>
              {admin.email}
            </p>
          )}
          <span
            className={`inline-block mt-2 ${ROUNDED.FULL} bg-accent-subtle px-2 py-0.5
              ${TYPOGRAPHY.TEXT_XS} ${TYPOGRAPHY.FONT_MEDIUM} text-accent`}
          >
            {admin?.role}
          </span>

          {/* Logout */}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className={`mt-4 w-full ${FLEX.CENTER} gap-2 ${ROUNDED.MD}
              border border-border px-3 py-2 ${TYPOGRAPHY.TEXT_SM} text-text-secondary
              hover:bg-accent-subtle hover:text-accent ${A11Y.FOCUS_RING}`}
          >
            <LogoutIcon sx={{ fontSize: ICON_SIZE.SM }} />
            Log out
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;
