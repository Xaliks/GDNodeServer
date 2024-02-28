const { Constants } = require("../../scripts/util");
const { getUser } = require("../../scripts/database");
const { secret, gjp2Pattern } = require("../../config/config");

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
					accountID: { type: "number", minimum: 1 },
					gjp2: { type: "string", pattern: gjp2Pattern },
				},
				required: ["secret", "accountID", "gjp2"],
			},
		},
		handler: async (req, reply) => {
			const { account } = await getUser(req.body, false);
			if (!account) return reply.send("-1");

			return reply.send(
				[1, 2].includes(Constants.modBadge[account.modBadge]) ? Constants.modBadge[account.modBadge] : "-1",
			);
		},
	});
};
