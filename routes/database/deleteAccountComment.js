const _ = require("lodash");
const Logger = require("../../scripts/Logger");
const { secret } = require("../../config/config");
const { database, checkPassword } = require("../../scripts/database");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/deleteGJAccComment20.php",
		schema: {
			consumes: ["x-www-form-urlencoded"],
			body: {
				type: "object",
				properties: {
					secret: { type: "string", const: secret },
					accountID: { type: "number" },
					commentID: { type: "number", minimum: 1 },
				},
				required: ["secret", "accountID", "commentID"],
			},
		},
		handler: async (req, reply) => {
			const { accountID, commentID } = req.body;

			try {
				if (!(await checkPassword(req.body))) return reply.send("-1");

				await database.accountComments.delete({ where: { id: commentID } }).catch(_.noop);

				Logger.log(
					"Delete account comment",
					`ID: ${Logger.colors.cyan(commentID)}\n`,
					`Account: ${Logger.colors.cyan(accountID)}`,
				);

				return reply.send("1");
			} catch (error) {
				Logger.error("Delete account comment", req.body, error);

				return reply.send("-1");
			}
		},
	});
};
