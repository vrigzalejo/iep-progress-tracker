import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";
import path from "node:path";

const dbPath = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const url = dbPath.startsWith("file:")
  ? `file:${path.resolve(process.cwd(), dbPath.replace(/^file:/, ""))}`
  : dbPath;

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const adapter = new PrismaBetterSqlite3({ url });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
