const { secretMiddleware, requiredBodyMiddleware } = require("../../scripts/middlewares");
const { database, getUser } = require("../../scripts/database");
const { toSafeBase64 } = require("../../scripts/security");
const { dateToRelative } = require("../../scripts/util");
const { userCommentsPageSize } = require("../../config/config");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/getGJAccountComments20.php",
		beforeHandler: [secretMiddleware, requiredBodyMiddleware(["accountID", "page"])],
		handler: async (req, reply) => {
			const {
				accountID: [, targetAccountID],
				page,
			} = req.body;

			const comments = await database.accountComments.findMany({
				where: { accountId: parseInt(targetAccountID) },
				take: userCommentsPageSize,
				skip: page * userCommentsPageSize,
			});
			if (!comments.length) return reply.send("-2");

			const user = await getUser(targetAccountID);

			reply.send(
				`${comments
					.map((comment) => {
						return [
							[2, toSafeBase64(comment.content)],
							[3, user.id],
							[4, comment.likes],
							[5, 0], // dislikes
							[6, comment.id],
							[7, comment.isSpam ? 1 : 0],
							[8, targetAccountID],
							[9, dateToRelative(comment.createdAt)],
						]
							.map(([key, value]) => `${key}~${value}`)
							.join("~");
					})
					.join("|")}#${comments.length}:${page}:${userCommentsPageSize}`,
			);
		},
	});
};
