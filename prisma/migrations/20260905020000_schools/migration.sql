-- CreateTable
CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Student" ADD COLUMN "schoolId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "School_organizationId_name_key" ON "School"("organizationId", "name");

-- CreateIndex
CREATE INDEX "School_organizationId_idx" ON "School"("organizationId");

-- CreateIndex
CREATE INDEX "Student_schoolId_idx" ON "Student"("schoolId");

-- Backfill one school row per existing campus string
INSERT INTO "School" ("id", "organizationId", "name", "createdAt")
SELECT
    'sch_' || substr(md5(s."organizationId" || E'\n' || s."school"), 1, 24),
    s."organizationId",
    s."school",
    CURRENT_TIMESTAMP
FROM (
    SELECT DISTINCT "organizationId", "school"
    FROM "Student"
    WHERE trim("school") <> ''
) s;

UPDATE "Student" AS st
SET "schoolId" = 'sch_' || substr(md5(st."organizationId" || E'\n' || st."school"), 1, 24)
WHERE trim(st."school") <> '';

-- AddForeignKey
ALTER TABLE "School" ADD CONSTRAINT "School_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;
