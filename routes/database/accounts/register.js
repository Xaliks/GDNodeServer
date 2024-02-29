const Logger = require("../../../scripts/Logger");
const { getGJP2 } = require("../../../scripts/security");
const { database } = require("../../../scripts/database");
const { preActiveAccounts, accountSecret, emailRegex, passwordRegex, usernameRegex } = require("../../../config/config");

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
		schema: {
			consumes: ["x-www-form-urlencoded"],
			body: {
				type: "object",
				properties: {
					secret: { type: "string", const: accountSecret },
					userName: { type: "string" },
					password: { type: "string" },
					email: { type: "string" },
				},
				required: ["secret", "userName", "password", "email"],
			},
		},
		handler: async (req, reply) => {
			const { userName, password, email } = req.body;

			if (userName.length < 3) return reply.send(ResponseEnum.ShortUsername);
			if (password.length < 6) return reply.send(ResponseEnum.ShortPassword);
			if (!usernameRegex.test(userName)) return reply.send(ResponseEnum.InvalidUsername);
			if (!emailRegex.test(email)) return reply.send(ResponseEnum.InvalidEmail);
			if (!passwordRegex.test(password)) return reply.send(ResponseEnum.InvalidPassword);

			const existingAccount = await database.accounts.findFirst({
				where: { OR: [{ email: email.toLowerCase() }, { username: userName }] },
			});
			if (existingAccount?.email === email) return reply.send(ResponseEnum.EmailInUse);
			if (existingAccount?.username === userName) return reply.send(ResponseEnum.UsernameInUse);

			return database.accounts
				.create({
					data: {
						email: email.toLowerCase(),
						username: userName,
						password: getGJP2(password),
						isActive: Boolean(preActiveAccounts),
					},
				})
				.then((account) => {
					Logger.log(
						"Account create",
						`Account ${Logger.color(Logger.colors.cyan)(account.username)}/${Logger.color(Logger.colors.gray)(account.id)} created.`,
					);

					return reply.send(ResponseEnum.Success);
				})
				.catch((error) => {
					Logger.error("Account create", error);

					return reply.send(ResponseEnum.WentWrong);
				});
		},
	});
};
