import { Link } from "react-router-dom";
import { TYPOGRAPHY, FLEX, ROUNDED, A11Y } from "../../config/constants";
import { cloudinary, CLOUDINARY_ASSETS } from "../../config/cloudinary";

/**
 * Brand logo URL. Cloudinary transformation (`f_auto,q_auto,w_128,h_128,c_fit`)
 * serves an optimized ~128px asset instead of the full 500px original — crisp
 * at the 28–32px sizes we render, with a much smaller download.
 */
const LOGO_URL = cloudinary(
  CLOUDINARY_ASSETS.primaryLogo,
  "f_auto,q_auto,w_128,h_128,c_fit",
);

/**
 * Brand lockup — the square logo mark, optionally paired with the
 * "Project Dashboard" wordmark, wrapped in a home link. Shared by the sidebar
 * header and the mobile top bar so the brand stays consistent everywhere.
 *
 * @param {Object} props
 * @param {boolean} [props.showWordmark] - Render the "Project Dashboard" text
 *   beside the mark (used in the expanded sidebar). Defaults to false.
 * @param {number} [props.size] - Mark width/height in pixels. Defaults to 28.
 * @param {() => void} [props.onClick] - Optional click handler (e.g. close the
 *   mobile drawer after navigating home).
 * @param {string} [props.className] - Extra classes for the link wrapper.
 */
const Logo = ({ showWordmark = false, size = 28, onClick, className = "" }) => (
  <Link
    to="/"
    onClick={onClick}
    aria-label="Project Dashboard — home"
    className={`${FLEX.CENTER} gap-2 ${ROUNDED.MD} ${A11Y.FOCUS_RING} ${className}`}
  >
    <img
      src={LOGO_URL}
      alt="Project Dashboard"
      width={size}
      height={size}
      loading="eager"
      className="shrink-0"
    />
    {showWordmark && (
      <span
        className={`${TYPOGRAPHY.TEXT_SM} ${TYPOGRAPHY.FONT_SEMIBOLD}
          text-text-primary whitespace-nowrap`}
      >
        Project Dashboard
      </span>
    )}
  </Link>
);

export default Logo;
