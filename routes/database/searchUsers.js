const { secretMiddleware, requiredBodyMiddleware } = require("../../scripts/middlewares");
const { database } = require("../../scripts/database");
const { searchUsersPageSize } = require("../../config/config");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/getGJUsers20.php",
		beforeHandler: [secretMiddleware, requiredBodyMiddleware(["str"])],
		handler: async (req, reply) => {
			const { str } = req.body;
			const page = parseInt(req.body.page) ?? 0;

			const users = await database.users.findMany({
				where: { isRegistered: true, isBanned: false, username: { contains: str } },
				orderBy: { stars: "desc" },
				skip: page * searchUsersPageSize,
				take: searchUsersPageSize,
			});
			if (!users.length) return reply.send("-2");

			let totalCount;
			if (users.length < searchUsersPageSize) totalCount = page * searchUsersPageSize + users.length;
			else {
				totalCount = await database.users.count({
					where: { isRegistered: true, isBanned: false, username: { contains: str } },
				});
			}

			reply.send(
				`${users
					.map((user) => {
						return [
							[1, user.username],
							[2, user.id],
							[16, user.extId],
							[3, user.stars],
							[52, user.moons],
							[4, user.demons],
							[8, user.creatorPoints],
							[9, user.displayIcon],
							[14, user.displayIconType],
							[15, user.special],
							[13, user.coins],
							[17, user.userCoins],
							[46, user.diamonds],
							[10, user.mainColor],
							[11, user.secondColor],
							[51, user.glowColor],
						]
							.map(([key, value]) => `${key}:${value}`)
							.join(":");
					})
					.join("|")}#${totalCount}:${page}:${searchUsersPageSize}`,
			);
		},
	});
};
