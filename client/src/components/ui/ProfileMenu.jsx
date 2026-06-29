import { useState, useRef, useEffect } from "react";
import LogoutIcon from "@mui/icons-material/Logout";
import LoginIcon from "@mui/icons-material/Login";
import EditIcon from "@mui/icons-material/Edit";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import LoginModal from "./LoginModal";
import AdminFormModal from "./AdminFormModal";
import {
  ROUNDED,
  TYPOGRAPHY,
  A11Y,
  FLEX,
  ICON_SIZE,
} from "../../config/constants";

/**
 * Account control (lives in the sidebar bottom section).
 *  - Admin: a circular avatar (first letter of the username) that toggles a
 *    popover with the admin's name/email/role and a Logout action.
 *  - Visitor: a "Sign in" button that opens the login modal — the persistent
 *    way to switch from visitor to admin after the gateway has been dismissed.
 *
 * The popover closes on Escape or an outside click.
 *
 * @param {Object} props
 * @param {boolean} [props.compact] - When true (collapsed sidebar) the visitor
 *   control renders icon-only; expanded shows the "Sign in" label too.
 * @param {"sidebar"|"topbar"} [props.placement] - "sidebar" opens the admin
 *   popover upward (it sits at the bottom of the layout); "topbar" keeps the
 *   legacy downward placement.
 */
const ProfileMenu = ({ compact = false, placement = "topbar" }) => {
  const { isAdmin, admin, logout, applyAdmin } = useAuth();
  const { addToast } = useToast();

  const [open, setOpen] = useState(false); // popover visibility (admin)
  const [loginOpen, setLoginOpen] = useState(false); // login modal (visitor)
  // Admin create/edit modal: null = closed, "create" or "edit" = open in that mode.
  const [formMode, setFormMode] = useState(null);
  const containerRef = useRef(null);

  /**
   * After a successful create/edit, refresh the popover when the saved admin is
   * the one currently logged in (i.e. a self-edit). A newly created admin has a
   * different id, so it leaves the current session untouched.
   * @param {Object} saved - The created/updated admin returned by the API.
   */
  const handleFormSuccess = (saved) => {
    if (saved?._id === admin?._id) applyAdmin(saved);
  };

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
          // Compact (collapsed sidebar) → icon-only; otherwise icon + label.
          title={compact ? "Sign in" : undefined}
          aria-label={compact ? "Sign in" : undefined}
          className={`${FLEX.CENTER} ${compact ? "p-2" : "gap-1.5 px-3 py-1.5"} ${ROUNDED.MD}
            ${TYPOGRAPHY.TEXT_SM} ${TYPOGRAPHY.FONT_MEDIUM} text-text-secondary
            hover:bg-accent-subtle hover:text-accent ${A11Y.FOCUS_RING}`}
        >
          <LoginIcon sx={{ fontSize: ICON_SIZE.SM }} />
          {!compact && "Sign in"}
        </button>
        <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      </>
    );
  }

  // First letter of the username for the avatar (fallback "A").
  const initial = (admin?.fullName?.[0] ?? "A").toUpperCase();

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

      {/* Details popover — opens upward from the sidebar bottom, or downward
          in the legacy topbar placement. */}
      {open && (
        <div
          role="menu"
          className={`absolute left-0 w-56 ${ROUNDED.MD} border border-border
            bg-surface p-4 shadow-lg z-50
            ${placement === "sidebar" ? "bottom-full mb-2" : "right-0 left-auto mt-2"}`}
        >
          {/* Identity block — name/email on the left, an edit affordance on the
              right that opens the form pre-filled to edit this admin. */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className={`${TYPOGRAPHY.TEXT_SM} ${TYPOGRAPHY.FONT_SEMIBOLD} text-text-primary`}>
                {admin?.fullName || admin?.username}
              </p>
              {admin?.email && (
                <p className={`${TYPOGRAPHY.TEXT_XS} text-text-secondary mt-0.5 break-all`}>
                  {admin.email}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setFormMode("edit");
              }}
              aria-label="Edit profile"
              title="Edit profile"
              className={`shrink-0 p-1 ${ROUNDED.SM} text-text-secondary
                hover:bg-accent-subtle hover:text-accent ${A11Y.FOCUS_RING}`}
            >
              <EditIcon sx={{ fontSize: ICON_SIZE.SM }} />
            </button>
          </div>
          <span
            className={`inline-block mt-2 ${ROUNDED.FULL} bg-accent-subtle px-2 py-0.5
              ${TYPOGRAPHY.TEXT_XS} ${TYPOGRAPHY.FONT_MEDIUM} text-accent`}
          >
            {admin?.role}
          </span>

          {/* Add admin — opens the form blank to create another admin. */}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setFormMode("create");
            }}
            className={`mt-4 w-full ${FLEX.CENTER} gap-2 ${ROUNDED.MD}
              border border-border px-3 py-2 ${TYPOGRAPHY.TEXT_SM} text-text-secondary
              hover:bg-accent-subtle hover:text-accent ${A11Y.FOCUS_RING}`}
          >
            <PersonAddIcon sx={{ fontSize: ICON_SIZE.SM }} />
            Add admin
          </button>

          {/* Logout */}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              logout();
              // Confirm the sign-out with a toast.
              addToast({ type: "success", message: "Logged out successfully" });
            }}
            className={`mt-2 w-full ${FLEX.CENTER} gap-2 ${ROUNDED.MD}
              border border-border px-3 py-2 ${TYPOGRAPHY.TEXT_SM} text-text-secondary
              hover:bg-accent-subtle hover:text-accent ${A11Y.FOCUS_RING}`}
          >
            <LogoutIcon sx={{ fontSize: ICON_SIZE.SM }} />
            Log out
          </button>
        </div>
      )}

      {/* Create/edit admin modal — shared by the "Add admin" button and the
          profile edit icon; mode drives the title, fields, and API call. */}
      <AdminFormModal
        key={`${formMode ?? "closed"}-${admin?._id ?? ""}`}
        open={formMode !== null}
        mode={formMode === "edit" ? "edit" : "create"}
        admin={admin}
        onClose={() => setFormMode(null)}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
};

export default ProfileMenu;
