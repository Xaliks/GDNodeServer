const Logger = require("../../scripts/Logger");
const { secretMiddleware, requiredBodyMiddleware } = require("../../scripts/middlewares");
const { database } = require("../../scripts/database");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/readGJFriendRequest20.php",
		beforeHandler: [secretMiddleware, requiredBodyMiddleware(["accountID", "gjp2", "requestID"])],
		handler: async (req, reply) => {
			const { accountID, gjp2, requestID } = req.body;

			try {
				const account = await database.accounts.findFirst({ where: { id: parseInt(accountID), password: gjp2 } });
				if (!account) return reply.send("-1");

				const friendRequest = await database.friendRequests
					.update({
						where: { id: parseInt(requestID), toAccountId: account.id },
						data: { isNew: false },
					})
					.catch(() => null);
				if (!friendRequest) return reply.send("-1");

				Logger.log(
					"Read friend request",
					`ID: ${Logger.color(Logger.colors.cyan)(friendRequest.id)}\n`,
					`From: ${Logger.color(Logger.colors.gray)(friendRequest.accountId)}\n`,
					`To: ${Logger.color(Logger.colors.cyan)(account.username)}/${Logger.color(Logger.colors.gray)(friendRequest.toAccountId)}`,
				);

				return reply.send("1");
			} catch (error) {
				Logger.error("Read friend request", req.body, error);

				return reply.send("-1");
			}
		},
	});
};
