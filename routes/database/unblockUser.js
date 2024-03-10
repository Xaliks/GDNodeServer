const Logger = require("../../scripts/Logger");
const { secret } = require("../../config/config");
const { database, checkPassword } = require("../../scripts/database");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/unblockGJUser20.php",
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

				const block = await database.blocks
					.delete({
						where: { accountId_targetAccountId: { accountId: accountID, targetAccountId: targetAccountID } },
					})
					.catch(() => null);
				if (!block) return reply.send("1");

				Logger.log(
					"Unblock user",
					`ID: ${Logger.colors.cyan(block.id)}\n`,
					`Account: ${Logger.colors.cyan(accountID)}\n`,
					`Target: ${Logger.colors.cyan(targetAccountID)}`,
				);

				return reply.send("1");
			} catch (error) {
				Logger.error("Unblock user", req.body, error);

				return reply.send("-1");
			}
		},
	});
};
