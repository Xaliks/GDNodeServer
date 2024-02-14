const Logger = require("../../scripts/Logger");
const { secretMiddleware, requiredBodyMiddleware } = require("../../scripts/middlewares");
const { database } = require("../../scripts/database");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/deleteGJAccComment20.php",
		beforeHandler: [secretMiddleware, requiredBodyMiddleware(["accountID", "gjp2", "commentID"])],
		handler: async (req, reply) => {
			const { accountID, gjp2, commentID } = req.body;

			try {
				const account = await database.accounts.findFirst({ where: { id: parseInt(accountID), password: gjp2 } });
				if (!account) return reply.send("-1");

				await database.accountComments.delete({ where: { id: parseInt(commentID) } });

				return reply.send("1");
			} catch (error) {
				Logger.error("Delete account comment", req.body, error);

				return reply.send("-1");
			}
		},
	});
};
