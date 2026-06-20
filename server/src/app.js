import express from "express";
import cors from "cors";
import projectRoutes from "./routes/projectRoutes.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();

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

// Auth routes (login → JWT)
app.use("/api/auth", authRoutes);

// Project resource routes
app.use("/api/projects", projectRoutes);

export default app;
