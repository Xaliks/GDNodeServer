const _ = require("lodash");
const { secretMiddleware, requiredBodyMiddleware } = require("../../scripts/middlewares");
const { database, getUser } = require("../../scripts/database");
const { showNotRegisteredUsersInLeaderboard } = require("../../config/config");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/getGJScores20.php",
		beforeHandler: [secretMiddleware, requiredBodyMiddleware(["type", "count"])],
		handler: async (req, reply) => {
			const { type, count, accountID, gjp2, udid } = req.body;

			let users = [];
			const take = Math.min(count, 200);
			const where = { isBanned: false };
			if (!showNotRegisteredUsersInLeaderboard) where.isRegistered = true;

			if (type === "top") {
				users = await database.users.findMany({
					where: { ...where, stars: { gt: 0 } },
					orderBy: { stars: "desc" },
					take,
				});
			}

			if (type === "friends") {
				const account = await database.accounts.findFirst({ where: { id: parseInt(accountID), password: gjp2 } });
				if (!account) return reply.send("-1");

				users = [await database.users.findFirst()];
			}

			if (type === "relative") {
				if (!accountID && !udid) return reply.send("-1");

				const user = await getUser(accountID || udid);
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
					where: { ...where, creatorPoints: { gt: 0 } },
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
							[3, user.stars],
							[4, user.demons],
							[6, user.rank ?? i + 1],
							[7, user.extId],
							[8, user.creatorPoints],
							[9, user.displayIcon],
							[10, user.mainColor],
							[11, user.secondColor],
							[13, user.coins],
							[14, user.displayIconType],
							[15, user.special],
							[16, isNaN(user.extId) ? 0 : user.extId],
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
