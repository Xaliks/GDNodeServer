const Logger = require("../../scripts/Logger");
const { database, checkPassword } = require("../../scripts/database");
const { fromSafeBase64 } = require("../../scripts/security");
const { userFriendRequestCommentMaxSize, secret, safeBase64Pattern } = require("../../config/config");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/uploadFriendRequest20.php",
		schema: {
			consumes: ["x-www-form-urlencoded"],
			body: {
				type: "object",
				properties: {
					secret: { type: "string", const: secret },
					accountID: { type: "number" },
					toAccountID: { type: "number", minimum: 1 },
					comment: { type: "string", pattern: `|${safeBase64Pattern}` }, // comment can be empty string
				},
				required: ["secret", "accountID", "toAccountID"],
			},
		},
		handler: async (req, reply) => {
			const { accountID, toAccountID, comment: base64Comment } = req.body;

			if (accountID === toAccountID) return reply.send("-1");

			try {
				if (!(await checkPassword(req.body))) return reply.send("-1");

				const toAccount = await database.accounts.findFirst({ where: { id: toAccountID } });
				if (!toAccount?.isActive) return reply.send("-1");

				if (toAccount.friendRequestState === 1) return reply.send("-1");

				const blocked = await database.blocks.findFirst({
					where: {
						OR: [
							{ accountId: accountID, targetAccountId: toAccount.id },
							{ accountId: toAccount.id, targetAccountId: accountID },
						],
					},
				});
				if (blocked) return reply.send("-1");

				let comment = null;
				if (base64Comment) comment = fromSafeBase64(base64Comment).toString().slice(0, userFriendRequestCommentMaxSize);

				const friendRequest = await database.friendRequests.upsert({
					where: { accountId_toAccountId: { accountId: accountID, toAccountId: toAccount.id } },
					update: { comment },
					create: { accountId: accountID, toAccountId: toAccount.id, comment },
				});

				Logger.log(
					"Create friend request",
					`ID: ${Logger.colors.cyan(friendRequest.id)}\n`,
					`From: ${Logger.colors.cyan(accountID)}\n`,
					`To: ${Logger.colors.cyan(toAccount.username)}/${Logger.colors.gray(toAccount.id)}`,
				);

				return reply.send("1");
			} catch (error) {
				Logger.error("Create friend request", req.body, error);

				return reply.send("-1");
			}
		},
	});
};
