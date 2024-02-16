const _ = require("lodash");
const { secretMiddleware, requiredBodyMiddleware } = require("../../scripts/middlewares");
const { database } = require("../../scripts/database");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/getGJUserList20.php",
		beforeHandler: [secretMiddleware, requiredBodyMiddleware(["accountID", "gjp2", "type"])],
		handler: async (req, reply) => {
			const { accountID, gjp2 } = req.body;

			const account = await database.accounts.findFirst({ where: { id: parseInt(accountID), password: gjp2 } });
			if (!account) return reply.send("-1");

			const type = parseInt(req.body.type) || 0;
			let users = [];

			if (type === 0) {
				const friends = await database.friends.findMany({
					where: { OR: [{ accountId1: account.id }, { accountId2: account.id }] },
				});

				const [newFriends1, newFriends2] = _.partition(
					friends.filter((friendship) => {
						if (friendship.accountId1 === account.id) return friendship.isNewFor1;
						return friendship.isNewFor2;
					}),
					(friendship) => friendship.accountId1 === account.id,
				);
				const transaction = [
					database.users.findMany({
						where: {
							id: {
								in: friends
									.map((friendship) => [friendship.accountId1, friendship.accountId2])
									.flat()
									.filter((id) => id !== account.id),
							},
						},
					}),
				];
				if (newFriends1.length) {
					transaction.push(
						database.friends.updateMany({
							where: { id: { in: newFriends1.map((friendship) => friendship.id) } },
							data: { isNewFor1: false },
						}),
					);
				}
				if (newFriends2.length) {
					transaction.push(
						database.friends.updateMany({
							where: { id: { in: newFriends2.map((friendship) => friendship.id) } },
							data: { isNewFor2: false },
						}),
					);
				}

				const [usersWithoutNew] = await database.$transaction(transaction);
				users = usersWithoutNew.map((user) => ({
					...user,
					isNew:
						newFriends1.find((friendship) => friendship.isNewFor1) ||
						newFriends2.find((friendship) => friendship.isNewFor2),
				}));
			}
			// blocked users - type 1

			if (!users.length) return reply.send("-2");

			reply.send(
				users
					.map((user) => {
						return [
							[1, user.username],
							[2, user.id],
							[16, user.extId],
							[9, user.displayIcon],
							[14, user.displayIconType],
							[10, user.mainColor],
							[15, user.special],
							[11, user.secondColor],
							[41, user.isNew ? 1 : 0],
						]
							.map(([key, value]) => `${key}:${value}`)
							.join(":");
					})
					.join("|"),
			);
		},
	});
};
