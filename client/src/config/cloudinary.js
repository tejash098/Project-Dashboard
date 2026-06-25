/**
 * Cloudinary asset configuration.
 * Single source of truth for the Cloudinary cloud, every hosted image's
 * trailing path, and a URL builder. Components import the asset path they need
 * and build a delivery URL via `cloudinary()` — update a path here and every
 * consumer follows.
 */

/** Cloudinary delivery base (cloud `dh6dcstn6`) for all hosted images. */
export const CLOUDINARY_BASE =
  "https://res.cloudinary.com/dh6dcstn6/image/upload";

/**
 * Trailing version paths (version + public id) for each hosted asset.
 * Pair with `cloudinary()` to build a full delivery URL.
 * @type {Record<string, string>}
 */
export const CLOUDINARY_ASSETS = {
  primaryLogo: "v1782277965/primary-logo_zqlx1g.png",
  driveLogo: "v1782410487/drive-logo_jp749f.png",
  smitLogo: "v1782279218/smit-logo_n2x282.png",
  aryanLogo: "v1782279304/aryan-logo_eilbdz.png",
  nbpdclLogo: "v1782279369/nbpdcl-logo_iybmae.jpg",
  projetlyLogo: "v1782279918/projetly-logo_rvjbfd.png",
};

/**
 * Build a Cloudinary delivery URL from an asset's trailing path.
 * @param {string} versionPath - Trailing version + public id (from `CLOUDINARY_ASSETS`).
 * @param {string} [transform] - Optional transformation string applied before the
 *   path (e.g. "f_auto,q_auto,w_96,h_96,c_fit"). Omit for the original asset.
 * @returns {string} Full Cloudinary delivery URL.
 */
export const cloudinary = (versionPath, transform) =>
  `${CLOUDINARY_BASE}/${transform ? `${transform}/` : ""}${versionPath}`;
