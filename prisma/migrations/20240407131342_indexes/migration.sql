-- CreateIndex
CREATE INDEX "AccountComments_accountId_idx" ON "AccountComments"("accountId");

-- CreateIndex
CREATE INDEX "Comments_levelId_idx" ON "Comments"("levelId");

-- CreateIndex
CREATE INDEX "Comments_accountId_idx" ON "Comments"("accountId");

-- CreateIndex
CREATE INDEX "Levels_visibility_idx" ON "Levels"("visibility");

-- CreateIndex
CREATE INDEX "Levels_ratingType_idx" ON "Levels"("ratingType");

-- CreateIndex
CREATE INDEX "Levels_coins_idx" ON "Levels"("coins");

-- CreateIndex
CREATE INDEX "Levels_name_idx" ON "Levels"("name");

-- CreateIndex
CREATE INDEX "Levels_likes_idx" ON "Levels"("likes");

-- CreateIndex
CREATE INDEX "Levels_downloads_idx" ON "Levels"("downloads");

-- CreateIndex
CREATE INDEX "Levels_createdAt_idx" ON "Levels"("createdAt");

-- CreateIndex
CREATE INDEX "Lists_accountId_name_idx" ON "Lists"("accountId", "name");

-- CreateIndex
CREATE INDEX "Lists_reward_idx" ON "Lists"("reward");

-- CreateIndex
CREATE INDEX "Lists_difficulty_idx" ON "Lists"("difficulty");

-- CreateIndex
CREATE INDEX "Lists_ratingType_idx" ON "Lists"("ratingType");

-- CreateIndex
CREATE INDEX "Lists_likes_idx" ON "Lists"("likes");

-- CreateIndex
CREATE INDEX "Lists_downloads_idx" ON "Lists"("downloads");

-- CreateIndex
CREATE INDEX "Lists_createdAt_idx" ON "Lists"("createdAt");

-- CreateIndex
CREATE INDEX "Messages_accountId_idx" ON "Messages"("accountId");

-- CreateIndex
CREATE INDEX "Messages_toAccountId_idx" ON "Messages"("toAccountId");

-- CreateIndex
CREATE INDEX "Users_username_idx" ON "Users"("username");

-- CreateIndex
CREATE INDEX "Users_stars_moons_idx" ON "Users"("stars", "moons");

-- CreateIndex
CREATE INDEX "Users_creatorPoints_idx" ON "Users"("creatorPoints");

-- CreateIndex
CREATE INDEX "Users_isRegistered_idx" ON "Users"("isRegistered");

-- CreateIndex
CREATE INDEX "Users_isBanned_idx" ON "Users"("isBanned");
