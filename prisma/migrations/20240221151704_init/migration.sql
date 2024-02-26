-- CreateTable
CREATE TABLE "Accounts" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "messageState" INTEGER NOT NULL DEFAULT 0,
    "friendRequestState" INTEGER NOT NULL DEFAULT 0,
    "commentHistoryState" INTEGER NOT NULL DEFAULT 0,
    "youtube" TEXT,
    "twitter" TEXT,
    "twitch" TEXT,
    "modBadge" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Users" (
    "id" SERIAL NOT NULL,
    "extId" TEXT NOT NULL,
    "username" TEXT NOT NULL DEFAULT 'Player',
    "isRegistered" BOOLEAN NOT NULL DEFAULT false,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "isCreatorBanned" BOOLEAN NOT NULL DEFAULT false,
    "orbs" INTEGER NOT NULL DEFAULT 0,
    "stars" INTEGER NOT NULL DEFAULT 0,
    "moons" INTEGER NOT NULL DEFAULT 0,
    "coins" INTEGER NOT NULL DEFAULT 0,
    "diamonds" INTEGER NOT NULL DEFAULT 0,
    "userCoins" INTEGER NOT NULL DEFAULT 0,
    "demons" INTEGER NOT NULL DEFAULT 0,
    "creatorPoints" INTEGER NOT NULL DEFAULT 0,
    "special" INTEGER NOT NULL DEFAULT 0,
    "displayIcon" INTEGER NOT NULL DEFAULT 0,
    "displayIconType" INTEGER NOT NULL DEFAULT 0,
    "cube" INTEGER NOT NULL DEFAULT 1,
    "ship" INTEGER NOT NULL DEFAULT 1,
    "ball" INTEGER NOT NULL DEFAULT 1,
    "ufo" INTEGER NOT NULL DEFAULT 1,
    "wave" INTEGER NOT NULL DEFAULT 1,
    "robot" INTEGER NOT NULL DEFAULT 1,
    "spider" INTEGER NOT NULL DEFAULT 1,
    "swing" INTEGER NOT NULL DEFAULT 1,
    "jetpack" INTEGER NOT NULL DEFAULT 1,
    "explosion" INTEGER NOT NULL DEFAULT 1,
    "glow" BOOLEAN NOT NULL DEFAULT false,
    "mainColor" INTEGER NOT NULL DEFAULT 0,
    "secondColor" INTEGER NOT NULL DEFAULT 3,
    "glowColor" INTEGER NOT NULL DEFAULT -1,
    "totalSmallChests" INTEGER NOT NULL DEFAULT 0,
    "lastSmallChest" TIMESTAMP(3),
    "totalBigChests" INTEGER NOT NULL DEFAULT 0,
    "lastBigChest" TIMESTAMP(3),

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountComments" (
    "id" SERIAL NOT NULL,
    "accountId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "isSpam" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AccountComments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FriendRequests" (
    "id" SERIAL NOT NULL,
    "accountId" INTEGER NOT NULL,
    "toAccountId" INTEGER NOT NULL,
    "comment" TEXT,
    "isNew" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FriendRequests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Friends" (
    "id" SERIAL NOT NULL,
    "accountId1" INTEGER NOT NULL,
    "accountId2" INTEGER NOT NULL,
    "isNewFor1" BOOLEAN NOT NULL DEFAULT true,
    "isNewFor2" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Friends_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Blocks" (
    "id" SERIAL NOT NULL,
    "accountId" INTEGER NOT NULL,
    "targetAccountId" INTEGER NOT NULL,

    CONSTRAINT "Blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Messages" (
    "id" SERIAL NOT NULL,
    "accountId" INTEGER NOT NULL,
    "toAccountId" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isNew" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Levels" (
    "id" SERIAL NOT NULL,
    "gameVersion" INTEGER NOT NULL,
    "binaryVersion" INTEGER NOT NULL DEFAULT 0,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedData" (
    "id" INTEGER NOT NULL,
    "data" TEXT NOT NULL,
    "gameVersion" TEXT NOT NULL,
    "binaryVersion" TEXT NOT NULL,

    CONSTRAINT "SavedData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Accounts_username_key" ON "Accounts"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Accounts_email_key" ON "Accounts"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Users_extId_idx" ON "Users"("extId");

-- CreateIndex
CREATE UNIQUE INDEX "FriendRequests_accountId_toAccountId_key" ON "FriendRequests"("accountId", "toAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Friends_accountId1_accountId2_key" ON "Friends"("accountId1", "accountId2");

-- CreateIndex
CREATE UNIQUE INDEX "Blocks_accountId_targetAccountId_key" ON "Blocks"("accountId", "targetAccountId");
