import config from "./config/env.js";
import app from "./app.js";
import connectDB from "./config/db.js";
import { connectRedis } from "./config/redis.js";
import seedAdmin from "./config/seedAdmin.js";

const PORT = config.port;

const startServer = async () => {
  console.log("[server] startup: connecting to DB…");
  await connectDB();
  console.log("[server] startup: seeding admin…");
  await seedAdmin(); // create the bootstrap admin if none exists yet
  // Awaited so the first requests hit a ready cache instead of fanning out to
  // GitHub, but bounded: Redis is optional, and connectRedis gives up waiting
  // after a few seconds (with a bad host it would otherwise never settle).
  console.log("[server] startup: connecting to Redis…");
  await connectRedis();
  app.listen(PORT, () => {
    console.log(`[server] listening on http://localhost:${PORT}`);
  });
};

startServer();