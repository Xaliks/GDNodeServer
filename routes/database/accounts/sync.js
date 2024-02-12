const Logger = require("../../../scripts/Logger");
const gdMiddleware = require("../../../scripts/gdMiddleware");
const database = require("../../../scripts/database");

const ResponseEnum = {
	Success: (savedData) => `${savedData};21;30;a;a`, // Sync successful
	Failed: "-1", // Sync failed. Please try again later
	LoginFailed: "-2", // Login failed. Please login to verify your account
	// Other
	// Sync failed. Error code: {n}
};

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/syncGJAccountNew.php",
		beforeHandler: [gdMiddleware],
		handler: async (req, reply) => {
			const { accountID, gjp2 } = req.body;
			try {
				const account = await database.accounts.findFirst({ where: { id: parseInt(accountID), password: gjp2 } });
				if (!account) return reply.send(ResponseEnum.LoginFailed);

				const savedData = await database.savedData.findFirst({ where: { id: account.id } });
				if (!savedData) return reply.send(ResponseEnum.Failed);

				Logger.log(
					"User backup",
					`User ${Logger.color(Logger.colors.cyan)(account.username)}/${Logger.color(Logger.colors.gray)(account.id)} loaded.`,
				);

				return reply.send(ResponseEnum.Success(savedData.data));
			} catch (error) {
				Logger.error("User backup", req.body, error);

				return reply.send(ResponseEnum.Failed);
			}
		},
	});
};
