const _ = require("lodash");
const { database, getUser } = require("../../scripts/database");
const { showNotRegisteredUsersInLeaderboard, secret, gjp2Pattern, udidPattern } = require("../../config/config");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/getGJScores20.php",
		schema: {
			consumes: ["x-www-form-urlencoded"],
			body: {
				type: "object",
				properties: {
					secret: { type: "string", const: secret },
					accountID: { type: "number", minimum: 1 },
					gjp2: { type: "string", pattern: gjp2Pattern },
					udid: { type: "string", pattern: udidPattern },
					type: { type: "string", enum: ["top", "friends", "relative", "creators"], default: "top" },
					count: { type: "number", minimum: 1, maximum: 200, default: 100 },
				},
				required: ["secret"],
			},
		},
		handler: async (req, reply) => {
			const { type, count: take } = req.body;

			let users = [];
			const where = { isBanned: false };
			if (!showNotRegisteredUsersInLeaderboard) where.isRegistered = true;

			if (type === "top") {
				users = await database.users.findMany({
					where: { ...where, OR: [{ stars: { gt: 0 } }, { moons: { gt: 0 } }] },
					orderBy: [{ stars: "desc" }, { moons: "desc" }],
					take,
				});
			}

			if (type === "friends") {
				const { account } = await getUser(req.body, false);
				if (!account) return reply.send("-1");

				const friendIds = await database.friends
					.findMany({ where: { OR: [{ accountId1: account.id }, { accountId2: account.id }] } })
					.then((friends) =>
						friends.map((friend) => (friend.accountId1 === account.id ? friend.accountId2 : friend.accountId1)),
					);

				users = await database.users.findMany({
					where: { extId: { in: friendIds.concat(account.id).map((id) => String(id)) } },
					orderBy: [{ stars: "desc" }, { moons: "desc" }],
					take,
				});
			}

			if (type === "relative") {
				const { account, user } = await getUser(req.body);
				if (account === 0 || !user) return reply.send("-1");

				const userRank = await database.users.count({ where: { ...where, stars: { gte: user.stars || 1 } } });

				if (!user.stars) {
					const greaterUsers = await database.users.findMany({
						where: { ...where, stars: { gt: 0 } },
						orderBy: { stars: "asc" },
						take,
					});

					users = [...greaterUsers, user].map((user, i) => ({ ...user, rank: userRank - greaterUsers.length + i + 1 }));
				} else {
					const takeCount = Math.floor(take / 2);

					let relativeUsers;
					if (showNotRegisteredUsersInLeaderboard) {
						relativeUsers = await database.$queryRaw`select * from (
							(
								select *
								from "public"."Users"
								where stars < ${user.stars}
									and stars > 0
									and "isBanned" = false
								order by stars desc
								limit ${takeCount}
							)
							union
							(
								select *
								from "public"."Users"
								where stars >= ${user.stars}
									and "isBanned" = false
									and id != ${user.id}
								order by stars asc
								limit ${takeCount}
							)
						) order by stars desc`;
					} else {
						relativeUsers = await database.$queryRaw`select * from (
							(
								select *
								from "public"."Users"
								where stars < ${user.stars}
									and stars > 0
									and "isBanned" = false
									and "isRegistered" = true
								order by stars desc
								limit ${takeCount}
							)
							union
							(
								select *
								from "public"."Users"
								where stars >= ${user.stars}
									and "isBanned" = false
									and "isRegistered" = true
									and id != ${user.id}
								order by stars asc
								limit ${takeCount}
							)
						) order by stars desc`;
					}

					const [greaterUsers, lowerUsers] = _.partition(relativeUsers, (u) => u.stars >= user.stars);

					user.rank = userRank;
					users = [
						...greaterUsers.map((user, i) => ({ ...user, rank: userRank - greaterUsers.length - i })),
						user,
						...lowerUsers.map((user, i) => ({ ...user, rank: userRank + i + 1 })),
					];
				}
			}

			if (type === "creators") {
				users = await database.users.findMany({
					where: { ...where, isCreatorBanned: false, creatorPoints: { gt: 0 } },
					orderBy: { creatorPoints: "desc" },
					take,
				});
			}

			return reply.send(
				users
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

					.join("|"),
			);
		},
	});
};
