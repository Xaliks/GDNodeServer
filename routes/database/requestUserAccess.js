const { Constants } = require("../../scripts/util");
const { getPassword, database } = require("../../scripts/database");
const { secret } = require("../../config/config");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/requestUserAccess.php",
		schema: {
			consumes: ["x-www-form-urlencoded"],
			body: {
				type: "object",
				properties: {
					secret: { type: "string", const: secret },
					accountID: { type: "number" },
				},
				required: ["secret", "accountID"],
			},
		},
		handler: async (req, reply) => {
			const password = getPassword(req.body);
			if (!password) return reply.send("-1");

			const account = await database.accounts.findFirst({ where: { id: req.body.accountID, password } });
			if (!account) return reply.send("-1");

			return reply.send(
				[1, 2].includes(Constants.modBadge[account.modBadge]) ? Constants.modBadge[account.modBadge] : "-1",
			);
		},
	});
};
