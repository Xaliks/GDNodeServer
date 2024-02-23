const Logger = require("../../scripts/Logger");
const { secret, gjp2Pattern } = require("../../config/config");
const { database, getUser } = require("../../scripts/database");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/deleteGJFriendRequests20.php",
		schema: {
			consumes: ["x-www-form-urlencoded"],
			body: {
				type: "object",
				properties: {
					secret: { type: "string", const: secret },
					accountID: { type: "number", minimum: 1 },
					gjp2: { type: "string", pattern: gjp2Pattern },
					targetAccountID: { type: "number", minimum: 1 },
					isSender: { type: "number", enum: [0, 1], default: 0 },
				},
				required: ["secret", "accountID", "gjp2", "targetAccountID"],
			},
		},
		handler: async (req, reply) => {
			const { accountID, targetAccountID, isSender } = req.body;

			if (accountID === targetAccountID) return reply.send("-1");

			try {
				const { account } = await getUser(req.body, false);
				if (!account) return reply.send("-1");

				await database.friendRequests.deleteMany({
					where: {
						accountId: isSender ? account.id : targetAccountID,
						toAccountId: isSender ? targetAccountID : account.id,
					},
				});

				Logger.log(
					"Delete friend request",
					`From: ${Logger.color(Logger.colors.gray)(isSender ? account.id : targetAccountID)}\n`,
					`To: ${Logger.color(Logger.colors.gray)(isSender ? targetAccountID : account.id)}`,
				);

				return reply.send("1");
			} catch (error) {
				Logger.error("Delete friend request", req.body, error);

				return reply.send("-1");
			}
		},
	});
};
