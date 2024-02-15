const Logger = require("../../scripts/Logger");
const { secretMiddleware, requiredBodyMiddleware } = require("../../scripts/middlewares");
const { database } = require("../../scripts/database");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/deleteGJMessages20.php",
		beforeHandler: [secretMiddleware, requiredBodyMiddleware(["accountID", "gjp2"])],
		handler: async (req, reply) => {
			const { accountID, gjp2, isSender, messages, messageID } = req.body;

			try {
				const account = await database.accounts.findFirst({ where: { id: parseInt(accountID), password: gjp2 } });
				if (!account) return reply.send("-1");

				const isSent = isSender === "1";

				const ids = messages?.split(",") ?? (messageID ? [messageID] : []);
				if (!ids.length) return reply.send("-1");

				await database.messages.deleteMany({
					where: {
						id: { in: ids.map((id) => parseInt(id)) },
						[isSent ? "accountId" : "toAccountId"]: account.id,
					},
				});

				Logger.log("Delete messages", `IDs: ${ids.map((id) => Logger.color(Logger.colors.cyan)(id)).join(", ")}`);

				return reply.send("1");
			} catch (error) {
				Logger.error("Delete messages", req.body, error);

				return reply.send("-1");
			}
		},
	});
};
