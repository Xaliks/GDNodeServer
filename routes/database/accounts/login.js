const Logger = require("../../../scripts/Logger");
const { secretMiddleware, requiredBodyMiddleware } = require("../../../scripts/middlewares");
const { database, upsertUser } = require("../../../scripts/database");

const ResponseEnum = {
	Success: (accountId, userId) => `${accountId},${userId}`, // Success login
	Failed: "-1", // Login failed
	AccountDisabled: "-12", // Account has been disabled // Contact RobTop Support for more info
	DifferentSteamAccount: "-13", // Already linked to different Steam account
};

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/loginGJAccount.php",
		beforeHandler: [secretMiddleware, requiredBodyMiddleware(["udid", "userName", "gjp2"])],
		handler: async (req, reply) => {
			const { udid, userName, gjp2 } = req.body;

			try {
				const account = await database.accounts.findFirst({ where: { username: userName, password: gjp2 } });
				if (!account) return reply.send(ResponseEnum.Failed);

				const user = await upsertUser(
					{ extId: String(account.id) },
					{ username: userName, isRegistered: true },
					{ extId: String(account.id), username: userName, isRegistered: true },
				);

				Logger.log(
					"Account login",
					`User ${Logger.color(Logger.colors.cyan)(userName)}/${Logger.color(Logger.colors.gray)(account.id)}/${Logger.color(Logger.colors.gray)(user.id)} logged in.`,
				);

				reply.send(ResponseEnum.Success(account.id, user.id));

				await database.levels.updateMany({
					where: { extId: udid },
					data: { extId: String(account.id), userId: user.id },
				});
			} catch (error) {
				Logger.error("Account login", error);

				return reply.send(ResponseEnum.Failed);
			}
		},
	});
};
