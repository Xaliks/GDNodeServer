const Logger = require("../../../scripts/Logger");
const { accountSecret, usernameRegex } = require("../../../config/config");
const { getUser } = require("../../../scripts/database");

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
		schema: {
			consumes: ["x-www-form-urlencoded"],
			body: {
				type: "object",
				properties: {
					secret: { type: "string", const: accountSecret },
					userName: { type: "string", pattern: usernameRegex.source },
					sID: { type: "number" }, // steam id
				},
				required: ["secret", "userName"],
			},
		},
		handler: async (req, reply) => {
			try {
				const { account, user } = await getUser(req.body);
				if (!account || !user) return reply.send(ResponseEnum.Failed);
				if (user.isBanned) return reply.send(ResponseEnum.AccountDisabled);

				Logger.log(
					"Account login",
					`User: ${Logger.colors.cyan(account.username)}/${Logger.colors.gray(account.id)}/${Logger.colors.gray(user.id)}`,
				);

				reply.send(ResponseEnum.Success(account.id, user.id));
			} catch (error) {
				Logger.error("Account login", error);

				return reply.send(ResponseEnum.Failed);
			}
		},
	});
};
