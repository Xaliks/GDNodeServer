const Logger = require("../../scripts/Logger");
const { database, checkPassword } = require("../../scripts/database");
const { fromSafeBase64 } = require("../../scripts/security");
const { userCommentMaxSize, secret, safeBase64Pattern } = require("../../config/config");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/uploadGJAccComment20.php",
		schema: {
			consumes: ["x-www-form-urlencoded"],
			body: {
				type: "object",
				properties: {
					secret: { type: "string", const: secret },
					accountID: { type: "number" },
					toAccountID: { type: "number", minimum: 1 },
					comment: { type: "string", pattern: safeBase64Pattern },
				},
				required: ["secret", "accountID", "comment"],
			},
		},
		handler: async (req, reply) => {
			const { accountID, comment: base64Content } = req.body;

			try {
				if (!(await checkPassword(req.body))) return reply.send("-1");

				const content = fromSafeBase64(base64Content).toString().slice(0, userCommentMaxSize);

				const comment = await database.accountComments.create({ data: { accountId: accountID, content } });

				Logger.log(
					"Create account comment",
					`ID: ${Logger.colors.cyan(comment.id)}\n`,
					`Account: ${Logger.colors.cyan(accountID)}`,
				);

				return reply.send("1");
			} catch (error) {
				Logger.error("Create account comment", req.body, error);

				return reply.send("-1");
			}
		},
	});
};
