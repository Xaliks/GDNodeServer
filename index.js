const fs = require("node:fs");
const fastify = require("fastify")({ trustProxy: true });
const Logger = require("./scripts/Logger");
const config = require("./config/config");

if (process.versions.node.split(".")[0] < 18) {
	Logger.error("Node JS", "Версия Node JS Должна быть не меньше 18.0.0!");
	process.exit(1);
}

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
	return reply.status(404).send({ error: "Not Found!" });
});

fastify.setErrorHandler((error, request, reply) => {
	if (error.validation) {
		const message = error.validation.map((error) => `[${error.instancePath}] ${error.message}`);

		return reply.status(400).send({ statusCode: error.statusCode, error: "Bad Request", message });
	}

	Logger.error("Server", error);

	return reply.status(500).send({ error: "Internal Error!" });
});

fastify.listen({ port: config.port }, (error, address) => {
	if (error) {
		Logger.error("Server", error);
		process.exit(1);
	}
	Logger.log("Server", `Listening at: ${Logger.color(Logger.colors.cyan)(address)}`);
});
