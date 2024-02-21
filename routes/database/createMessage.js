const Logger = require("../../scripts/Logger");
const { secretMiddleware, requiredBodyMiddleware } = require("../../scripts/middlewares");
const { database, getUser } = require("../../scripts/database");
const { fromSafeBase64, cipher, fromBase64 } = require("../../scripts/security");
const { userMessageSubjectMaxSize, userMessageContentMaxSize } = require("../../config/config");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/uploadGJMessage20.php",
		beforeHandler: [secretMiddleware, requiredBodyMiddleware(["accountID", "gjp2", "toAccountID", "subject", "body"])],
		handler: async (req, reply) => {
			const { accountID, toAccountID, subject: base64Subject, body } = req.body;

			if (accountID === toAccountID) return reply.send("-1");

			try {
				const { account } = await getUser(req.body, false);
				if (!account) return reply.send("-1");

				const toAccount = await database.accounts.findFirst({ where: { id: parseInt(toAccountID) } });
				if (!toAccount) return reply.send("-1");

				let canSend = true;
				if (toAccount.messageState === 2) canSend = false;
				else if (toAccount.messageState === 1) {
					const friendship = await database.friends.findFirst({
						where: {
							OR: [
								{ accountId1: account.id, accountId2: toAccount.id },
								{ accountId1: toAccount.id, accountId2: account.id },
							],
						},
					});

					canSend = Boolean(friendship);
				} else {
					const blocked = await database.blocks.findFirst({
						where: {
							OR: [
								{ accountId: account.id, targetAccountId: toAccount.id },
								{ accountId: toAccount.id, targetAccountId: account.id },
							],
						},
					});

					canSend = Boolean(!blocked);
				}

				if (!canSend) return reply.send("-1");

				const subject = fromSafeBase64(base64Subject).toString().slice(0, userMessageSubjectMaxSize);
				const content = cipher(fromBase64(body), 14251).toString().slice(0, userMessageContentMaxSize);

				const message = await database.messages.create({
					data: { accountId: account.id, toAccountId: toAccount.id, subject, content },
				});

				Logger.log(
					"Create message",
					`ID: ${Logger.color(Logger.colors.cyan)(message.id)}\n`,
					`From: ${Logger.color(Logger.colors.cyan)(account.username)}/${Logger.color(Logger.colors.gray)(account.id)}\n`,
					`To: ${Logger.color(Logger.colors.cyan)(toAccount.username)}/${Logger.color(Logger.colors.gray)(toAccount.id)}`,
				);

				return reply.send("1");
			} catch (error) {
				Logger.error("Create message", req.body, error);

				return reply.send("-1");
			}
		},
	});
};
