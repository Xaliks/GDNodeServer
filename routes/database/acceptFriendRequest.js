const Logger = require("../../scripts/Logger");
const { secretMiddleware, requiredBodyMiddleware } = require("../../scripts/middlewares");
const { database } = require("../../scripts/database");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/acceptGJFriendRequest20.php",
		beforeHandler: [secretMiddleware, requiredBodyMiddleware(["accountID", "gjp2", "requestID", "targetAccountID"])],
		handler: async (req, reply) => {
			const { accountID, gjp2, targetAccountID, requestID } = req.body;

			if (accountID === targetAccountID) return reply.send("-1");

			try {
				const account = await database.accounts.findFirst({ where: { id: parseInt(accountID), password: gjp2 } });
				if (!account) return reply.send("-1");

				const friendRequest = await database.friendRequests
					.delete({ where: { id: parseInt(requestID), accountId: parseInt(targetAccountID), toAccountId: account.id } })
					.catch(() => null);
				if (!friendRequest) return reply.send("-1");

				await database.friends.create({ data: { accountId1: account.id, accountId2: friendRequest.accountId } });

				Logger.log(
					"Accept friend request",
					`ID: ${Logger.color(Logger.colors.cyan)(friendRequest.id)}\n`,
					`From: ${Logger.color(Logger.colors.gray)(friendRequest.accountId)}\n`,
					`To: ${Logger.color(Logger.colors.cyan)(account.username)}/${Logger.color(Logger.colors.gray)(account.id)}`,
				);

				return reply.send("1");
			} catch (error) {
				Logger.error("Accept friend request", req.body, error);

				return reply.send("-1");
			}
		},
	});
};
