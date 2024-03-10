const Logger = require("../../scripts/Logger");
const { secret } = require("../../config/config");
const { database, checkPassword } = require("../../scripts/database");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/blockGJUser20.php",
		schema: {
			consumes: ["x-www-form-urlencoded"],
			body: {
				type: "object",
				properties: {
					secret: { type: "string", const: secret },
					accountID: { type: "number" },
					targetAccountID: { type: "number", minimum: 1 },
				},
				required: ["secret", "accountID", "targetAccountID"],
			},
		},
		handler: async (req, reply) => {
			const { accountID, targetAccountID } = req.body;

			if (accountID === targetAccountID) return reply.send("-1");

			try {
				if (!(await checkPassword(req.body))) return reply.send("-1");

				const targetAccount = await database.accounts.findFirst({ where: { id: targetAccountID } });
				if (!targetAccount) return reply.send("1");

				const block = await database.blocks.upsert({
					where: { accountId_targetAccountId: { accountId: accountID, targetAccountId: targetAccount.id } },
					update: {},
					create: { accountId: accountID, targetAccountId: targetAccount.id },
				});

				Logger.log(
					"Block user",
					`ID: ${Logger.colors.cyan(block.id)}\n`,
					`Account: ${Logger.colors.cyan(accountID)}\n`,
					`Target: ${Logger.colors.cyan(targetAccount.username)}/${Logger.colors.gray(targetAccount.id)}`,
				);

				reply.send("1");

				await database.$transaction([
					database.friends.deleteMany({
						where: {
							OR: [
								{ accountId1: accountID, accountId2: targetAccount.id },
								{ accountId1: targetAccount.id, accountId2: accountID },
							],
						},
					}),
					database.friendRequests.deleteMany({
						where: {
							OR: [
								{ accountId: accountID, toAccountId: targetAccount.id },
								{ accountId: targetAccount.id, toAccountId: accountID },
							],
						},
					}),
				]);
			} catch (error) {
				Logger.error("Block user", req.body, error);

				return reply.send("-1");
			}
		},
	});
};
