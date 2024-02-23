const Logger = require("../../scripts/Logger");
const { secret, gjp2Pattern } = require("../../config/config");
const { database, getUser } = require("../../scripts/database");

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
					accountID: { type: "number", minimum: 1 },
					gjp2: { type: "string", pattern: gjp2Pattern },
					isSender: { type: "number", enum: [0, 1], default: 0 },
					messageID: { type: "number", minimum: 1 },
					messages: { type: "string", pattern: "^(?:\\d+,)*\\d+$" },
				},
				required: ["secret", "accountID", "gjp2"],
			},
		},
		handler: async (req, reply) => {
			const { isSender, messages, messageID } = req.body;

			try {
				const ids = messages?.split(",") ?? (messageID ? [messageID] : []);
				if (!ids.length) return reply.send("-1");

				const { account } = await getUser(req.body, false);
				if (!account) return reply.send("-1");

				await database.messages.deleteMany({
					where: {
						id: { in: ids },
						[isSender ? "accountId" : "toAccountId"]: account.id,
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
