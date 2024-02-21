const Logger = require("../../scripts/Logger");
const { secretMiddleware, requiredBodyMiddleware } = require("../../scripts/middlewares");
const { database, getUser } = require("../../scripts/database");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/unblockGJUser20.php",
		beforeHandler: [secretMiddleware, requiredBodyMiddleware(["accountID", "gjp2", "targetAccountID"])],
		handler: async (req, reply) => {
			const { accountID, targetAccountID } = req.body;

			if (accountID === targetAccountID) return reply.send("-1");

			try {
				const { account } = await getUser(req.body, false);
				if (!account) return reply.send("-1");

				const block = await database.blocks
					.delete({
						where: { accountId_targetAccountId: { accountId: account.id, targetAccountId: parseInt(targetAccountID) } },
					})
					.catch(() => null);
				if (!block) return reply.send("1");

				Logger.log(
					"Unblock user",
					`ID: ${Logger.color(Logger.colors.cyan)(block.id)}\n`,
					`Account: ${Logger.color(Logger.colors.cyan)(account.username)}/${Logger.color(Logger.colors.gray)(account.id)}\n`,
					`Target: ${Logger.color(Logger.colors.gray)(targetAccountID)}`,
				);

				return reply.send("1");
			} catch (error) {
				Logger.error("Unblock user", req.body, error);

				return reply.send("-1");
			}
		},
	});
};
