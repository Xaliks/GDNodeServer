const { database, getPassword } = require("../../scripts/database");
const { showNotRegisteredUsersInLeaderboard, secret } = require("../../config/config");
const { Constants, dateToRelative } = require("../../scripts/util");
const { toSafeBase64 } = require("../../scripts/security");

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
					accountID: { type: "number" },
					targetAccountID: { type: "number", minimum: 1 },
				},
				required: ["secret", "targetAccountID"],
			},
		},
		handler: async (req, reply) => {
			const { accountID, targetAccountID } = req.body;

			const targetAccount = await database.accounts.findFirst({ where: { id: targetAccountID } });
			if (!targetAccount?.isActive) return reply.send("-1");

			let isMe = false;
			if (accountID === targetAccountID && targetAccount.password === getPassword(req.body)) isMe = true;

			if (!isMe && accountID) {
				const blocked = await database.blocks.findFirst({
					where: {
						OR: [
							{ accountId: targetAccount.id, targetAccountId: accountID },
							{ accountId: accountID, targetAccountId: targetAccount.id },
						],
					},
				});

				if (blocked) return reply.send("-1");
			}

			const user = await database.users.findFirst({ where: { extId: String(targetAccount.id) } });

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
					database.messages.count({ where: { toAccountId: targetAccount.id, isNew: true } }),
					database.friendRequests.count({ where: { toAccountId: targetAccount.id, isNew: true } }),
					database.friends.count({
						where: {
							OR: [
								{ accountId1: targetAccount.id, isNewFor1: true },
								{ accountId2: targetAccount.id, isNewFor2: true },
							],
						},
					}),
				]);
			} else if (accountID) {
				friendship = await database.friends.findFirst({
					where: {
						OR: [
							{ accountId1: targetAccount.id, accountId2: accountID },
							{ accountId1: accountID, accountId2: targetAccount.id },
						],
					},
				});

				if (friendship) friendState = 1;
				else {
					friendRequest = await database.friendRequests.findFirst({
						where: {
							OR: [
								{ accountId: targetAccount.id, toAccountId: accountID },
								{ accountId: accountID, toAccountId: targetAccount.id },
							],
						},
					});

					if (friendRequest) {
						if (friendRequest.toAccountId === targetAccount.id) friendState = 4;
						else friendState = 3;
					}
				}
			}

			const result = [
				[1, targetAccount.username],
				[2, user.id],
				[16, targetAccount.id],
				[3, user.stars],
				[4, user.demons],
				[8, user.creatorPoints],
				[13, user.coins],
				[17, user.userCoins],
				[52, user.moons],
				[10, user.mainColor],
				[11, user.secondColor],
				[51, user.glowColor],
				[20, targetAccount.youtube ?? ""],
				[44, targetAccount.twitter ?? ""],
				[45, targetAccount.twitch ?? ""],
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
				[29, targetAccount.id ? 1 : 0],
				[30, rank + 1],
				[18, targetAccount.messageState],
				[19, targetAccount.friendRequestState],
				[50, targetAccount.commentHistoryState],
				[49, Constants.modBadge[targetAccount.modBadge]],
				[55, user.demonsInfo],
				// [56, user.levelsInfo], auto easy normal hard harder insane daily gauntlet
				// [57, user.platformersInfo], auto easy normal hard harder insane daily gauntlet
				[31, friendState],
			];

			if (friendState === 3) {
				result.push(
					[32, friendRequest.id],
					[35, toSafeBase64(friendRequest.comment ?? "")],
					[37, dateToRelative(friendRequest.createdAt, 1)],
				);
			}

			if (isMe) result.push([38, newMessagesCount], [39, newFriendRequestsCount], [40, newFriendsCount]);

			return reply.send(result.map(([key, value]) => `${key}:${value}`).join(":"));
		},
	});
};
