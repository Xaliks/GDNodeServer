const gdMiddleware = require("../../../scripts/gdMiddleware");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["GET"],
		url: "/accountManagement.php",
		beforeHandler: [gdMiddleware],
		handler: async (req, reply) => {
			reply.send("Hi!");
		},
	});
};
