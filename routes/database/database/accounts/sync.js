const Logger = require("../../../../scripts/Logger");
const { accountSecret } = require("../../../../config/config");
const { database, checkPassword } = require("../../../../scripts/database");

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
					accountID: { type: "number" },
				},
				required: ["secret", "accountID"],
			},
		},
		handler: async (req, reply) => {
			const { accountID } = req.body;

			try {
				if (!(await checkPassword(req.body))) return reply.send(ResponseEnum.LoginFailed);

				const savedData = await database.savedData.findFirst({ where: { id: accountID } });
				if (!savedData) return reply.send(ResponseEnum.Code(ResponseEnum.NoSavedData));

				Logger.log("User backup", `User: ${Logger.colors.cyan(accountID)}`);

				return reply.send(ResponseEnum.Success(savedData.data, savedData.gameVersion, savedData.binaryVersion));
			} catch (error) {
				Logger.error("User backup", req.body, error);

				return reply.send(ResponseEnum.Failed);
			}
		},
	});
};
