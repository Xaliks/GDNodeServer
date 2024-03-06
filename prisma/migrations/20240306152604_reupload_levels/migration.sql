-- DropIndex
DROP INDEX "Levels_accountId_name_key";

-- AlterTable
ALTER TABLE "Levels" ADD COLUMN     "boomlingsId" INTEGER;

-- CreateIndex
CREATE INDEX "Levels_accountId_name_idx" ON "Levels"("accountId", "name");
