import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { databaseUrl } from "@/lib/database-url";

const connectionString = databaseUrl();

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pool?: Pool;
};

function createClient() {
  const pool = globalForPrisma.pool ?? new Pool({ connectionString });
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.pool = pool;
  }
  return new PrismaClient({ adapter: new PrismaPg(pool) });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
