import { writeFileSync, mkdirSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { buildDocsMarkdown } from "../src/utils/docsMarkdown.js";

/**
 * Regenerates the Markdown the backend serves at `/api/docs.md`.
 *
 * The Docs page renders from `client/src/data/apiDocs.js`; this script runs the
 * same generator over that data and writes the result into the server, so the
 * served `.md` (and therefore the AI hand-off links) stays in sync with the
 * page. Run after editing `apiDocs.js`:  `npm run generate:docs-md`.
 */
const here = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(here, "../../server/src/docs/docs.md");

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, buildDocsMarkdown(), "utf-8");

console.log(`[generate-docs-md] wrote ${outPath}`);
