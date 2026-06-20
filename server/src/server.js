import config from "./config/env.js";
import app from "./app.js";
import connectDB from "./config/db.js";
import seedAdmin from "./config/seedAdmin.js";

const PORT = config.port;

const startServer = async () => {
  console.log("[server] startup: connecting to DB…");
  await connectDB();
  console.log("[server] startup: seeding admin…");
  await seedAdmin(); // create the bootstrap admin if none exists yet
  app.listen(PORT, () => {
    console.log(`[server] listening on http://localhost:${PORT}`);
  });
};

startServer();