const Logger = require("../../scripts/Logger");
const { secret } = require("../../config/config");
const { database, checkPassword } = require("../../scripts/database");

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
					accountID: { type: "number" },
					targetAccountID: { type: "number", minimum: 1 },
				},
				required: ["secret", "accountID", "targetAccountID"],
			},
		},
		handler: async (req, reply) => {
			const { accountID, targetAccountID } = req.body;

			if (accountID === targetAccountID) return reply.send("-1");

			try {
				if (!(await checkPassword(req.body))) return reply.send("-1");

				await database.friends.deleteMany({
					where: {
						OR: [
							{ accountId1: targetAccountID, accountId2: accountID },
							{ accountId1: accountID, accountId2: targetAccountID },
						],
					},
				});

				Logger.log(
					"Remove friend",
					`Account1: ${Logger.colors.cyan(accountID)}\n`,
					`Account2: ${Logger.colors.cyan(targetAccountID)}`,
				);

				return reply.send("1");
			} catch (error) {
				Logger.error("Remove friend", req.body, error);

				return reply.send("-1");
			}
		},
	});
};
