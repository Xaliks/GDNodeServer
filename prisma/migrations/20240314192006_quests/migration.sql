-- CreateEnum
CREATE TYPE "QuestType" AS ENUM ('Orbs', 'Coins', 'Stars');

-- CreateTable
CREATE TABLE "Quests" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "QuestType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "reward" INTEGER NOT NULL,

    CONSTRAINT "Quests_pkey" PRIMARY KEY ("id")
);

INSERT INTO "Quests" ("name", "type", "amount", "reward")
VALUES
    ('Orb finder', 'Orbs', 200, 10),
    ('Star collector', 'Stars', 5, 10),
    ('Coin master', 'Coins', 2, 10),
    ('Orb finder', 'Orbs', 500, 15),
    ('Star collector', 'Stars', 10, 15),
    ('Coin master', 'Coins', 4, 15),
    ('Orb finder', 'Orbs', 1000, 20),
    ('Star collector', 'Stars', 15, 20),
    ('Coin master', 'Coins', 6, 20);
