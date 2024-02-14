const Logger = require("../../scripts/Logger");
const { secretMiddleware, requiredBodyMiddleware } = require("../../scripts/middlewares");
const { database } = require("../../scripts/database");
const { fromSafeBase64 } = require("../../scripts/security");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/uploadGJAccComment20.php",
		beforeHandler: [secretMiddleware, requiredBodyMiddleware(["accountID", "gjp2", "comment"])],
		handler: async (req, reply) => {
			const { accountID, gjp2, comment } = req.body;

			try {
				const account = await database.accounts.findFirst({ where: { id: parseInt(accountID), password: gjp2 } });
				if (!account) return reply.send("-1");

				const content = fromSafeBase64(comment).toString();

				await database.accountComments.create({ data: { accountId: account.id, content } });

				return reply.send("1");
			} catch (error) {
				Logger.error("Create account comment", req.body, error);

				return reply.send("-1");
			}
		},
	});
};
