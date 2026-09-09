-- AlterTable
ALTER TABLE "GuardianContact" ADD COLUMN "digestOptIn" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "GuardianContact" ADD COLUMN "digestUnsubscribedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "MeetingAttendance" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "meetingOn" TIMESTAMP(3) NOT NULL,
    "attendeeName" TEXT NOT NULL,
    "present" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeetingAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiledDocument" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "periodLabel" TEXT,
    "storagePath" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FiledDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MeetingAttendance_studentId_meetingOn_attendeeName_key" ON "MeetingAttendance"("studentId", "meetingOn", "attendeeName");

-- CreateIndex
CREATE INDEX "MeetingAttendance_studentId_meetingOn_idx" ON "MeetingAttendance"("studentId", "meetingOn");

-- CreateIndex
CREATE INDEX "FiledDocument_studentId_createdAt_idx" ON "FiledDocument"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "FiledDocument_organizationId_idx" ON "FiledDocument"("organizationId");

-- AddForeignKey
ALTER TABLE "MeetingAttendance" ADD CONSTRAINT "MeetingAttendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingAttendance" ADD CONSTRAINT "MeetingAttendance_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiledDocument" ADD CONSTRAINT "FiledDocument_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiledDocument" ADD CONSTRAINT "FiledDocument_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
