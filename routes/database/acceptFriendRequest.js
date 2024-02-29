const Logger = require("../../scripts/Logger");
const { secret } = require("../../config/config");
const { database, checkPassword } = require("../../scripts/database");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/acceptGJFriendRequest20.php",
		schema: {
			consumes: ["x-www-form-urlencoded"],
			body: {
				type: "object",
				properties: {
					secret: { type: "string", const: secret },
					accountID: { type: "number" },
					targetAccountID: { type: "number", minimum: 1 },
					requestID: { type: "number", minimum: 1 },
				},
				required: ["secret", "accountID", "targetAccountID", "requestID"],
			},
		},
		handler: async (req, reply) => {
			const { accountID, targetAccountID, requestID } = req.body;

			if (accountID === targetAccountID) return reply.send("-1");

			try {
				if (!(await checkPassword(req.body))) return reply.send("-1");

				const friendRequest = await database.friendRequests
					.delete({ where: { id: requestID, accountId: targetAccountID, toAccountId: accountID } })
					.catch(() => null);
				if (!friendRequest) return reply.send("1");

				await database.friends.create({ accountId1: accountID, accountId2: friendRequest.accountId }).catch(() => null);

				Logger.log(
					"Accept friend request",
					`ID: ${Logger.color(Logger.colors.cyan)(friendRequest.id)}\n`,
					`From: ${Logger.color(Logger.colors.cyan)(friendRequest.accountId)}\n`,
					`To: ${Logger.color(Logger.colors.cyan)(accountID)}`,
				);

				return reply.send("1");
			} catch (error) {
				Logger.error("Accept friend request", req.body, error);

				return reply.send("-1");
			}
		},
	});
};
