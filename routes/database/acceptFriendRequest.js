const Logger = require("../../scripts/Logger");
const { secret, gjp2Pattern } = require("../../config/config");
const { database, getUser } = require("../../scripts/database");

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
					accountID: { type: "number", minimum: 1 },
					gjp2: { type: "string", pattern: gjp2Pattern },
					targetAccountID: { type: "number", minimum: 1 },
					requestID: { type: "number", minimum: 1 },
				},
				required: ["secret", "accountID", "gjp2", "targetAccountID", "requestID"],
			},
		},
		handler: async (req, reply) => {
			const { accountID, targetAccountID, requestID } = req.body;

			if (accountID === targetAccountID) return reply.send("-1");

			try {
				const { account } = await getUser(req.body, false);
				if (!account) return reply.send("-1");

				const friendRequest = await database.friendRequests
					.delete({ where: { id: requestID, accountId: targetAccountID, toAccountId: account.id } })
					.catch(() => null);
				if (!friendRequest) return reply.send("1");

				await database.friends.upsert({
					where: { accountId1_accountId2: { accountId1: account.id, accountId2: friendRequest.accountId } },
					update: {},
					create: { accountId1: account.id, accountId2: friendRequest.accountId },
				});

				Logger.log(
					"Accept friend request",
					`ID: ${Logger.color(Logger.colors.cyan)(friendRequest.id)}\n`,
					`From: ${Logger.color(Logger.colors.gray)(friendRequest.accountId)}\n`,
					`To: ${Logger.color(Logger.colors.cyan)(account.username)}/${Logger.color(Logger.colors.gray)(account.id)}`,
				);

				return reply.send("1");
			} catch (error) {
				Logger.error("Accept friend request", req.body, error);

				return reply.send("-1");
			}
		},
	});
};
