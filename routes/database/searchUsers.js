const { database } = require("../../scripts/database");
const { secret, searchUsersPageSize, usernameRegex } = require("../../config/config");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/getGJUsers20.php",
		schema: {
			consumes: ["x-www-form-urlencoded"],
			body: {
				type: "object",
				properties: {
					secret: { type: "string", const: secret },
					str: {
						anyOf: [{ type: "number" }, { type: "string", pattern: usernameRegex.source }],
					},
					page: { type: "number", minimum: 0, default: 0 },
					total: { type: "number", minimum: 0, default: 0 },
				},
				required: ["secret", "str"],
			},
		},
		handler: async (req, reply) => {
			const { str, page, total } = req.body;

			const isId = typeof str === "number";
			let totalCount = total;
			let users = [];

			if (isId) {
				const user = await database.users.findFirst({ where: { extId: String(str), isRegistered: true } });

				if (user) users = [user];
			} else {
				users = await database.users.findMany({
					where: { isRegistered: true, isBanned: false, username: { contains: str, mode: "insensitive" } },
					orderBy: { stars: "desc" },
					skip: page * searchUsersPageSize,
					take: searchUsersPageSize,
				});
			}

			if (!users.length) return reply.send("-2");

			if (users.length < searchUsersPageSize) totalCount = page * searchUsersPageSize + users.length;
			else if (!totalCount) {
				totalCount = await database.users.count({
					where: { isRegistered: true, isBanned: false, username: { contains: str, mode: "insensitive" } },
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
					.join("|")}#${totalCount}:${page * searchUsersPageSize}:${searchUsersPageSize}`,
			);
		},
	});
};
