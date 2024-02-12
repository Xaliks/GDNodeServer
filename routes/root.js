/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["GET"],
		url: "/",
		handler: async (req, reply) => {
			return reply.send({ message: "👋" });
		},
	});
};
