const Logger = require("../../scripts/Logger");
const { secretMiddleware, requiredBodyMiddleware } = require("../../scripts/middlewares");
const { database } = require("../../scripts/database");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/deleteGJFriendRequests20.php",
		beforeHandler: [secretMiddleware, requiredBodyMiddleware(["accountID", "gjp2", "targetAccountID"])],
		handler: async (req, reply) => {
			const { accountID, gjp2, targetAccountID } = req.body;

			const isSender = req.body.isSender || req.body.isSender === "1";

			if (accountID === targetAccountID) return reply.send("-1");

			try {
				const account = await database.accounts.findFirst({ where: { id: parseInt(accountID), password: gjp2 } });
				if (!account) return reply.send("-1");

				const [friendRequest] = await database.$queryRaw`
					delete from public."FriendRequests"
					where "accountId" = ${parseInt(isSender ? account.id : targetAccountID)}
						and "toAccountId" = ${parseInt(isSender ? targetAccountID : account.id)}
					returning id, "accountId", "toAccountId"`;
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
