const { secretMiddleware, requiredBodyMiddleware } = require("../../scripts/middlewares");
const { database } = require("../../scripts/database");
const { showNotRegisteredUsersInLeaderboard } = require("../../config/config");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/getGJUserInfo20.php",
		beforeHandler: [secretMiddleware, requiredBodyMiddleware(["targetAccountID"])],
		handler: async (req, reply) => {
			const { accountID, gjp2, targetAccountID } = req.body;

			const [account, user] = await database.$transaction([
				database.accounts.findFirst({ where: { id: parseInt(targetAccountID) } }),
				database.users.findFirst({ where: { extId: targetAccountID } }),
			]);
			if (!account || !user) return reply.send("-1");

			let isMe = false;
			if (accountID === targetAccountID && account.password === gjp2) isMe = true;

			const where = { isBanned: false, stars: { gt: user.stars } };
			if (!showNotRegisteredUsersInLeaderboard) where.isRegistered = true;

			const transaction = [database.users.count({ where })];

			if (isMe) {
				transaction.push(
					database.messages.count({ where: { toAccountId: account.id, isNew: true } }),
					database.friendRequests.count({ where: { toAccountId: account.id, isNew: true } }),
				);
			}
			const [rank, newMessagesCount, newFriendRequestsCount] = await database.$transaction(transaction);

			const result = [
				[1, account.username],
				[2, user.id],
				[16, account.id],
				[3, user.stars],
				[4, user.demons],
				[55, "0,0,0,0,0,0,0,0,0,0,0,0"], // easyDemons,mediumDemons,hardDemons,insaneDemons,extremeDemons,easyPlatformerDemons,mediumPlatformerDemons,hardPlatformerDemons,insanePlatformerDemons,extremePlatformerDemons,weeklyDemons,gauntletDemons
				[8, user.creatorPoints],
				[13, user.coins],
				[17, user.userCoins],
				[52, user.moons],
				[10, user.mainColor],
				[11, user.secondColor],
				[51, user.glowColor],
				[20, account.youtube ?? ""],
				[44, account.twitter ?? ""],
				[45, account.twitch ?? ""],
				[46, user.diamonds],
				[21, user.cube],
				[22, user.ship],
				[23, user.ball],
				[24, user.ufo],
				[25, user.wave],
				[26, user.robot],
				[43, user.spider],
				[53, user.swing],
				[54, user.jetpack],
				[47, user.explosion],
				[28, user.glow ? 1 : 0],
				[29, Boolean(account.id)],
				[30, rank + 1], // rank leaderboard
				[18, account.messageState], // 0 - all, 1 - friends, 2 - none
				[19, account.friendRequestState], // 0 - accept, 1 - none
				[50, account.commentHistorySate], // 0 - all, 1 - friends, 2 - me
				[49, account.modBadge], // 0 - none; 1 - moderator; 2 - elder moderator; 3 - leaderboard moderator
			];

			if (isMe) {
				result.push(
					[31, 0], // friend state (0 - not friend; 1 - friend; 2 - INCOMING request; 3 - OUTGOING request)
					[38, newMessagesCount], // new messages count
					[39, newFriendRequestsCount], // friend requests count
					[40, 25], // new friends count
				);
			}

			return reply.send(result.map(([key, value]) => `${key}:${value}`).join(":"));
		},
	});
};
