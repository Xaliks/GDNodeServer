const Logger = require("../../scripts/Logger");
const { secretMiddleware, requiredBodyMiddleware } = require("../../scripts/middlewares");
const { database } = require("../../scripts/database");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/removeGJFriend20.php",
		beforeHandler: [secretMiddleware, requiredBodyMiddleware(["accountID", "gjp2", "targetAccountID"])],
		handler: async (req, reply) => {
			const { accountID, gjp2, targetAccountID } = req.body;

			try {
				const account = await database.accounts.findFirst({ where: { id: parseInt(accountID), password: gjp2 } });
				if (!account) return reply.send("-1");

				const [friendship] = await database.$queryRaw`
					delete from public."Friends"
					where (
						"accountId1" = ${parseInt(targetAccountID)}
							and "accountId2" = ${parseInt(accountID)}
					)
					or (
						"accountId1" = ${parseInt(accountID)}
							and "accountId2" = ${parseInt(targetAccountID)}
					)
					returning id, "accountId1", "accountId2"`;
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
