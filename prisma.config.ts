import { config } from "dotenv";
import { defineConfig } from "prisma/config";
import { migrateDatabaseUrl } from "./src/lib/database-url";

config();
config({ path: ".env.local", override: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: migrateDatabaseUrl(),
  },
});
