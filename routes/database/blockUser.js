const Logger = require("../../scripts/Logger");
const { secret, gjp2Pattern } = require("../../config/config");
const { database, getUser } = require("../../scripts/database");

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
					accountID: { type: "number", minimum: 1 },
					gjp2: { type: "string", pattern: gjp2Pattern },
					targetAccountID: { type: "number", minimum: 1 },
				},
				required: ["secret", "accountID", "gjp2", "targetAccountID"],
			},
		},
		handler: async (req, reply) => {
			const { accountID, targetAccountID } = req.body;

			if (accountID === targetAccountID) return reply.send("-1");

			try {
				const { account } = await getUser(req.body, false);
				if (!account) return reply.send("-1");

				const targetAccount = await database.accounts.findFirst({ where: { id: targetAccountID } });
				if (!targetAccount) return reply.send("1");

				const [block] = await database.$transaction([
					database.blocks.upsert({
						where: { accountId_targetAccountId: { accountId: account.id, targetAccountId: targetAccount.id } },
						update: {},
						create: { accountId: account.id, targetAccountId: targetAccount.id },
					}),
					database.friends.deleteMany({
						where: {
							OR: [
								{ accountId1: account.id, accountId2: targetAccount.id },
								{ accountId1: targetAccount.id, accountId2: account.id },
							],
						},
					}),
					database.friendRequests.deleteMany({
						where: {
							OR: [
								{ accountId: account.id, toAccountId: targetAccount.id },
								{ accountId: targetAccount.id, toAccountId: account.id },
							],
						},
					}),
				]);

				Logger.log(
					"Block user",
					`ID: ${Logger.color(Logger.colors.cyan)(block.id)}\n`,
					`Account: ${Logger.color(Logger.colors.cyan)(account.username)}/${Logger.color(Logger.colors.gray)(account.id)}\n`,
					`Target: ${Logger.color(Logger.colors.cyan)(targetAccount.username)}/${Logger.color(Logger.colors.gray)(targetAccount.id)}`,
				);

				return reply.send("1");
			} catch (error) {
				Logger.error("Block user", req.body, error);

				return reply.send("-1");
			}
		},
	});
};
