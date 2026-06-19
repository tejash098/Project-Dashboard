import express from "express";
import cors from "cors";
import projectRoutes from "./routes/projectRoutes.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.get("/api/status", (req, res) => {
  res.json({ status: "ok" });
});

// Project resource routes
app.use("/api/projects", projectRoutes);

export default app;
