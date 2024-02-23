const Logger = require("../../scripts/Logger");
const { database, getUser } = require("../../scripts/database");
const { toSafeBase64 } = require("../../scripts/security");
const { dateToRelative } = require("../../scripts/util");
const { userFriendRequestPageSize, secret, gjp2Pattern } = require("../../config/config");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/getGJFriendRequests20.php",
		schema: {
			consumes: ["x-www-form-urlencoded"],
			body: {
				type: "object",
				properties: {
					secret: { type: "string", const: secret },
					accountID: { type: "number", minimum: 1 },
					gjp2: { type: "string", pattern: gjp2Pattern },
					page: { type: "number", minimum: 0, default: 0 },
					total: { type: "number", minimum: 0, default: 0 },
				},
				required: ["secret", "accountID", "gjp2"],
			},
		},
		handler: async (req, reply) => {
			const { page, total } = req.body;

			const getSent = req.body.getSent === "1";
			let totalCount = total;

			const { account } = await getUser(req.body, false);
			if (!account) return reply.send("-1");

			const friendRequests = await database.friendRequests.findMany({
				where: { [getSent ? "accountId" : "toAccountId"]: account.id },
				take: userFriendRequestPageSize,
				skip: page * userFriendRequestPageSize,
				orderBy: { id: "desc" },
			});
			if (!friendRequests.length) return reply.send("-2");

			if (friendRequests.length < userFriendRequestPageSize) {
				totalCount = page * userFriendRequestPageSize + friendRequests.length;
			} else if (!totalCount) {
				totalCount = await database.friendRequests.count({
					where: { [getSent ? "accountId" : "toAccountId"]: account.id },
				});
			}

			const users = await database.users.findMany({
				where: { extId: { in: friendRequests.map((msg) => String(msg[getSent ? "toAccountId" : "accountId"])) } },
			});

			reply.send(
				`${friendRequests
					.map((friendRequest) => {
						const user = users.find((user) => user.extId === String(friendRequest[getSent ? "toAccountId" : "accountId"]));

						return [
							[1, user.username],
							[2, user.id],
							[16, user.extId],
							[9, user.displayIcon],
							[14, user.displayIconType],
							[10, user.mainColor],
							[15, user.special],
							[11, user.secondColor],
							[32, friendRequest.id],
							[35, toSafeBase64(friendRequest.comment ?? "")],
							[37, dateToRelative(friendRequest.createdAt, 1)],
							[41, friendRequest.isNew ? 0 : 1],
						]
							.map(([key, value]) => `${key}:${value}`)
							.join(":");
					})
					.join("|")}#${totalCount * userFriendRequestPageSize}:${page}:${userFriendRequestPageSize}`,
			);

			if (!getSent) {
				await database.friendRequests.updateMany({
					where: { id: { in: friendRequests.map((friendRequest) => friendRequest.id) } },
					data: { isNew: false },
				});
			}
		},
	});

	fastify.route({
		method: ["POST"],
		url: "/readGJFriendRequest20.php",
		schema: {
			consumes: ["x-www-form-urlencoded"],
			body: {
				type: "object",
				properties: {
					secret: { type: "string", const: secret },
					accountID: { type: "number", minimum: 1 },
					gjp2: { type: "string", pattern: gjp2Pattern },
					requestID: { type: "number", minimum: 1 },
				},
				required: ["secret", "accountID", "gjp2", "requestID"],
			},
		},
		handler: async (req, reply) => {
			const { requestID } = req.body;

			try {
				const { account } = await getUser(req.body, false);
				if (!account) return reply.send("-1");

				const friendRequest = await database.friendRequests
					.update({ where: { id: requestID, toAccountId: account.id }, data: { isNew: false } })
					.catch(() => null);
				if (!friendRequest) return reply.send("-1");

				Logger.log(
					"Read friend request",
					`ID: ${Logger.color(Logger.colors.cyan)(friendRequest.id)}\n`,
					`From: ${Logger.color(Logger.colors.gray)(friendRequest.accountId)}\n`,
					`To: ${Logger.color(Logger.colors.cyan)(account.username)}/${Logger.color(Logger.colors.gray)(friendRequest.toAccountId)}`,
				);

				return reply.send("1");
			} catch (error) {
				Logger.error("Read friend request", req.body, error);

				return reply.send("-1");
			}
		},
	});
};
