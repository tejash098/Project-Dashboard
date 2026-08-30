import cloudinary from "../config/cloudinary.js";
import config from "../config/env.js";

/**
 * Capture a screenshot of a project's live site and store it on Cloudinary.
 *
 * Mirrors how a deployment platform builds its dashboard thumbnails: capture
 * once, keep the image, serve the stored copy. Microlink runs the headless
 * browser (so this server needs no Chromium and no extra memory), but the
 * result is uploaded to our own Cloudinary — after this returns, nothing about
 * rendering the thumbnail depends on a third party.
 *
 * The Cloudinary upload is handed Microlink's URL directly rather than a
 * buffer: Cloudinary fetches remote URLs itself, so the image never streams
 * through this process and there is no upload size limit to work around.
 *
 * @param {string} liveUrl - The project's deployed URL to capture.
 * @returns {Promise<{ secure_url: string, public_id: string }>} The hosted screenshot and its public_id.
 * @throws {Error} When Microlink fails, returns no screenshot, or the upload fails.
 */
export const captureProjectPreview = async (liveUrl) => {
  const { width, height } = config.previewViewport;
  const query = new URLSearchParams({
    url: liveUrl,
    screenshot: "true",
    meta: "false", // we only want the image, not the page metadata
    "viewport.width": String(width),
    "viewport.height": String(height),
  });

  console.log(`[preview] capturing "${liveUrl}" at ${width}x${height}…`);
  const response = await fetch(`${config.microlinkApiBase}/?${query}`, {
    // The key is optional — omit the header entirely when it isn't configured.
    headers: config.microlinkApiKey ? { "x-api-key": config.microlinkApiKey } : {},
  });

  // A non-2xx here is usually the daily quota or a target the browser couldn't
  // reach; both are worth surfacing verbatim to the caller's log.
  if (!response.ok) {
    throw new Error(`Screenshot service returned ${response.status}`);
  }

  const body = await response.json();
  const screenshotUrl = body?.data?.screenshot?.url;
  if (body?.status !== "success" || !screenshotUrl) {
    throw new Error(`Screenshot service returned no image for "${liveUrl}"`);
  }

  const { secure_url, public_id } = await cloudinary.uploader.upload(screenshotUrl, {
    folder: config.previewFolder,
  });
  console.log(`[preview] stored → ${secure_url}`);
  return { secure_url, public_id };
};
