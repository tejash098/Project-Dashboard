import express from "express";
import cors from "cors";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.get("/api/status", (req, res) => {
  res.json({ status: "Server is running" });
});

export default app;
