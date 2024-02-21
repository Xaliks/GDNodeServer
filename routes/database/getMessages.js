const { secretMiddleware, requiredBodyMiddleware } = require("../../scripts/middlewares");
const { database, getUser } = require("../../scripts/database");
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
			const getSent = req.body.getSent === "1";
			const page = Math.max(req.body.page, 0);
			let totalCount = Math.max(req.body.total, 0);

			const { account } = await getUser(req.body, false);
			if (!account) return reply.send("-1");

			const messages = await database.messages.findMany({
				where: { [getSent ? "accountId" : "toAccountId"]: account.id },
				take: userMessagesPageSize,
				skip: page * userMessagesPageSize,
			});
			if (!messages.length) return reply.send("-2");

			if (messages.length < userMessagesPageSize) totalCount = page * userMessagesPageSize + messages.length;
			else if (!totalCount) {
				totalCount = await database.messages.count({
					where: { [getSent ? "accountId" : "toAccountId"]: account.id },
				});
			}

			const users = await database.users.findMany({
				where: { extId: { in: messages.map((msg) => String(msg[getSent ? "toAccountId" : "accountId"])) } },
			});

			reply.send(
				`${messages
					.map((message) => {
						const user = users.find((user) => user.extId === String(message[getSent ? "toAccountId" : "accountId"]));

						return [
							[1, message.id],
							[2, user.extId],
							[3, user.id],
							[4, toSafeBase64(message.subject)],
							[5, toSafeBase64(cipher(message.content, 14251))],
							[6, user.username],
							[7, dateToRelative(message.createdAt)],
							[8, message.isNew ? 0 : 1],
							[9, getSent ? 1 : 0],
						]
							.map(([key, value]) => `${key}:${value}`)
							.join(":");
					})
					.join("|")}#${totalCount * userMessagesPageSize}:${page}:${userMessagesPageSize}`,
			);

			if (!getSent) {
				await database.messages.updateMany({
					where: { id: { in: messages.map((message) => message.id) } },
					data: { isNew: false },
				});
			}
		},
	});

	fastify.route({
		method: ["POST"],
		url: "/downloadGJMessage20.php",
		beforeHandler: [secretMiddleware, requiredBodyMiddleware(["accountID", "gjp2", "message"])],
		handler: async (req, reply) => {
			const { message: messageID } = req.body;

			const { account } = await getUser(req.body, false);
			if (!account) return reply.send("-1");

			const message = await database.messages.findFirst({ where: { id: parseInt(messageID) } });
			if (!message || (message.accountId === account.id && message.toAccountId === account.id)) return reply.send("-1");

			const secondUser = await database.users.findFirst({
				where: { extId: String(message.toAccountId !== account.id ? message.toAccountId : message.accountId) },
			});

			reply.send(
				[
					[1, message.id],
					[2, secondUser.extId],
					[3, secondUser.id],
					[4, toSafeBase64(message.subject)],
					[5, toSafeBase64(cipher(message.content, 14251))],
					[6, secondUser.username],
					[7, dateToRelative(message.createdAt)],
					[8, message.isNew ? 0 : 1],
					[9, message.toAccountId === account.id ? 1 : 0],
				]
					.map(([key, value]) => `${key}:${value}`)
					.join(":"),
			);
		},
	});
};
