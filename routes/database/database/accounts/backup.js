const Logger = require("../../../../scripts/Logger");
const { accountSecret, safeBase64Pattern, maxAccountBackupSize } = require("../../../../config/config");
const { database, checkPassword } = require("../../../../scripts/database");
const { byteLengthOf } = require("../../../../scripts/util");

const ResponseEnum = {
	Success: "1", // Success backup
	Failed: "-1", // Backup failed. Please try again later // Save size is within limits.
	LoginFailed: "-2", // Login failed. Please login to verify your account
	WithinLimits: "-3", // Backup failed. Error code: -3 // Save size is within limits.
};

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/backupGJAccountNew.php",
		schema: {
			consumes: ["x-www-form-urlencoded"],
			body: {
				type: "object",
				properties: {
					secret: { type: "string", const: accountSecret },
					accountID: { type: "number" },
					saveData: { type: "string", pattern: `${safeBase64Pattern.slice(0, -1)};${safeBase64Pattern.slice(1)}` },
					gameVersion: { type: "number" },
					binaryVersion: { type: "number" },
				},
				required: ["secret", "accountID", "saveData", "gameVersion", "binaryVersion"],
			},
		},
		handler: async (req, reply) => {
			const { accountID, saveData, gameVersion, binaryVersion } = req.body;

			try {
				if (!(await checkPassword(req.body))) return reply.send(ResponseEnum.LoginFailed);

				if (byteLengthOf(saveData) > maxAccountBackupSize) return reply.send(ResponseEnum.WithinLimits);

				await database.savedData.upsert({
					where: { id: accountID },
					update: { data: saveData, gameVersion, binaryVersion },
					create: { id: accountID, data: saveData, gameVersion, binaryVersion },
				});

				Logger.log("User backup", `Account: ${Logger.color(Logger.colors.cyan)(accountID)}`);

				return reply.send(ResponseEnum.Success);
			} catch (error) {
				Logger.error("User backup", req.body, error);

				return reply.send(ResponseEnum.Failed);
			}
		},
	});
};
