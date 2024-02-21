const Logger = require("../../scripts/Logger");
const { secretMiddleware, requiredBodyMiddleware } = require("../../scripts/middlewares");
const { database, getUser } = require("../../scripts/database");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/deleteGJFriendRequests20.php",
		beforeHandler: [secretMiddleware, requiredBodyMiddleware(["accountID", "gjp2", "targetAccountID"])],
		handler: async (req, reply) => {
			const { accountID, targetAccountID } = req.body;

			const isSender = req.body.isSender && req.body.isSender === "1";

			if (accountID === targetAccountID) return reply.send("-1");

			try {
				const { account } = await getUser(req.body, false);
				if (!account) return reply.send("-1");

				const friendRequest = await database.friendRequests.delete({
					where: {
						accountId_toAccountId: {
							accountId: isSender ? account.id : Number(targetAccountID),
							toAccountId: isSender ? Number(targetAccountID) : account.id,
						},
					},
				});
				if (!friendRequest) return reply.send("-1");

				Logger.log(
					"Delete friend request",
					`ID: ${Logger.color(Logger.colors.cyan)(friendRequest.id)}\n`,
					`From: ${Logger.color(Logger.colors.gray)(friendRequest.accountId)}\n`,
					`To: ${Logger.color(Logger.colors.gray)(friendRequest.toAccountId)}`,
				);

				return reply.send("1");
			} catch (error) {
				Logger.error("Delete friend request", req.body, error);

				return reply.send("-1");
			}
		},
	});
};
