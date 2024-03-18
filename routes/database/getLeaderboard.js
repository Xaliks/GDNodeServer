const { database, checkPassword, getUser } = require("../../scripts/database");
const { showNotRegisteredUsersInLeaderboard, secret, udidPattern } = require("../../config/config");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	// 1.9, 2.0-2.2
	["/getGJScores19.php", "/getGJScores20.php"].forEach((url) =>
		fastify.route({
			method: ["POST"],
			url,
			schema: {
				consumes: ["x-www-form-urlencoded"],
				body: {
					type: "object",
					properties: {
						secret: { type: "string", const: secret },
						accountID: { type: "number" },
						udid: { type: "string", pattern: udidPattern },
						type: { type: "string", enum: ["top", "week", "friends", "relative", "creators"], default: "top" },
						count: { type: "number", minimum: 1, maximum: 200, default: 100 },
					},
					required: ["secret"],
				},
			},
			handler: async (req, reply) => {
				const { accountID, type, count: take } = req.body;

				let users = [];
				const where = { isBanned: false };
				if (!showNotRegisteredUsersInLeaderboard) where.isRegistered = true;

				if (type === "top") {
					users = await database.users.findMany({
						where: { ...where, stars: { gt: 0 } },
						orderBy: [{ stars: "desc" }, { moons: "desc" }],
						take,
					});
				}

				if (type === "friends") {
					if (!(await checkPassword(req.body))) return reply.send("-1");

					const friendIds = await database.friends
						.findMany({ where: { OR: [{ accountId1: accountID }, { accountId2: accountID }] } })
						.then((friends) =>
							friends.map((friend) => (friend.accountId1 === accountID ? friend.accountId2 : friend.accountId1)),
						);

					users = await database.users.findMany({
						where: { extId: { in: friendIds.concat(accountID).map((id) => String(id)) } },
						orderBy: [{ stars: "desc" }, { moons: "desc" }],
						take,
					});
				}

				if (type === "relative" || type === "week") {
					const { account, user } = await getUser(req.body);
					if (account === 0 || !user) return reply.send("-1");

					const userRank = await database.users.count({ where: { ...where, stars: { gte: user.stars || 1 } } });

					if (!user.stars) {
						const greaterUsers = await database.users.findMany({
							where: { ...where, stars: { gt: 0 } },
							orderBy: [{ stars: "asc" }, { moons: "asc" }],
							take,
						});

						users = [...greaterUsers, user].map((user, i) => ({ ...user, rank: userRank - greaterUsers.length + i + 1 }));
					} else {
						const highestRank = Math.floor(userRank / take) * take + 1;
						const relativeUsers = await database.users.findMany({
							where: { ...where, stars: { gt: 0 } },
							orderBy: [{ stars: "desc" }, { moons: "desc" }],
							skip: highestRank - 1,
							take,
						});

						users = relativeUsers.map((user, i) => ({ ...user, rank: highestRank + i }));
					}
				}

				if (type === "creators") {
					users = await database.users.findMany({
						where: { ...where, isCreatorBanned: false, creatorPoints: { gt: 0 } },
						orderBy: { creatorPoints: "desc" },
						take,
					});
				}

				return reply.send(sendUsers(users));
			},
		}),
	);

	fastify.route({
		method: ["POST"],
		url: "/getGJCreators19.php",
		schema: {
			consumes: ["x-www-form-urlencoded"],
			body: {
				type: "object",
				properties: {
					secret: { type: "string", const: secret },
					count: { type: "number", minimum: 1, maximum: 200, default: 100 },
				},
				required: ["secret"],
			},
		},
		handler: async (req, reply) => {
			const where = { isBanned: false, isCreatorBanned: false, creatorPoints: { gt: 0 } };
			if (!showNotRegisteredUsersInLeaderboard) where.isRegistered = true;

			const users = await database.users.findMany({ where, orderBy: { creatorPoints: "desc" }, take: req.body.count });

			return reply.send(sendUsers(users));
		},
	});

	function sendUsers(users) {
		return users
			.map((user, i) => {
				return [
					[1, user.username],
					[2, user.id],
					[7, user.extId],
					[16, Number(user.extId) || 0],

					[3, user.stars],
					[4, user.demons],
					[6, user.rank ?? i + 1],
					[8, user.creatorPoints],
					[9, user.displayIcon],
					[10, user.mainColor],
					[11, user.secondColor],
					[13, user.coins],
					[14, user.displayIconType],
					[15, user.special],
					[17, user.userCoins],
					[46, user.diamonds],
					[52, user.moons],
				]
					.map(([key, value]) => `${key}:${value}`)
					.join(":");
			})

			.join("|");
	}
};
