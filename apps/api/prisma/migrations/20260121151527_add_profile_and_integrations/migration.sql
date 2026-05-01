-- AlterTable
ALTER TABLE "user_stats" ADD COLUMN     "activityLevel" TEXT,
ADD COLUMN     "age" INTEGER,
ADD COLUMN     "dietaryPreference" TEXT,
ADD COLUMN     "goals" TEXT[],
ADD COLUMN     "height" DOUBLE PRECISION,
ADD COLUMN     "integrations" JSONB,
ADD COLUMN     "measurementSystem" TEXT NOT NULL DEFAULT 'metric',
ADD COLUMN     "weight" DOUBLE PRECISION;
