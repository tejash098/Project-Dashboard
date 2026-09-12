import { Link } from "react-router-dom";
import ApiIcon from "@mui/icons-material/Api";
import {
  A11Y,
  BORDER,
  ICON_SIZE,
  ROUNDED,
  TYPOGRAPHY,
} from "../../config/constants";

/**
 * Outlined "Try in Swagger UI" button that opens the interactive API reference.
 * Sits beside `CopyPageMenu` in the Docs page header and shares its outlined,
 * accent-hover styling so the two read as one action group.
 *
 * @param {Object} props
 * @param {string} [props.to="/docs/swagger"] - Route of the Swagger UI view.
 */
const SwaggerUiButton = ({ to = "/docs/swagger" }) => (
  <Link
    to={to}
    // Styled to match the docs "Copy page" button (outlined, accent hover).
    className={`inline-flex items-center gap-1.5 ${ROUNDED.MD} border ${BORDER.DEFAULT}
      px-3 py-1.5 ${TYPOGRAPHY.TEXT_SM} ${TYPOGRAPHY.FONT_MEDIUM} text-text-secondary
      hover:bg-accent-subtle hover:text-accent ${A11Y.FOCUS_RING}`}
  >
    <ApiIcon sx={{ fontSize: ICON_SIZE.SM }} />
    Try in Swagger UI
  </Link>
);

export default SwaggerUiButton;
