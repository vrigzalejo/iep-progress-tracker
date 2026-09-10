-- AlterTable
ALTER TABLE "User" ADD COLUMN "passwordResetTokenHash" TEXT;
ALTER TABLE "User" ADD COLUMN "passwordResetExpiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "GuardianContact" ADD COLUMN "familyLocale" TEXT NOT NULL DEFAULT 'en';

-- AlterTable
ALTER TABLE "IepGoal" ADD COLUMN "plainLanguageSummaryEs" TEXT;

-- AlterTable
ALTER TABLE "ProgressEntry" ADD COLUMN "evidenceInPacket" BOOLEAN NOT NULL DEFAULT false;
