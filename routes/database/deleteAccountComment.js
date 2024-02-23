const Logger = require("../../scripts/Logger");
const { secret, gjp2Pattern } = require("../../config/config");
const { database, getUser } = require("../../scripts/database");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/deleteGJAccComment20.php",
		schema: {
			consumes: ["x-www-form-urlencoded"],
			body: {
				type: "object",
				properties: {
					secret: { type: "string", const: secret },
					accountID: { type: "number", minimum: 1 },
					gjp2: { type: "string", pattern: gjp2Pattern },
					commentID: { type: "number", minimum: 1 },
				},
				required: ["secret", "accountID", "gjp2", "commentID"],
			},
		},
		handler: async (req, reply) => {
			const { commentID } = req.body;

			try {
				const { account } = await getUser(req.body, false);
				if (!account) return reply.send("-1");

				await database.accountComments.deleteMany({ where: { id: commentID } });

				Logger.log(
					"Delete account comment",
					`ID: ${Logger.color(Logger.colors.cyan)(commentID)}\n`,
					`Account: ${Logger.color(Logger.colors.cyan)(account.username)}/${Logger.color(Logger.colors.gray)(account.id)}`,
				);

				return reply.send("1");
			} catch (error) {
				Logger.error("Delete account comment", req.body, error);

				return reply.send("-1");
			}
		},
	});
};
