import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { databaseUrl, pgPoolConnectionString, pgPoolSsl } from "@/lib/database-url";

const connectionString = pgPoolConnectionString(databaseUrl());
const poolSsl = pgPoolSsl(connectionString);
const onVercel = Boolean(process.env.VERCEL);

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pool?: Pool;
};

function createClient() {
  const existing = globalForPrisma.pool;
  const pool =
    existing ??
    new Pool({
      connectionString,
      ssl: poolSsl,
      max: onVercel ? 1 : 10,
    });
  if (!existing) {
    globalForPrisma.pool = pool;
    if (onVercel) {
      void import("@vercel/functions")
        .then(({ attachDatabasePool }) => attachDatabasePool(pool))
        .catch(() => {
          // Fluid pool attachment is Vercel-only; Docker/K8s keep a normal Pool.
        });
    }
  }
  return new PrismaClient({ adapter: new PrismaPg(pool) });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production" || onVercel) {
  globalForPrisma.prisma = prisma;
}
