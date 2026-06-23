import Admin from "../models/Admin.js";
import config from "./env.js";
import { generate16DigitId } from "../utils/generateId.js";

/**
 * Bootstrap the first admin from environment variables. Runs once on server
 * start: if the collection has no admin yet, create one from ADMIN_USERNAME /
 * ADMIN_PASSWORD. The model's pre-save hook hashes the password, so the plain
 * value from `.env` is never persisted.
 *
 * Idempotent — does nothing when an admin already exists or when the env vars
 * are missing, so it is safe to call on every startup.
 * @returns {Promise<void>}
 */
const seedAdmin = async () => {
  const username = config.adminUsername;
  const password = config.adminPassword;

  if (!username || !password) {
    console.warn(
      "[seed] skipped: ADMIN_USERNAME / ADMIN_PASSWORD not set in .env",
    );
    return;
  }

  // "if no admin exists, create one" — leave existing admins' credentials alone,
  // but backfill a user_id for any that predate the field (it's only applied as
  // a default to newly created docs, not to ones already in the DB).
  const existing = await Admin.countDocuments();
  if (existing > 0) {
    const missing = await Admin.find({ user_id: null });
    for (const admin of missing) {
      admin.user_id = generate16DigitId();
      await admin.save(); // password isn't modified, so the pre-save hook skips re-hashing
      console.log(`[seed] backfilled user_id for "${admin.username}"`);
    }
    console.log(`[seed] admin already exists (${existing}); created none`);
    return;
  }

  await Admin.create({ username, password });
  console.log(`[seed] created admin user "${username}"`);
};

export default seedAdmin;
