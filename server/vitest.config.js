import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    /**
     * config/env.js calls process.exit(1) when a required variable is missing,
     * and eight modules import it — every controller, the auth middleware, the
     * Admin model, captureScreenshot. Without these, the first test that
     * imports any of them kills the whole runner: no failing test, no stack
     * trace, just an exit code. The symptom looks nothing like its cause.
     *
     * These are placeholders, not credentials. Nothing reaches Mongo or
     * Cloudinary until code calls connect() or uploader.upload(), which tests
     * mock or drive against an in-memory server.
     */
    env: {
      MONGODB_URI: "mongodb://127.0.0.1:27017/project-dashboard-test",
      JWT_SECRET: "test-secret-not-used-to-sign-anything-real",
      CLOUDINARY_CLOUD_NAME: "test-cloud",
      CLOUDINARY_API_KEY: "test-key",
      CLOUDINARY_API_SECRET: "test-secret",
    },
  },
});
