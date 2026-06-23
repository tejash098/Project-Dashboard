import { v2 as cloudinary } from "cloudinary";
import config from "./env.js";

/**
 * Configure the Cloudinary SDK once at import time using the credentials from
 * env.js. The API secret lives only on the server and is never sent to the
 * client — the browser uploads the raw file to our API, and this module is what
 * pushes it to Cloudinary on the backend.
 */
cloudinary.config({
  cloud_name: config.cloudinaryCloudName,
  api_key: config.cloudinaryApiKey,
  api_secret: config.cloudinaryApiSecret,
});

export default cloudinary;
