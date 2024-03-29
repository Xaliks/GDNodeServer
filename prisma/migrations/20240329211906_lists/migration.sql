-- CreateEnum
CREATE TYPE "ListRating" AS ENUM ('None', 'Featured');

-- DropForeignKey
ALTER TABLE "LevelComments" DROP CONSTRAINT "LevelComments_levelId_fkey";

-- CreateTable
CREATE TABLE "Lists" (
    "id" SERIAL NOT NULL,
    "accountId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "difficulty" "LevelDifficulty" NOT NULL DEFAULT 'NA',
    "visibility" "LevelVisibility" NOT NULL DEFAULT 'Listed',
    "originalListId" INTEGER,
    "reward" INTEGER NOT NULL DEFAULT 0,
    "levelsToReward" INTEGER NOT NULL DEFAULT 0,
    "ratingType" "ListRating" NOT NULL DEFAULT 'None',
    "likes" INTEGER NOT NULL DEFAULT 0,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "levels" INTEGER[],
    "ratedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Lists_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "LevelComments" RENAME TO "Comments";
ALTER TABLE "Comments" RENAME CONSTRAINT "LevelComments_pkey" TO "Comments_pkey";

