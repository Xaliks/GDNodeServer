const _ = require("lodash");
const { secretMiddleware, requiredBodyMiddleware } = require("../../scripts/middlewares");
const { database, getUser } = require("../../scripts/database");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/getGJUserList20.php",
		beforeHandler: [secretMiddleware, requiredBodyMiddleware(["accountID", "gjp2", "type"])],
		handler: async (req, reply) => {
			const { account } = await getUser(req.body, false);
			if (!account) return reply.send("-1");

			const type = parseInt(req.body.type) || 0;
			let users = [];

			if (type === 0) {
				const friends = await database.friends.findMany({
					where: { OR: [{ accountId1: account.id }, { accountId2: account.id }] },
				});
				if (!friends.length) return reply.send("-2");

				const newFriends = friends.filter((friendship) => {
					if (friendship.accountId1 === account.id) return friendship.isNewFor1;
					return friendship.isNewFor2;
				});

				users = await database.users
					.findMany({
						where: {
							id: {
								in: friends.map((friendship) => {
									if (friendship.accountId1 === account.id) return friendship.accountId2;
									return friendship.accountId1;
								}),
							},
						},
					})
					.then((friends) =>
						friends.map((user) => ({
							...user,
							isNew: newFriends.find(
								(friendship) => friendship.accountId1 === user.id || friendship.accountId2 === user.id,
							),
						})),
					);

				const [newFriends1, newFriends2] = _.partition(newFriends, (friendship) => friendship.accountId1 === account.id);
				const transaction = [];
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
				if (transaction.length) database.$transaction(transaction);
			}
			if (type === 1) {
				const blocks = await database.blocks.findMany({ where: { accountId: account.id } });
				if (!blocks.length) return reply.send("-2");

				users = await database.users.findMany({
					where: { extId: { in: blocks.map((block) => String(block.targetAccountId)) } },
				});
			}

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
