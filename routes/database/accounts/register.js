const Logger = require("../../../scripts/Logger");
const { getGJP2 } = require("../../../scripts/security");
const gdMiddleware = require("../../../scripts/gdMiddleware");
const database = require("../../../scripts/database");
const { preActiveAccounts } = require("../../../config/config");

const ResponseEnum = {
	Success: "1", // Success registration
	WentWrong: "-1", // Something went wrong
	UsernameInUse: "-2", // Username is already in use
	EmailInUse: "-3", // Email is already in use
	InvalidUsername: "-4", // Username is invalid
	InvalidPassword: "-5", // Password is invalid
	InvalidEmail: "-6", // Email is invalid
	PasswordsNotMatch: "-7", // Passwords do not match
	ShortPassword: "-8", // Too short. Minimum 6 characters
	ShortUsername: "-9", // Too short. Minimum 3 characters
};

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/registerGJAccount.php",
		beforeHandler: [gdMiddleware],
		handler: async (req, reply) => {
			const { userName, password, email } = req.body;

			const existingAccount = await database.accounts.findFirst({ where: { OR: [{ email }, { username: userName }] } });
			if (existingAccount?.email === email) return reply.send(ResponseEnum.EmailInUse);
			if (existingAccount?.username === userName) return reply.send(ResponseEnum.UsernameInUse);

			return database.accounts
				.create({ data: { email, username: userName, password: getGJP2(password), isActive: Boolean(preActiveAccounts) } })
				.then(() => {
					Logger.log("Account create", `User ${Logger.color(Logger.colors.cyan)(userName)} created.`);

					return reply.send(ResponseEnum.Success);
				})
				.catch((error) => {
					Logger.error("Account create", error);

					return reply.send(ResponseEnum.WentWrong);
				});
		},
	});
};
