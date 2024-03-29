const { database, checkPassword, getPassword } = require("../../scripts/database");
const { toSafeBase64 } = require("../../scripts/security");
const { dateToRelative } = require("../../scripts/util");
const { userCommentsPageSize, secret } = require("../../config/config");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/getGJAccountComments20.php",
		schema: {
			consumes: ["x-www-form-urlencoded"],
			body: {
				type: "object",
				properties: {
					secret: { type: "string", const: secret },
					accountID: { type: "array", items: { type: "number", minimum: 1 }, minItems: 1, maxItems: 2 },
					page: { type: "number", minimum: 0, default: 0 },
					total: { type: "number", minimum: 0, default: 0 },
				},
				required: ["secret", "accountID"],
			},
		},
		handler: async (req, reply) => {
			const { accountID, page, total } = req.body;

			const targetAccountId = accountID.length === 1 ? accountID[0] : accountID[1];
			const accountId = accountID.length === 1 ? null : accountID[0];
			let totalCount = total;

			const targetAccount = await database.accounts.findFirst({ where: { id: targetAccountId } });
			if (!targetAccount?.isActive) return reply.send("-1");

			if (targetAccount.commentHistoryState !== 0) {
				const password = getPassword(req.body);
				if (!accountId || !password) return reply.send("-1");

				if (targetAccountId === accountId) {
					if (targetAccount.password !== password) return reply.send("-1");
				} else if (targetAccount.commentHistoryState === 1) {
					if (!(await checkPassword({ ...req.body, accountID: accountId }))) return reply.send("-1");

					const friendship = await database.friends.findFirst({
						where: {
							OR: [
								{ accountId1: accountId, accountId2: targetAccount.id },
								{ accountId1: targetAccount.id, accountId2: accountId },
							],
						},
					});

					if (!friendship) return reply.send("#0:0:0");
				} else return reply.send("#0:0:0");
			}

			const comments = await database.accountComments.findMany({
				where: { accountId: targetAccount.id },
				take: userCommentsPageSize,
				skip: page * userCommentsPageSize,
				orderBy: { id: "desc" },
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
							[8, targetAccountId],
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
