import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";

async function main() {
  if (env.nodeEnv === "production") {
    console.log("Syncing database schema...");
    await prisma.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 0");
    await prisma.$executeRawUnsafe(
      `CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        slug VARCHAR(80) NOT NULL UNIQUE,
        icon VARCHAR(50),
        sort INT NOT NULL DEFAULT 0,
        parent_id INT,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) NOT NULL,
        INDEX categories_parent_id_idx (parent_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    );
    await prisma.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 1");
    console.log("Database schema synced.");
  }

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
}

main().catch((err) => {
  console.error("Startup failed:", err);
  process.exit(1);
});