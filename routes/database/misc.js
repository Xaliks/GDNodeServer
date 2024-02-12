const gdMiddleware = require("../../scripts/gdMiddleware");
const config = require("../../config/config");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.post("/getAccountURL.php", { beforeHandler: gdMiddleware }, (req, reply) =>
		reply.send(`${config.host}/${config.path}`),
	);
};
