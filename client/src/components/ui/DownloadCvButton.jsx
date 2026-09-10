import DownloadIcon from "@mui/icons-material/Download";
// Bundled résumé — Vite resolves the import to a served asset URL.
import tejashCV from "../../assets/Tejash_CV.pdf";
import {
  A11Y,
  BORDER,
  ICON_SIZE,
  ROUNDED,
  TYPOGRAPHY,
} from "../../config/constants";

/** File name the browser saves the résumé as. */
const CV_FILENAME = "Tejash_CV.pdf";

/**
 * Outlined "Download CV" button that downloads the bundled résumé directly
 * (the `download` attribute forces a save instead of opening the PDF).
 * Shared by the landing hero and the About page header so the asset import
 * and the markup live in one place.
 */
const DownloadCvButton = () => (
  <a
    href={tejashCV}
    download={CV_FILENAME}
    // Styled to match the docs "Copy page" button (outlined, accent hover).
    className={`inline-flex items-center gap-1.5 ${ROUNDED.MD} border ${BORDER.DEFAULT}
      px-3 py-1.5 ${TYPOGRAPHY.TEXT_SM} ${TYPOGRAPHY.FONT_MEDIUM} text-text-secondary
      hover:bg-accent-subtle hover:text-accent ${A11Y.FOCUS_RING}`}
  >
    <DownloadIcon sx={{ fontSize: ICON_SIZE.SM }} />
    Download CV
  </a>
);

export default DownloadCvButton;
