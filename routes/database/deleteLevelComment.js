const Logger = require("../../scripts/Logger");
const { secret } = require("../../config/config");
const { database, checkPassword } = require("../../scripts/database");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/deleteGJComment20.php",
		schema: {
			consumes: ["x-www-form-urlencoded"],
			body: {
				type: "object",
				properties: {
					secret: { type: "string", const: secret },
					accountID: { type: "number" },
					commentID: { type: "number", minimum: 1 },
				},
				required: ["secret", "accountID", "commentID"],
			},
		},
		handler: async (req, reply) => {
			const { accountID, commentID } = req.body;

			try {
				if (!(await checkPassword(req.body))) return reply.send("-1");

				const comment = await database.levelComments.findFirst({ where: { id: commentID } });
				if (!comment) return reply.send("-1");

				if (comment.accountId !== accountID) {
					const level = await database.levels.findFirst({ where: { id: comment.levelId } });
					if (!level || level.isDeleted) return reply.send("-1");

					if (level.accountId !== accountID) return reply.send("-1");
				}

				await database.levelComments.delete({ where: { id: comment.id } });

				Logger.log(
					"Delete level comment",
					`ID: ${Logger.colors.cyan(commentID)}\n`,
					`Account: ${Logger.colors.cyan(accountID)}`,
				);

				return reply.send("1");
			} catch (error) {
				Logger.error("Delete level comment", req.body, error);

				return reply.send("-1");
			}
		},
	});
};
