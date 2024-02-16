const Logger = require("../../scripts/Logger");
const { secretMiddleware, requiredBodyMiddleware } = require("../../scripts/middlewares");
const { database } = require("../../scripts/database");
const { fromSafeBase64 } = require("../../scripts/security");
const { userFriendRequestCommentMaxSize } = require("../../config/config");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/uploadFriendRequest20.php",
		beforeHandler: [secretMiddleware, requiredBodyMiddleware(["accountID", "gjp2", "toAccountID"])],
		handler: async (req, reply) => {
			const { accountID, gjp2, toAccountID, comment: base64Comment } = req.body;

			if (accountID === toAccountID) return reply.send("-1");

			try {
				const account = await database.accounts.findFirst({ where: { id: parseInt(accountID), password: gjp2 } });
				if (!account) return reply.send("-1");

				const toAccount = await database.accounts.findFirst({ where: { id: parseInt(toAccountID) } });
				if (!toAccount) return reply.send("-1");

				if (toAccount.friendRequestState === 1) return reply.send("-1");
				// Check if the user is blocked

				let comment = null;
				if (base64Comment) comment = fromSafeBase64(base64Comment).toString().slice(0, userFriendRequestCommentMaxSize);

				const friendRequest = await database.friendRequests.create({
					data: { accountId: account.id, toAccountId: toAccount.id, comment },
				});

				Logger.log(
					"Create friend request",
					`ID: ${Logger.color(Logger.colors.cyan)(friendRequest.id)}\n`,
					`From: ${Logger.color(Logger.colors.cyan)(account.username)}/${Logger.color(Logger.colors.gray)(account.id)}\n`,
					`To: ${Logger.color(Logger.colors.cyan)(toAccount.username)}/${Logger.color(Logger.colors.gray)(toAccount.id)}`,
				);

				return reply.send("1");
			} catch (error) {
				Logger.error("Create friend request", req.body, error);

				return reply.send("-1");
			}
		},
	});
};
