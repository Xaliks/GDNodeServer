const zlib = require("zlib");
const { fromBase64 } = require("../../../scripts/security");
const Logger = require("../../../scripts/Logger");
const gdMiddleware = require("../../../scripts/gdMiddleware");
const database = require("../../../scripts/database");

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
		beforeHandler: [gdMiddleware],
		handler: async (req, reply) => {
			const { accountID, gjp2, saveData } = req.body;

			try {
				const account = await database.accounts.findFirst({ where: { id: parseInt(accountID), password: gjp2 } });
				if (!account) return reply.send(ResponseEnum.LoginFailed);

				const base64Data = saveData.split(";")[0].replaceAll("-", "+").replaceAll("_", "/");
				const uncompressedData = zlib.unzipSync(fromBase64(base64Data)).toString();

				const orbs = parseInt(uncompressedData.match(/<\/s><k>14<\/k><s>(\d+)<\/s>/)?.[1]);
				if (isNaN(orbs)) return reply.send(ResponseEnum.Failed);

				const [user] = await database.$transaction([
					database.users.upsert({
						where: { extId: String(account.id) },
						update: { orbs },
						create: { extId: String(account.id), username: account.username, orbs },
					}),
					database.savedData.upsert({
						where: { id: account.id },
						update: { data: saveData },
						create: { id: account.id, data: saveData },
					}),
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
