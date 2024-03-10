const Logger = require("../../scripts/Logger");
const { secret } = require("../../config/config");
const { database, checkPassword } = require("../../scripts/database");

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
					accountID: { type: "number" },
					targetAccountID: { type: "number", minimum: 1 },
					isSender: { type: "number", enum: [0, 1], default: 0 },
				},
				required: ["secret", "accountID", "targetAccountID"],
			},
		},
		handler: async (req, reply) => {
			const { accountID, targetAccountID, isSender } = req.body;

			if (accountID === targetAccountID) return reply.send("-1");

			try {
				if (!(await checkPassword(req.body))) return reply.send("-1");

				await database.friendRequests.deleteMany({
					where: {
						accountId: isSender ? accountID : targetAccountID,
						toAccountId: isSender ? targetAccountID : accountID,
					},
				});

				Logger.log(
					"Delete friend request",
					`From: ${Logger.colors.cyan(isSender ? accountID : targetAccountID)}\n`,
					`To: ${Logger.colors.cyan(isSender ? targetAccountID : accountID)}`,
				);

				return reply.send("1");
			} catch (error) {
				Logger.error("Delete friend request", req.body, error);

				return reply.send("-1");
			}
		},
	});
};
