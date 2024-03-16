/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/getCustomContentURL.php",
		handler: async (req, reply) => {
			return reply.send("https://geometrydashfiles.b-cdn.net");
		},
	});
};
