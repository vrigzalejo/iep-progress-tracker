-- AlterTable
ALTER TABLE "Student" ADD COLUMN "iepAnnualReviewAt" DATETIME;
ALTER TABLE "Student" ADD COLUMN "iepTriennialAt" DATETIME;
ALTER TABLE "Student" ADD COLUMN "presentLevels" TEXT;

-- CreateTable
CREATE TABLE "GoalObjective" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "goalId" TEXT NOT NULL,
    "officialWording" TEXT NOT NULL,
    "plainLanguageSummary" TEXT NOT NULL,
    "targetValue" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GoalObjective_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "IepGoal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProgressTrial" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entryId" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "promptLevel" TEXT NOT NULL DEFAULT 'INDEPENDENT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ProgressTrial_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "ProgressEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReportingPeriodWindow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME NOT NULL,
    CONSTRAINT "ReportingPeriodWindow_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GoalPeriodStatement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "goalId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "progressCode" TEXT NOT NULL,
    "narrative" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GoalPeriodStatement_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "IepGoal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GoalPeriodStatement_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "ReportingPeriodWindow" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GoalPeriodStatement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_IepGoal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "officialWording" TEXT NOT NULL,
    "plainLanguageSummary" TEXT NOT NULL,
    "baseline" TEXT NOT NULL,
    "measurableTarget" TEXT NOT NULL,
    "targetValue" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "reportingPeriod" TEXT NOT NULL,
    "nextReportDue" DATETIME NOT NULL,
    "serviceArea" TEXT NOT NULL,
    "measurementMethod" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "sharedWithGuardians" BOOLEAN NOT NULL DEFAULT true,
    "consecutiveSessionsNeeded" INTEGER NOT NULL DEFAULT 1,
    "maxPromptForMastery" TEXT NOT NULL DEFAULT 'INDEPENDENT',
    "presentLevelsSnapshot" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "IepGoal_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "IepGoal_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_IepGoal" ("baseline", "createdAt", "createdById", "endDate", "id", "measurableTarget", "measurementMethod", "nextReportDue", "officialWording", "plainLanguageSummary", "reportingPeriod", "serviceArea", "sharedWithGuardians", "startDate", "status", "studentId", "targetValue", "unit", "updatedAt") SELECT "baseline", "createdAt", "createdById", "endDate", "id", "measurableTarget", "measurementMethod", "nextReportDue", "officialWording", "plainLanguageSummary", "reportingPeriod", "serviceArea", "sharedWithGuardians", "startDate", "status", "studentId", "targetValue", "unit", "updatedAt" FROM "IepGoal";
DROP TABLE "IepGoal";
ALTER TABLE "new_IepGoal" RENAME TO "IepGoal";
CREATE INDEX "IepGoal_studentId_idx" ON "IepGoal"("studentId");
CREATE INDEX "IepGoal_nextReportDue_idx" ON "IepGoal"("nextReportDue");
CREATE TABLE "new_Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visibility" TEXT NOT NULL DEFAULT 'FAMILY',
    CONSTRAINT "Message_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Message" ("body", "createdAt", "fromUserId", "id", "studentId") SELECT "body", "createdAt", "fromUserId", "id", "studentId" FROM "Message";
DROP TABLE "Message";
ALTER TABLE "new_Message" RENAME TO "Message";
CREATE INDEX "Message_studentId_createdAt_idx" ON "Message"("studentId", "createdAt");
CREATE TABLE "new_ProgressEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "goalId" TEXT NOT NULL,
    "recordedAt" DATETIME NOT NULL,
    "score" REAL NOT NULL,
    "measurementType" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "evidenceLabel" TEXT,
    "evidencePath" TEXT,
    "authorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionOutcome" TEXT NOT NULL DEFAULT 'PRESENT',
    "setting" TEXT NOT NULL DEFAULT 'CLASSROOM',
    "conditionTag" TEXT,
    "accommodations" TEXT,
    "minutesDelivered" INTEGER,
    "groupSize" INTEGER,
    "homeCarryover" TEXT,
    "objectiveId" TEXT,
    CONSTRAINT "ProgressEntry_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "IepGoal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProgressEntry_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProgressEntry_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "GoalObjective" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ProgressEntry" ("authorId", "createdAt", "evidenceLabel", "evidencePath", "goalId", "id", "measurementType", "notes", "recordedAt", "score") SELECT "authorId", "createdAt", "evidenceLabel", "evidencePath", "goalId", "id", "measurementType", "notes", "recordedAt", "score" FROM "ProgressEntry";
DROP TABLE "ProgressEntry";
ALTER TABLE "new_ProgressEntry" RENAME TO "ProgressEntry";
CREATE INDEX "ProgressEntry_goalId_recordedAt_idx" ON "ProgressEntry"("goalId", "recordedAt");
CREATE TABLE "new_StudentProvider" (
    "studentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serviceArea" TEXT NOT NULL,
    "minutesPerWeek" INTEGER NOT NULL DEFAULT 0,
    "sessionsPerWeek" INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY ("studentId", "userId"),
    CONSTRAINT "StudentProvider_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StudentProvider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_StudentProvider" ("serviceArea", "studentId", "userId") SELECT "serviceArea", "studentId", "userId" FROM "StudentProvider";
DROP TABLE "StudentProvider";
ALTER TABLE "new_StudentProvider" RENAME TO "StudentProvider";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "GoalObjective_goalId_idx" ON "GoalObjective"("goalId");

-- CreateIndex
CREATE INDEX "ReportingPeriodWindow_organizationId_startsAt_idx" ON "ReportingPeriodWindow"("organizationId", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "GoalPeriodStatement_goalId_periodId_key" ON "GoalPeriodStatement"("goalId", "periodId");
