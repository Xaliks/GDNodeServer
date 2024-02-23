const Logger = require("../../scripts/Logger");
const { secret, gjp2Pattern } = require("../../config/config");
const { database, getUser } = require("../../scripts/database");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/removeGJFriend20.php",
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
				required: ["secret", "accountID", "gjp2", "targetAccountID"],
			},
		},
		handler: async (req, reply) => {
			const { accountID, targetAccountID } = req.body;

			if (accountID === targetAccountID) return reply.send("-1");

			try {
				const { account } = await getUser(req.body, false);
				if (!account) return reply.send("-1");

				await database.friends.deleteMany({
					where: {
						OR: [
							{ accountId1: targetAccountID, accountId2: account.id },
							{ accountId1: account.id, accountId2: targetAccountID },
						],
					},
				});

				Logger.log(
					"Remove friend",
					`Account1: ${Logger.color(Logger.colors.gray)(account.id)}\n`,
					`Account2: ${Logger.color(Logger.colors.gray)(targetAccountID)}`,
				);

				return reply.send("1");
			} catch (error) {
				Logger.error("Remove friend", req.body, error);

				return reply.send("-1");
			}
		},
	});
};
