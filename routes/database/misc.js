const config = require("../../config/config");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.post("/getAccountURL.php", (req, reply) =>
		reply.send(`${config.host}/${config.host.startsWith("https") ? config.databasePath[1] : config.databasePath[0]}`),
	);
};
