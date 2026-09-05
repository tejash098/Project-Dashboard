import express from "express";
import cors from "cors";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import projectRoutes from "./routes/projectRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import techstackRoutes from "./routes/techstackRoutes.js";
import githubRoutes from "./routes/githubRoutes.js";
import { rateLimit } from "./middleware/rateLimit.js";

const app = express();

// The API docs as Markdown, generated from the client's `apiDocs.js` (see
// `client/scripts/generate-docs-md.mjs`). Read once at startup and served so
// AI assistants can fetch the page via the "Copy page" links on the Docs page.
const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCS_MARKDOWN = readFileSync(join(__dirname, "docs", "docs.md"), "utf-8");

// Trust the first reverse-proxy hop so req.ip reflects the real client IP
// (required for rate limiting behind Render / Vercel / Nginx).
app.set("trust proxy", 1);

// Middleware
app.use(cors());
app.use(express.json());
app.use(rateLimit);

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

app.get("/", (req, res) => {
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

// Tech-stack catalog routes (powers the project tech picker)
app.use("/api/techstacks", techstackRoutes);

// GitHub-derived stats (Redis-cached language totals for the Dashboard donut)
app.use("/api/github", githubRoutes);

export default app;
