const Logger = require("../../scripts/Logger");
const { secretMiddleware, requiredBodyMiddleware } = require("../../scripts/middlewares");
const { database, getUser } = require("../../scripts/database");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/deleteGJAccComment20.php",
		beforeHandler: [secretMiddleware, requiredBodyMiddleware(["accountID", "gjp2", "commentID"])],
		handler: async (req, reply) => {
			const { commentID } = req.body;

			try {
				const { account } = await getUser(req.body, false);
				if (!account) return reply.send("-1");

				const comment = await database.accountComments.delete({ where: { id: parseInt(commentID) } });

				Logger.log(
					"Delete account comment",
					`${Logger.color(Logger.colors.cyan)(account.username)}/${Logger.color(Logger.colors.gray)(account.id)}: ${Logger.color(Logger.colors.cyan)(comment.id)}/${Logger.color(Logger.colors.yellow)(comment.content)}`,
				);

				return reply.send("1");
			} catch (error) {
				Logger.error("Delete account comment", req.body, error);

				return reply.send("-1");
			}
		},
	});
};
