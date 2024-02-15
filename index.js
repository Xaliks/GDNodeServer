const fs = require("node:fs");
const fastify = require("fastify")({ trustProxy: true });
const Logger = require("./scripts/Logger");
const config = require("./config/config");

function log(request, ...message) {
	if (process.env.EnableLogging) {
		return Logger.log(
			request.ws ? "WS" : request.method,
			`${Logger.color(Logger.colors.cyan)(request.ip)} -> ${Logger.color(Logger.colors.gray)(request.hostname)}${request.url}`,
			...message,
		);
	}
}

fastify.register(require("@fastify/formbody"));

// Logging
fastify.addHook("onRequest", (request, reply, done) => {
	log(request);

	done();
});

function registerRoutes(path) {
	fs.readdirSync(path).forEach((file) => {
		if (fs.statSync(`${path}/${file}`).isDirectory()) registerRoutes(`${path}/${file}`);

		if (file.endsWith(".js")) {
			fastify.register(
				(api, options, done) => {
					require(`./${path}/${file}`)(api);

					done();
				},
				{ prefix: path.replace("routes", config.path) },
			);
		}
	});
}

registerRoutes("routes");

fastify.setNotFoundHandler((request, reply) => {
	return reply.status(404).send("Not Found!");
});

fastify.setErrorHandler((error, request, reply) => {
	if (error.validation) return reply.status(400).send("-1");

	Logger.error("Server", error);

	return reply.status(500).send("-500");
});

fastify.listen({ port: config.port }, (error, address) => {
	if (error) {
		Logger.error("Server", error);
		process.exit(1);
	}
	Logger.log("Server", `Listening at: ${Logger.color(Logger.colors.cyan)(address)}`);
});
