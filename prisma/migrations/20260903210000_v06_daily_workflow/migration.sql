-- AlterTable
ALTER TABLE "ProgressEntry" ADD COLUMN "makeupScheduledFor" TIMESTAMP(3);
ALTER TABLE "ProgressEntry" ADD COLUMN "makeupLocation" TEXT;

-- AlterTable
ALTER TABLE "GoalPeriodStatement" ADD COLUMN "goalVersionId" TEXT;

-- CreateTable
CREATE TABLE "StudentAccommodation" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentAccommodation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoalVersion" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "officialWording" TEXT NOT NULL,
    "plainLanguageSummary" TEXT NOT NULL,
    "baseline" TEXT NOT NULL,
    "measurableTarget" TEXT NOT NULL,
    "targetValue" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "measurementMethod" TEXT NOT NULL,
    "presentLevelsSnapshot" TEXT,
    "consecutiveSessionsNeeded" INTEGER NOT NULL,
    "maxPromptForMastery" TEXT NOT NULL,
    "changeReason" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoalVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportSnippet" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportSnippet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageRead" (
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageRead_pkey" PRIMARY KEY ("messageId","userId")
);

-- CreateIndex
CREATE INDEX "StudentAccommodation_studentId_idx" ON "StudentAccommodation"("studentId");

-- CreateIndex
CREATE INDEX "GoalVersion_goalId_createdAt_idx" ON "GoalVersion"("goalId", "createdAt");

-- CreateIndex
CREATE INDEX "ReportSnippet_organizationId_idx" ON "ReportSnippet"("organizationId");

-- AddForeignKey
ALTER TABLE "StudentAccommodation" ADD CONSTRAINT "StudentAccommodation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalVersion" ADD CONSTRAINT "GoalVersion_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "IepGoal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalVersion" ADD CONSTRAINT "GoalVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalPeriodStatement" ADD CONSTRAINT "GoalPeriodStatement_goalVersionId_fkey" FOREIGN KEY ("goalVersionId") REFERENCES "GoalVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportSnippet" ADD CONSTRAINT "ReportSnippet_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportSnippet" ADD CONSTRAINT "ReportSnippet_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageRead" ADD CONSTRAINT "MessageRead_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageRead" ADD CONSTRAINT "MessageRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
