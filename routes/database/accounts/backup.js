const zlib = require("node:zlib");
const Logger = require("../../../scripts/Logger");
const { fromSafeBase64 } = require("../../../scripts/security");
const { secretMiddleware, requiredBodyMiddleware } = require("../../../scripts/middlewares");
const { database, getUser } = require("../../../scripts/database");

const ResponseEnum = {
	Success: "1", // Success backup
	Failed: "-1", // Backup failed. Please try again later // Save size is within limits.
	LoginFailed: "-2", // Login failed. Please login to verify your account
	// Other
	// Backup failed. Error code: {n} // Save size is within limits.
};

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/backupGJAccountNew.php",
		beforeHandler: [
			secretMiddleware,
			requiredBodyMiddleware(["accountID", "gjp2", "saveData", "gameVersion", "binaryVersion"]),
		],
		handler: async (req, reply) => {
			const { saveData, gameVersion, binaryVersion } = req.body;

			try {
				const { account, user } = await getUser(req.body);
				if (!account) return reply.send(ResponseEnum.LoginFailed);

				const [base64Data] = saveData.split(";");
				const uncompressedData = zlib.gunzipSync(fromSafeBase64(base64Data)).toString();

				const orbs = Number(uncompressedData.match(/<\/s><k>14<\/k><s>(\d+)<\/s>/)?.[1]) || 0;

				await database.$transaction([
					database.savedData.upsert({
						where: { id: account.id },
						update: { data: saveData, gameVersion, binaryVersion },
						create: { id: account.id, data: saveData, gameVersion, binaryVersion },
					}),
					database.users.update({ where: { id: user.id }, data: { orbs } }),
				]);

				Logger.log(
					"User backup",
					`User ${Logger.color(Logger.colors.cyan)(user.username)}/${Logger.color(Logger.colors.gray)(account.id)}/${Logger.color(Logger.colors.gray)(user.id)} saved.`,
				);

				return reply.send(ResponseEnum.Success);
			} catch (error) {
				Logger.error("User backup", req.body, error);

				return reply.send(ResponseEnum.Failed);
			}
		},
	});
};
