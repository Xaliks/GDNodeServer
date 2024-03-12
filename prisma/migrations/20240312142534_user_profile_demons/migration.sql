-- AlterTable
ALTER TABLE "Levels" ADD COLUMN     "isDeleted" BOOLEAN DEFAULT false NOT NULL;

-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "demonsInfo" TEXT;