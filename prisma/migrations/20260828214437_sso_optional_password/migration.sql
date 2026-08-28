-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "role" TEXT NOT NULL,
    "passwordHash" TEXT,
    "organizationId" TEXT NOT NULL,
    "lastLoginAt" DATETIME,
    "failedSignIns" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deactivatedAt" DATETIME,
    CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_User" ("createdAt", "deactivatedAt", "email", "failedSignIns", "id", "lastLoginAt", "lockedUntil", "name", "organizationId", "passwordHash", "role", "title") SELECT "createdAt", "deactivatedAt", "email", "failedSignIns", "id", "lastLoginAt", "lockedUntil", "name", "organizationId", "passwordHash", "role", "title" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_organizationId_role_idx" ON "User"("organizationId", "role");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
