// [1.9] Restores user's data; defunct as of the new save system.

const { secret, udidPattern } = require("../../config/config");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/restoreGJItems.php",
		schema: {
			consumes: ["x-www-form-urlencoded"],
			body: {
				type: "object",
				properties: {
					secret: { type: "string", const: secret },
					udid: { type: "string", pattern: udidPattern },
				},
				required: ["secret", "udid"],
			},
		},
		handler: async (req, reply) => {
			return reply.send("1");
		},
	});
};
