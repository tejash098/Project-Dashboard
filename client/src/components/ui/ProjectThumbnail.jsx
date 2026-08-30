import { useState } from "react";
import { BORDER, PREVIEW, ROUNDED, TYPOGRAPHY } from "../../config/constants";

/**
 * Static preview image for a project card — the stored screenshot of the
 * deployed site, captured server-side and served from our own Cloudinary.
 *
 * Deliberately an `<img>`, not an embed: a card should show a picture of the
 * site, not run it. The frame carries `pointer-events-none` (see
 * PREVIEW.CARD_FRAME) so the card's stretched link keeps receiving the click.
 * The live, interactive embed lives on the project's detail page instead.
 *
 * @param {Object} props
 * @param {string} [props.imageUrl] - Cloudinary URL of the captured screenshot.
 * @param {string} props.title - Project title, used for the image's alt text.
 */
const ProjectThumbnail = ({ imageUrl, title }) => {
  // A stored URL whose asset has since been removed would otherwise render as a
  // broken-image icon; fall back to the placeholder instead.
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(imageUrl) && !failed;

  return (
    <div
      className={`${PREVIEW.CARD_FRAME} ${ROUNDED.LG} border ${BORDER.DEFAULT}
        bg-page-bg ${showImage ? "" : "flex items-center justify-center"}`}
    >
      {showImage ? (
        // `object-top` anchors the crop to the top of the page, the way a
        // deployment thumbnail reads.
        <img
          src={imageUrl}
          alt={`Screenshot of ${title}`}
          loading="lazy"
          draggable={false}
          onError={() => setFailed(true)}
          className={PREVIEW.THUMB_IMG}
        />
      ) : (
        // Covers both "no live URL to capture" and "capture hasn't run yet".
        <p className={`${TYPOGRAPHY.TEXT_SM} text-text-secondary px-6 text-center`}>
          No preview yet
        </p>
      )}
    </div>
  );
};

export default ProjectThumbnail;
