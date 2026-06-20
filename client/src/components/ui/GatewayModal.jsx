import Modal from "./Modal";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import {
  ROUNDED,
  TYPOGRAPHY,
  A11Y,
  WIDTH,
  ICON_SIZE,
} from "../../config/constants";

/**
 * Gateway chooser shown when a visitor first opens the Projects page. Offers two
 * paths: browse read-only as a visitor, or authenticate as an admin.
 *
 * @param {Object} props
 * @param {boolean} props.open - Whether the modal is visible.
 * @param {() => void} props.onVisitor - Chose "View as Visitor".
 * @param {() => void} props.onAdmin - Chose "View as Admin" (opens login).
 * @param {() => void} props.onClose - Dismiss without choosing (Esc/backdrop).
 */
const GatewayModal = ({ open, onVisitor, onAdmin, onClose }) => {
  return (
    <Modal open={open} onClose={onClose} title="How do you want to view?">
      <p className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary mb-4`}>
        Browse projects read-only, or sign in as an admin to edit them.
      </p>

      <div className="flex flex-col gap-3">
        {/* Visitor — read-only, the current default experience. */}
        <button
          type="button"
          onClick={onVisitor}
          className={`${WIDTH.FULL} flex items-center gap-3 ${ROUNDED.MD}
            border border-border bg-page-bg px-4 py-3 text-left
            hover:border-accent ${A11Y.FOCUS_RING}`}
        >
          <VisibilityIcon sx={{ fontSize: ICON_SIZE.LG }} className="text-text-secondary" />
          <span className="flex flex-col">
            <span className={`${TYPOGRAPHY.TEXT_SM} ${TYPOGRAPHY.FONT_SEMIBOLD} text-text-primary`}>
              View as Visitor
            </span>
            <span className={`${TYPOGRAPHY.TEXT_XS} text-text-secondary`}>
              Browse projects without editing.
            </span>
          </span>
        </button>

        {/* Admin — opens the login modal. */}
        <button
          type="button"
          onClick={onAdmin}
          className={`${WIDTH.FULL} flex items-center gap-3 ${ROUNDED.MD}
            border border-border bg-page-bg px-4 py-3 text-left
            hover:border-accent ${A11Y.FOCUS_RING}`}
        >
          <AdminPanelSettingsIcon sx={{ fontSize: ICON_SIZE.LG }} className="text-accent" />
          <span className="flex flex-col">
            <span className={`${TYPOGRAPHY.TEXT_SM} ${TYPOGRAPHY.FONT_SEMIBOLD} text-text-primary`}>
              View as Admin
            </span>
            <span className={`${TYPOGRAPHY.TEXT_XS} text-text-secondary`}>
              Sign in to edit project details.
            </span>
          </span>
        </button>
      </div>
    </Modal>
  );
};

export default GatewayModal;
