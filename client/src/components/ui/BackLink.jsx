import { Link } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { ICON_SIZE, TRANSITION, TYPOGRAPHY } from "../../config/constants";

/**
 * Small reusable back-navigation link with a leading arrow icon.
 * Defaults target the projects list so it can be dropped in with no props.
 *
 * @param {Object} props
 * @param {string} [props.to="/projects"]            - Route to navigate back to.
 * @param {string} [props.label="Back to projects"]  - Link text.
 */
const BackLink = ({ to = "/projects", label = "Back to projects" }) => {
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-1 ${TYPOGRAPHY.TEXT_SM}
        ${TYPOGRAPHY.FONT_MEDIUM} text-text-secondary hover:text-accent
        ${TRANSITION.COLORS}`}
    >
      <ArrowBackIcon sx={{ fontSize: ICON_SIZE.SM }} />
      {label}
    </Link>
  );
};

export default BackLink;
