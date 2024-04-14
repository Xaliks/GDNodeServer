-- CreateTable
CREATE TABLE "Gauntlets" (
    "id" SERIAL NOT NULL,
    "levelId1" INTEGER NOT NULL,
    "levelId2" INTEGER NOT NULL,
    "levelId3" INTEGER NOT NULL,
    "levelId4" INTEGER NOT NULL,
    "levelId5" INTEGER NOT NULL,

    CONSTRAINT "Gauntlets_pkey" PRIMARY KEY ("id")
);
