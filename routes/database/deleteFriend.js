const Logger = require("../../scripts/Logger");
const { secretMiddleware, requiredBodyMiddleware } = require("../../scripts/middlewares");
const { database, getUser } = require("../../scripts/database");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/removeGJFriend20.php",
		beforeHandler: [secretMiddleware, requiredBodyMiddleware(["accountID", "gjp2", "targetAccountID"])],
		handler: async (req, reply) => {
			const { targetAccountID } = req.body;

			try {
				const { account } = await getUser(req.body, false);
				if (!account) return reply.send("-1");

				const friendship = await database.friends.delete({
					where: {
						OR: [
							{ accountId1: parseInt(targetAccountID), accountId2: account.id },
							{ accountId1: account.id, accountId2: parseInt(targetAccountID) },
						],
					},
				});
				if (!friendship) return reply.send("-1");

				Logger.log(
					"Remove friend",
					`ID: ${Logger.color(Logger.colors.cyan)(friendship.id)}\n`,
					`Account1: ${Logger.color(Logger.colors.gray)(friendship.accountId1)}\n`,
					`Account2: ${Logger.color(Logger.colors.gray)(friendship.accountId2)}`,
				);

				return reply.send("1");
			} catch (error) {
				Logger.error("Remove friend", req.body, error);

				return reply.send("-1");
			}
		},
	});
};
