import mongoose from "mongoose";
import connectDB from "../config/db.js";
import config from "../config/env.js";

/**
 * One-off migration: copy every collection from the old database into the one
 * the app now connects to.
 *
 * Why it exists: MONGODB_URI never named a database, so the driver used
 * MongoDB's default, "test", and all of this app's data was written there. The
 * server now connects to `config.mongodbDbName` ("project-dashboard") instead,
 * which starts out empty — this script carries the existing data across.
 *
 * Safe to run more than once, and against a live cluster:
 *   - it only reads from the source database; nothing there is changed or deleted
 *   - a target collection that already holds documents is skipped, never merged
 *     into or overwritten
 *   - documents keep their `_id`, so references between collections still hold
 *
 * Indexes are not copied. Mongoose rebuilds them from the schemas the first
 * time the server starts against the new database.
 *
 * Usage (from `server/`):
 *   npm run copy:db -- --dry-run     report what would be copied, write nothing
 *   npm run copy:db                  copy from "test"
 *   npm run copy:db -- --from=other  copy from a different source database
 */

/** Source database when `--from=` is not given — MongoDB's default name. */
const DEFAULT_SOURCE_DB = "test";

/** Documents per insertMany call, so a large collection is not one giant write. */
const BATCH_SIZE = 500;

/**
 * Read this script's command-line flags.
 * @param {string[]} argv - Arguments after the script path.
 * @returns {{ dryRun: boolean, sourceName: string }} Parsed options.
 */
const parseArgs = (argv) => {
  const from = argv.find((arg) => arg.startsWith("--from="));
  return {
    dryRun: argv.includes("--dry-run"),
    sourceName: from ? from.slice("--from=".length) : DEFAULT_SOURCE_DB,
  };
};

/**
 * Copy one collection, in batches, unless the target already has documents.
 * @param {import("mongodb").Db} source - Database to read from.
 * @param {import("mongodb").Db} target - Database to write to.
 * @param {string} name - Collection name.
 * @param {boolean} dryRun - Report only; write nothing.
 * @returns {Promise<void>}
 */
const copyCollection = async (source, target, name, dryRun) => {
  const sourceCount = await source.collection(name).countDocuments();
  const targetCount = await target.collection(name).countDocuments();

  if (sourceCount === 0) {
    console.log(`[copy-db] ${name}: empty in source — nothing to copy`);
    return;
  }
  // Never merge into existing data: a partial overlap would fail on duplicate
  // _ids halfway through and leave the collection in an unknown state.
  if (targetCount > 0) {
    console.log(
      `[copy-db] ${name}: skipped — target already has ${targetCount} document(s)`,
    );
    return;
  }
  if (dryRun) {
    console.log(`[copy-db] ${name}: would copy ${sourceCount} document(s)`);
    return;
  }

  let copied = 0;
  let batch = [];
  for await (const doc of source.collection(name).find()) {
    batch.push(doc);
    if (batch.length === BATCH_SIZE) {
      await target.collection(name).insertMany(batch);
      copied += batch.length;
      batch = [];
    }
  }
  if (batch.length) {
    await target.collection(name).insertMany(batch);
    copied += batch.length;
  }
  console.log(`[copy-db] ${name}: copied ${copied} document(s)`);
};

/**
 * Connect, copy every non-system collection from the source database into the
 * app's database, then disconnect.
 * @returns {Promise<void>}
 */
const copyDatabase = async () => {
  const { dryRun, sourceName } = parseArgs(process.argv.slice(2));
  const targetName = config.mongodbDbName;

  // Copying a database onto itself would skip every collection as "already
  // populated" and look like success, so say what is actually wrong.
  if (sourceName === targetName) {
    console.error(
      `[copy-db] source and target are both "${targetName}" — nothing to do`,
    );
    process.exit(1);
  }

  await connectDB();
  const client = mongoose.connection.getClient();
  const source = client.db(sourceName);
  const target = client.db(targetName);

  console.log(
    `[copy-db] ${dryRun ? "dry run: " : ""}"${sourceName}" → "${targetName}"`,
  );

  const collections = await source.listCollections({}, { nameOnly: true }).toArray();
  const names = collections
    .map((collection) => collection.name)
    .filter((name) => !name.startsWith("system."))
    .sort();

  if (names.length === 0) {
    console.log(`[copy-db] "${sourceName}" has no collections — nothing to copy`);
  }
  for (const name of names) {
    await copyCollection(source, target, name, dryRun);
  }

  await mongoose.disconnect();
  console.log("[copy-db] done");
};

copyDatabase().catch(async (error) => {
  console.error("[copy-db] failed:", error);
  await mongoose.disconnect();
  process.exit(1);
});
