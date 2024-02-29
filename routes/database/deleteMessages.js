const Logger = require("../../scripts/Logger");
const { secret, separatedNumbersPattern } = require("../../config/config");
const { database, checkPassword } = require("../../scripts/database");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/deleteGJMessages20.php",
		schema: {
			consumes: ["x-www-form-urlencoded"],
			body: {
				type: "object",
				properties: {
					secret: { type: "string", const: secret },
					accountID: { type: "number" },
					isSender: { type: "number", enum: [0, 1], default: 0 },
					messageID: { type: "number", minimum: 1 },
					messages: { type: "string", pattern: separatedNumbersPattern },
				},
				required: ["secret", "accountID"],
			},
		},
		handler: async (req, reply) => {
			const { accountID, isSender, messages, messageID } = req.body;

			try {
				const ids = messages?.split(",") ?? (messageID ? [messageID] : []);
				if (!ids.length) return reply.send("-1");

				if (!(await checkPassword(req.body))) return reply.send("-1");

				await database.messages.deleteMany({
					where: {
						id: { in: ids },
						[isSender ? "accountId" : "toAccountId"]: accountID,
					},
				});

				Logger.log("Delete messages", `IDs: ${ids.map((id) => Logger.color(Logger.colors.cyan)(id)).join(", ")}`);

				return reply.send("1");
			} catch (error) {
				Logger.error("Delete messages", req.body, error);

				return reply.send("-1");
			}
		},
	});
};
