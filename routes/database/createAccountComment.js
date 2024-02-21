const Logger = require("../../scripts/Logger");
const { secretMiddleware, requiredBodyMiddleware } = require("../../scripts/middlewares");
const { database, getUser } = require("../../scripts/database");
const { fromSafeBase64 } = require("../../scripts/security");
const { userCommentMaxSize } = require("../../config/config");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/uploadGJAccComment20.php",
		beforeHandler: [secretMiddleware, requiredBodyMiddleware(["accountID", "gjp2", "comment"])],
		handler: async (req, reply) => {
			const { comment: base64Content } = req.body;

			try {
				const { account } = await getUser(req.body, false);
				if (!account) return reply.send("-1");

				const content = fromSafeBase64(base64Content).toString().slice(0, userCommentMaxSize);

				const comment = await database.accountComments.create({ data: { accountId: account.id, content } });

				Logger.log(
					"Create account comment",
					`${Logger.color(Logger.colors.cyan)(account.username)}/${Logger.color(Logger.colors.gray)(account.id)}: ${Logger.color(Logger.colors.cyan)(comment.id)}`,
				);

				return reply.send("1");
			} catch (error) {
				Logger.error("Create account comment", req.body, error);

				return reply.send("-1");
			}
		},
	});
};
