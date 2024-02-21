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
		beforeHandler: [secretMiddleware, requiredBodyMiddleware(["accountID"])],
		handler: async (req, reply) => {
			const {
				accountID: [accountID, targetAccountID],
				gjp2,
			} = req.body;

			const page = Math.max(req.body.page, 0) || 0;
			let totalCount = Math.max(req.body.total, 0) || 0;

			const targetAccount = await database.accounts.findFirst({ where: { id: parseInt(targetAccountID) } });
			if (!targetAccount) return reply.send("-1");

			if (targetAccount.commentHistorySate !== 0) {
				if (!accountID || !gjp2) return reply.send("-1");

				if (targetAccountID === accountID) {
					if (targetAccount.password !== gjp2) return reply.send("-1");
				} else {
					if (targetAccount.commentHistorySate === 1) {
						const { account } = await getUser({ accountID, gjp2 }, false);
						if (!account) return reply.send("-1");

						const friendship = await database.friends.findFirst({
							where: {
								OR: [
									{ accountId1: account.id, accountId2: targetAccount.id },
									{ accountId1: targetAccount.id, accountId2: account.id },
								],
							},
						});

						if (!friendship) return reply.send("#0:0:0");
					} else return reply.send("#0:0:0");
				}
			}

			const comments = await database.accountComments.findMany({
				where: { accountId: targetAccount.id },
				take: userCommentsPageSize,
				skip: page * userCommentsPageSize,
			});
			if (!comments.length) return reply.send("#0:0:0");

			if (comments.length < userCommentsPageSize) totalCount = page * userCommentsPageSize + comments.length;
			else if (!totalCount) {
				totalCount = await database.accountComments.count({ where: { accountId: targetAccount.id } });
			}

			const user = await database.users.findFirst({ where: { extId: String(targetAccount.id) } });

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
					.join("|")}#${totalCount}:${page * userCommentsPageSize}:${userCommentsPageSize}`,
			);
		},
	});
};
