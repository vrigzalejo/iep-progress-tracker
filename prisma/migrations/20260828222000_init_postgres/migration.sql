-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "retentionDays" INTEGER NOT NULL DEFAULT 2555,
    "noticeVersion" TEXT NOT NULL DEFAULT '2026-08',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "role" TEXT NOT NULL,
    "passwordHash" TEXT,
    "organizationId" TEXT NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "failedSignIns" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deactivatedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "preferredName" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "school" TEXT NOT NULL,
    "caseManagerId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "iepAnnualReviewAt" TIMESTAMP(3),
    "iepTriennialAt" TIMESTAMP(3),
    "presentLevels" TEXT,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentProvider" (
    "studentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serviceArea" TEXT NOT NULL,
    "minutesPerWeek" INTEGER NOT NULL DEFAULT 0,
    "sessionsPerWeek" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "StudentProvider_pkey" PRIMARY KEY ("studentId","userId")
);

-- CreateTable
CREATE TABLE "GuardianContact" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "userId" TEXT,

    CONSTRAINT "GuardianContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IepGoal" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "officialWording" TEXT NOT NULL,
    "plainLanguageSummary" TEXT NOT NULL,
    "baseline" TEXT NOT NULL,
    "measurableTarget" TEXT NOT NULL,
    "targetValue" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "reportingPeriod" TEXT NOT NULL,
    "nextReportDue" TIMESTAMP(3) NOT NULL,
    "serviceArea" TEXT NOT NULL,
    "measurementMethod" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "sharedWithGuardians" BOOLEAN NOT NULL DEFAULT true,
    "consecutiveSessionsNeeded" INTEGER NOT NULL DEFAULT 1,
    "maxPromptForMastery" TEXT NOT NULL DEFAULT 'INDEPENDENT',
    "presentLevelsSnapshot" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IepGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoalObjective" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "officialWording" TEXT NOT NULL,
    "plainLanguageSummary" TEXT NOT NULL,
    "targetValue" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoalObjective_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressEntry" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "measurementType" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "evidenceLabel" TEXT,
    "evidencePath" TEXT,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionOutcome" TEXT NOT NULL DEFAULT 'PRESENT',
    "setting" TEXT NOT NULL DEFAULT 'CLASSROOM',
    "conditionTag" TEXT,
    "accommodations" TEXT,
    "minutesDelivered" INTEGER,
    "groupSize" INTEGER,
    "homeCarryover" TEXT,
    "objectiveId" TEXT,

    CONSTRAINT "ProgressEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressTrial" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "promptLevel" TEXT NOT NULL DEFAULT 'INDEPENDENT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProgressTrial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportingPeriodWindow" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportingPeriodWindow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoalPeriodStatement" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "progressCode" TEXT NOT NULL,
    "narrative" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoalPeriodStatement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visibility" TEXT NOT NULL DEFAULT 'FAMILY',

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "studentId" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentRecord" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "guardianName" TEXT NOT NULL,
    "noticeVersion" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL,
    "withdrawnAt" TIMESTAMP(3),

    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_organizationId_role_idx" ON "User"("organizationId", "role");

-- CreateIndex
CREATE INDEX "Student_organizationId_idx" ON "Student"("organizationId");

-- CreateIndex
CREATE INDEX "Student_caseManagerId_idx" ON "Student"("caseManagerId");

-- CreateIndex
CREATE INDEX "IepGoal_studentId_idx" ON "IepGoal"("studentId");

-- CreateIndex
CREATE INDEX "IepGoal_nextReportDue_idx" ON "IepGoal"("nextReportDue");

-- CreateIndex
CREATE INDEX "GoalObjective_goalId_idx" ON "GoalObjective"("goalId");

-- CreateIndex
CREATE INDEX "ProgressEntry_goalId_recordedAt_idx" ON "ProgressEntry"("goalId", "recordedAt");

-- CreateIndex
CREATE INDEX "ReportingPeriodWindow_organizationId_startsAt_idx" ON "ReportingPeriodWindow"("organizationId", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "GoalPeriodStatement_goalId_periodId_key" ON "GoalPeriodStatement"("goalId", "periodId");

-- CreateIndex
CREATE INDEX "Message_studentId_createdAt_idx" ON "Message"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_createdAt_idx" ON "AuditLog"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_studentId_idx" ON "AuditLog"("studentId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_caseManagerId_fkey" FOREIGN KEY ("caseManagerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProvider" ADD CONSTRAINT "StudentProvider_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProvider" ADD CONSTRAINT "StudentProvider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianContact" ADD CONSTRAINT "GuardianContact_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianContact" ADD CONSTRAINT "GuardianContact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IepGoal" ADD CONSTRAINT "IepGoal_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IepGoal" ADD CONSTRAINT "IepGoal_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalObjective" ADD CONSTRAINT "GoalObjective_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "IepGoal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressEntry" ADD CONSTRAINT "ProgressEntry_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "IepGoal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressEntry" ADD CONSTRAINT "ProgressEntry_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressEntry" ADD CONSTRAINT "ProgressEntry_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "GoalObjective"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressTrial" ADD CONSTRAINT "ProgressTrial_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "ProgressEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportingPeriodWindow" ADD CONSTRAINT "ReportingPeriodWindow_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalPeriodStatement" ADD CONSTRAINT "GoalPeriodStatement_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "IepGoal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalPeriodStatement" ADD CONSTRAINT "GoalPeriodStatement_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "ReportingPeriodWindow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalPeriodStatement" ADD CONSTRAINT "GoalPeriodStatement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

