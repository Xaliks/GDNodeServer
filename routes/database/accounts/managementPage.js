/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["GET"],
		url: "/accountManagement.php",
		handler: async (req, reply) => {
			reply.send("Hi!");
		},
	});
};
