const Logger = require("../../../../scripts/Logger");
const { accountSecret, gjp2Pattern } = require("../../../../config/config");
const { database, getUser } = require("../../../../scripts/database");

const ResponseEnum = {
	Success: (savedData, gameVersion, binaryVersion) => `${savedData};${gameVersion};${binaryVersion};a;a`, // Sync successful
	Failed: "-1", // Sync failed. Please try again later
	LoginFailed: "-2", // Login failed. Please login to verify your account
	NoSavedData: "-3", // Sync failed. Error code: -3
	Code: (code) => code, // Sync failed. Error code: {code}
};

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/syncGJAccountNew.php",
		schema: {
			consumes: ["x-www-form-urlencoded"],
			body: {
				type: "object",
				properties: {
					secret: { type: "string", const: accountSecret },
					accountID: { type: "number", minimum: 1 },
					gjp2: { type: "string", pattern: gjp2Pattern },
				},
				required: ["secret", "accountID", "gjp2"],
			},
		},
		handler: async (req, reply) => {
			try {
				const { account } = await getUser(req.body);
				if (!account) return reply.send(ResponseEnum.LoginFailed);

				const savedData = await database.savedData.findFirst({ where: { id: account.id } });
				if (!savedData) return reply.send(ResponseEnum.Code(ResponseEnum.NoSavedData));

				Logger.log(
					"User backup",
					`User: ${Logger.color(Logger.colors.cyan)(account.username)}/${Logger.color(Logger.colors.gray)(account.id)}`,
				);

				return reply.send(ResponseEnum.Success(savedData.data, savedData.gameVersion, savedData.binaryVersion));
			} catch (error) {
				Logger.error("User backup", req.body, error);

				return reply.send(ResponseEnum.Failed);
			}
		},
	});
};
