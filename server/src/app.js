import express from "express";
import cors from "cors";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import projectRoutes from "./routes/projectRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";

const app = express();

// The API docs as Markdown, generated from the client's `apiDocs.js` (see
// `client/scripts/generate-docs-md.mjs`). Read once at startup and served so
// AI assistants can fetch the page via the "Copy page" links on the Docs page.
const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCS_MARKDOWN = readFileSync(join(__dirname, "docs", "docs.md"), "utf-8");

// Middleware
app.use(cors());
app.use(express.json());

// Request tracer — logs every incoming request (method + path + ms taken).
// Bodies are intentionally NOT logged, since the login route carries a password.
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`[http] → ${req.method} ${req.originalUrl}`);
  res.on("finish", () => {
    console.log(
      `[http] ← ${req.method} ${req.originalUrl} ${res.statusCode} (${Date.now() - start}ms)`,
    );
  });
  next();
});

app.get("/api/status", (req, res) => {
  console.log("[http] health check");
  res.json({ status: "ok" });
});

// Public Markdown view of the API docs — backs the Docs page "Copy page" /
// "View as Markdown" links and the AI hand-offs (ChatGPT/Claude/etc.).
app.get("/api/docs.md", (req, res) => {
  res.type("text/markdown").send(DOCS_MARKDOWN);
});

// Auth routes (login → JWT)
app.use("/api/auth", authRoutes);

// Project resource routes
app.use("/api/projects", projectRoutes);

// Feedback (contact-form) resource routes
app.use("/api/feedback", feedbackRoutes);

export default app;
