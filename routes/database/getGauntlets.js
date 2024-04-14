const { database } = require("../../scripts/database");
const { secret } = require("../../config/config");
const { getSolo2 } = require("../../scripts/security");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/getGJGauntlets21.php",
		schema: {
			consumes: ["x-www-form-urlencoded"],
			body: {
				type: "object",
				properties: {
					secret: { type: "string", const: secret },
					special: { type: "number", enum: [0, 1], default: 0 },
				},
				required: ["secret"],
			},
		},
		handler: async (req, reply) => {
			const gauntlets = await database.gauntlets.findMany({
				orderBy: { id: "asc" },
				take: req.body.special === 1 ? 8 : 50, // 8 for 2.1; 50 for 2.2
			});

			return reply.send(
				`${gauntlets
					.map(
						(gauntlet) =>
							`1:${gauntlet.id}:3:${gauntlet.levelId1},${gauntlet.levelId2},${gauntlet.levelId3},${gauntlet.levelId4},${gauntlet.levelId5}`,
					)
					.join("|")}#${getSolo2(
					gauntlets
						.map(
							(gauntlet) =>
								`${gauntlet.id}${gauntlet.levelId1},${gauntlet.levelId2},${gauntlet.levelId3},${gauntlet.levelId4},${gauntlet.levelId5}`,
						)
						.join(""),
				)}`,
			);
		},
	});
};
