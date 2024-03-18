UPDATE "Users" SET "demonsInfo"='0,0,0,0,0,0,0,0,0,0,0,0' WHERE "demonsInfo" IS NULL;

-- AlterTable
ALTER TABLE "Users" ALTER COLUMN "demonsInfo" SET NOT NULL,
ALTER COLUMN "demonsInfo" SET DEFAULT '0,0,0,0,0,0,0,0,0,0,0,0';
