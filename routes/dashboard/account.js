/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.get("/account", (req, reply) => {
		return reply.type("text/html").send("Hello World!");
	});
};
