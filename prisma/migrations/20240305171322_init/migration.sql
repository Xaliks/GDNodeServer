-- CreateEnum
CREATE TYPE "ModBadge" AS ENUM ('None', 'Moderator', 'ElderModerator', 'LeaderboardModerator');

-- CreateEnum
CREATE TYPE "LikeType" AS ENUM ('Level', 'LevelComment', 'AccountComment', 'List');

-- CreateEnum
CREATE TYPE "LevelRating" AS ENUM ('None', 'Featured', 'Epic', 'Legendary', 'Mythic');

-- CreateEnum
CREATE TYPE "LevelDifficulty" AS ENUM ('NA', 'Auto', 'Easy', 'Normal', 'Hard', 'Harder', 'Insane', 'EasyDemon', 'MediumDemon', 'HardDemon', 'InsaneDemon', 'ExtremeDemon');

-- CreateEnum
CREATE TYPE "LevelLength" AS ENUM ('Tiny', 'Short', 'Medium', 'Long', 'XL', 'Platformer');

-- CreateEnum
CREATE TYPE "LevelVisibility" AS ENUM ('Listed', 'FriendsOnly', 'Unlisted');

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
    "modBadge" "ModBadge" NOT NULL DEFAULT 'None',

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
CREATE TABLE "Likes" (
    "itemType" "LikeType" NOT NULL,
    "itemId" INTEGER NOT NULL,
    "accountId" INTEGER NOT NULL,
    "isLike" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Likes_pkey" PRIMARY KEY ("itemType","itemId","accountId")
);

-- CreateTable
CREATE TABLE "Levels" (
    "id" SERIAL NOT NULL,
    "gameVersion" INTEGER NOT NULL,
    "accountId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "length" "LevelLength" NOT NULL DEFAULT 'Tiny',
    "officialSongId" INTEGER NOT NULL DEFAULT 0,
    "songId" INTEGER NOT NULL DEFAULT 0,
    "objectCount" INTEGER NOT NULL DEFAULT 0,
    "password" INTEGER NOT NULL DEFAULT 0,
    "originalLevelId" INTEGER NOT NULL DEFAULT 0,
    "coins" INTEGER NOT NULL DEFAULT 0,
    "requestedStars" INTEGER NOT NULL,
    "stars" INTEGER NOT NULL DEFAULT 0,
    "visibility" "LevelVisibility" NOT NULL DEFAULT 'Listed',
    "editorTime" INTEGER NOT NULL DEFAULT 0,
    "editorTimeCopies" INTEGER NOT NULL DEFAULT 0,
    "extraString" TEXT,
    "levelInfo" TEXT,
    "ts" INTEGER,
    "ratingType" "LevelRating" NOT NULL DEFAULT 'None',
    "difficulty" "LevelDifficulty" NOT NULL DEFAULT 'NA',
    "likes" INTEGER NOT NULL DEFAULT 0,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ratedAt" TIMESTAMP(3),
    "isLDM" BOOLEAN NOT NULL DEFAULT false,
    "isTwoPlayer" BOOLEAN NOT NULL DEFAULT false,
    "isAuto" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LevelComments" (
    "id" SERIAL NOT NULL,
    "levelId" INTEGER NOT NULL,
    "accountId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "percent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LevelComments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LevelsData" (
    "id" INTEGER NOT NULL,
    "data" TEXT NOT NULL,

    CONSTRAINT "LevelsData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedData" (
    "id" INTEGER NOT NULL,
    "data" TEXT NOT NULL,
    "gameVersion" INTEGER NOT NULL,
    "binaryVersion" INTEGER NOT NULL,

    CONSTRAINT "SavedData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Songs" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "artistId" INTEGER NOT NULL,
    "artistName" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Songs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Accounts_username_key" ON "Accounts"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Accounts_email_key" ON "Accounts"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Users_extId_key" ON "Users"("extId");

-- CreateIndex
CREATE UNIQUE INDEX "FriendRequests_accountId_toAccountId_key" ON "FriendRequests"("accountId", "toAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Friends_accountId1_accountId2_key" ON "Friends"("accountId1", "accountId2");

-- CreateIndex
CREATE UNIQUE INDEX "Blocks_accountId_targetAccountId_key" ON "Blocks"("accountId", "targetAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Levels_accountId_name_key" ON "Levels"("accountId", "name");

-- AddForeignKey
ALTER TABLE "AccountComments" ADD CONSTRAINT "AccountComments_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LevelComments" ADD CONSTRAINT "LevelComments_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
