const gdMiddleware = require("../../scripts/gdMiddleware");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/getGJLevels21.php",
		beforeHandler: [gdMiddleware],
		handler: async (req, reply) => {
			console.log(req.body);

			return reply.send({ message: "👋" });
		},
	});
};
