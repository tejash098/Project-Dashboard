import { useEffect } from "react";
import { createPortal } from "react-dom";
import CloseIcon from "@mui/icons-material/Close";
import { Z_INDEX, A11Y, ICON_SIZE } from "../../config/constants";

/**
 * Full-screen image lightbox rendered via a portal to `document.body` so it
 * escapes any overflow/stacking context and overlays the whole app (above the
 * Modal/toasts). The image is `object-contain` and capped to the viewport, so it
 * stays fully visible on any device. Click anywhere or press Esc to close.
 *
 * @param {Object} props
 * @param {boolean} props.open - Whether the lightbox is visible.
 * @param {string} props.src - Image URL to display.
 * @param {string} [props.alt] - Accessible alt text for the image.
 * @param {() => void} props.onClose - Called on backdrop click, close button, or Esc.
 */
const ImageLightbox = ({ open, src, alt = "", onClose }) => {
  // Close on Escape while open.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !src) return null;

  return createPortal(
    // Dimmed backdrop — clicking anywhere closes the lightbox.
    <div
      className={`fixed inset-0 ${Z_INDEX.LIGHTBOX} flex items-center justify-center
        bg-black/80 p-4`}
      onClick={onClose}
    >
      {/* Close button, pinned top-right. */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close image"
        className={`absolute top-4 right-4 p-1 rounded text-white/80
          hover:text-white ${A11Y.FOCUS_RING}`}
      >
        <CloseIcon sx={{ fontSize: ICON_SIZE.LG }} />
      </button>

      {/* Image — contained within the viewport; stop propagation so a click on
          the image itself doesn't immediately close it. */}
      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] max-w-[95vw] object-contain rounded-lg"
      />
    </div>,
    document.body,
  );
};

export default ImageLightbox;
