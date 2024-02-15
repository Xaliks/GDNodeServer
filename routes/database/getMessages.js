const { secretMiddleware, requiredBodyMiddleware } = require("../../scripts/middlewares");
const { database } = require("../../scripts/database");
const { toSafeBase64, cipher } = require("../../scripts/security");
const { dateToRelative } = require("../../scripts/util");
const { userMessagesPageSize } = require("../../config/config");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/getGJMessages20.php",
		beforeHandler: [secretMiddleware, requiredBodyMiddleware(["accountID", "gjp2"])],
		handler: async (req, reply) => {
			const { accountID, gjp2 } = req.body;

			const getSent = req.body.getSent === "1";
			const page = parseInt(req.body.page) ?? 0;

			const account = await database.accounts.findFirst({ where: { id: parseInt(accountID), password: gjp2 } });
			if (!account) return reply.send("-1");

			const messages = await database.messages.findMany({
				where: { [getSent ? "accountId" : "toAccountId"]: account.id },
				take: userMessagesPageSize,
				skip: page * userMessagesPageSize,
			});
			if (!messages.length) return reply.send("#0:0:0");

			const accounts = await database.accounts.findMany({
				where: { id: { in: messages.map((msg) => msg[getSent ? "toAccountId" : "accountId"]) } },
			});

			reply.send(
				`${messages
					.map((message) => {
						return [
							[1, message.id],
							[2, message.accountId],
							[3, message.toAccountId],
							[4, toSafeBase64(message.subject)],
							[5, toSafeBase64(cipher(message.content, 14251))],
							[
								6,
								accounts.find((account) => account.id === message[getSent ? "toAccountId" : "accountId"])?.username ??
									"Player",
							],
							[7, dateToRelative(message.createdAt)],
							[8, message.isNew ? 0 : 1],
							[9, getSent ? 1 : 0],
						]
							.map(([key, value]) => `${key}:${value}`)
							.join(":");
					})
					.join("|")}#${messages.length}:${page}:${userMessagesPageSize}`,
			);

			if (!getSent) {
				await database.messages.updateMany({
					where: { id: { in: messages.map((message) => message.id) } },
					data: { isNew: false },
				});
			}
		},
	});
};
