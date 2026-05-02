-- AlterTable
ALTER TABLE "DailyUserTask" ADD COLUMN     "skipNotes" TEXT,
ADD COLUMN     "skipReason" TEXT,
ADD COLUMN     "skippedAt" TIMESTAMP(3);
