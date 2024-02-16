const { secretMiddleware, requiredBodyMiddleware } = require("../../scripts/middlewares");
const { database } = require("../../scripts/database");
const { toSafeBase64 } = require("../../scripts/security");
const { dateToRelative } = require("../../scripts/util");
const { userFriendRequestPageSize } = require("../../config/config");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/getGJFriendRequests20.php",
		beforeHandler: [secretMiddleware, requiredBodyMiddleware(["accountID", "gjp2"])],
		handler: async (req, reply) => {
			const { accountID, gjp2 } = req.body;

			const getSent = req.body.getSent === "1";
			const page = Math.max(req.body.page, 0);
			let totalCount = Math.max(req.body.total, 0);

			const account = await database.accounts.findFirst({ where: { id: parseInt(accountID), password: gjp2 } });
			if (!account) return reply.send("-1");

			const friendRequests = await database.friendRequests.findMany({
				where: { [getSent ? "accountId" : "toAccountId"]: account.id },
				take: userFriendRequestPageSize,
				skip: page * userFriendRequestPageSize,
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
};
