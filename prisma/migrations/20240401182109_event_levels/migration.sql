-- CreateEnum
CREATE TYPE "EventLevelType" AS ENUM ('Daily', 'Weekly', 'Event');

-- CreateTable
CREATE TABLE "EventLevels" (
    "id" SERIAL NOT NULL,
    "levelId" INTEGER NOT NULL,
    "type" "EventLevelType" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventLevels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Levels_difficulty_idx" ON "Levels"("difficulty");

-- CreateIndex
CREATE INDEX "Levels_stars_idx" ON "Levels"("stars");

-- CreateIndex
CREATE INDEX "Levels_length_idx" ON "Levels"("length");

-- CreateIndex
CREATE INDEX "EventLevels_type_timestamp_idx" ON "EventLevels"("type", "timestamp");

-- CreateIndex
CREATE INDEX "EventLevels_levelId_idx" ON "EventLevels"("levelId");

-- AddForeignKey
ALTER TABLE "EventLevels" ADD CONSTRAINT "EventLevels_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Levels" ALTER COLUMN "requestedStars" SET DEFAULT 0;
