import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import config from "../../config/env.js";

/**
 * The chatbot's reference document.
 *
 * Read once at startup — the same readFileSync-at-boot pattern app.js uses for
 * docs.md, and for the same reason: the file never changes while the process
 * runs, so re-reading it per request would buy nothing.
 *
 * A missing file throws here and crashes the boot. That is deliberate: the
 * alternative is a server that starts fine and answers questions with no
 * grounding at all, which is the one failure this feature must never have.
 */
const __dirname = dirname(fileURLToPath(import.meta.url));

/** Raw Markdown of the reference document — inlined into the system prompt. */
export const CHATBOT_CONTEXT = readFileSync(
  join(__dirname, "..", "..", "docs", "chatbot-context.md"),
  "utf-8",
);

/**
 * Public URL of the document above, cited inside the system prompt so the model
 * can attribute its source and a visitor can read exactly what it was given.
 *
 * The document's text is inlined rather than fetched: the model has no browsing
 * in a plain generateContent call, Google's servers cannot reach localhost, and
 * a failed fetch would fail *silently* — the model would answer from general
 * knowledge instead of erroring, which defeats the whole design.
 */
export const CONTEXT_URL = `${config.publicBaseUrl}/api/chatbot-context.md`;
