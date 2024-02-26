const { database } = require("../../scripts/database");
const { showNotRegisteredUsersInLeaderboard, secret, gjp2Pattern } = require("../../config/config");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/getGJUserInfo20.php",
		schema: {
			consumes: ["x-www-form-urlencoded"],
			body: {
				type: "object",
				properties: {
					secret: { type: "string", const: secret },
					accountID: { type: "number", minimum: 1 },
					gjp2: { type: "string", pattern: gjp2Pattern },
					targetAccountID: { type: "number", minimum: 1 },
				},
				required: ["secret", "targetAccountID"],
			},
		},
		handler: async (req, reply) => {
			const { accountID, gjp2, targetAccountID } = req.body;

			const account = await database.accounts.findFirst({ where: { id: targetAccountID, isActive: true } });
			if (!account) return reply.send("-1");

			let isMe = false;
			if (accountID === targetAccountID && account.password === gjp2) isMe = true;

			if (!isMe && accountID) {
				const blocked = await database.blocks.findFirst({
					where: {
						OR: [
							{ accountId: account.id, targetAccountId: accountID },
							{ accountId: accountID, targetAccountId: account.id },
						],
					},
				});

				if (blocked) return reply.send("-1");
			}

			const user = await database.users.findFirst({ where: { extId: String(account.id) } });

			const where = { isBanned: false, stars: { gt: user.stars } };
			if (!showNotRegisteredUsersInLeaderboard) where.isRegistered = true;
			const rank = await database.users.count({ where });

			let newMessagesCount;
			let newFriendRequestsCount;
			let newFriendsCount;
			let friendRequest;
			let friendship;
			let friendState = 0;

			if (isMe) {
				[newMessagesCount, newFriendRequestsCount, newFriendsCount] = await database.$transaction([
					database.messages.count({ where: { toAccountId: account.id, isNew: true } }),
					database.friendRequests.count({ where: { toAccountId: account.id, isNew: true } }),
					database.friends.count({
						where: {
							OR: [
								{ accountId1: account.id, isNewFor1: true },
								{ accountId2: account.id, isNewFor2: true },
							],
						},
					}),
				]);
			} else {
				friendship = await database.friends.findFirst({
					where: { OR: [{ accountId1: account.id }, { accountId2: account.id }] },
				});
				if (friendship) friendState = 1;
				else {
					friendRequest = await database.friendRequests.findFirst({
						where: { OR: [{ accountId: account.id }, { toAccountId: account.id }] },
					});

					if (friendRequest?.toAccountId === account.id) friendState = 2;
					else if (friendRequest?.accountId === account.id) friendState = 3;
				}
			}

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
				[29, Boolean(account.id) ? 1 : 0],
				[30, rank + 1],
				[18, account.messageState],
				[19, account.friendRequestState],
				[50, account.commentHistoryState],
				[49, account.modBadge],
				[31, friendState],
			];

			if (isMe) {
				result.push([38, newMessagesCount], [39, newFriendRequestsCount], [40, newFriendsCount]);
			}

			return reply.send(result.map(([key, value]) => `${key}:${value}`).join(":"));
		},
	});
};
