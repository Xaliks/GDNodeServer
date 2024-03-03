const Logger = require("../../scripts/Logger");
const { database } = require("../../scripts/database");
const { secret } = require("../../config/config");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/rateGJStars211.php",
		schema: {
			consumes: ["x-www-form-urlencoded"],
			body: {
				type: "object",
				properties: {
					secret: { type: "string", const: secret },
					levelID: { type: "number", minimum: 1 },
					stars: { type: "number", enum: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
				},
				required: ["secret", "levelID", "stars"],
			},
		},
		handler: async (req, reply) => {
			const { accountID, udid, levelID } = req.body;

			try {
				const level = await database.levels.findFirst({ where: { id: levelID } });
				if (!level) return reply.send("-1");

				// [TODO]: check if user is mod. Create permissions

				Logger.log(
					"Create level rate",
					`Level ID: ${Logger.color(Logger.colors.cyan)(level.id)}\n`,
					`Account: ${Logger.color(Logger.colors.gray)(accountID || udid || 0)}`,
				);

				return reply.send("1");
			} catch (error) {
				Logger.error("Create level rate", req.body, error);

				return reply.send("-1");
			}
		},
	});
};
