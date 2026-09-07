import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";

const server = app.listen(env.port, "0.0.0.0", () => {
  console.log(`MORI API running at http://0.0.0.0:${env.port}`);
});

async function shutdown() {
  server.closeAllConnections();
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
