const { secretMiddleware } = require("../../scripts/middlewares");
const config = require("../../config/config");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.post("/getAccountURL.php", { beforeHandler: secretMiddleware }, (req, reply) =>
		reply.send(`${config.host}/${config.databasePath}`),
	);
};
