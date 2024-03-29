const _ = require("lodash");
const { secret } = require("../../config/config");
const { database, checkPassword } = require("../../scripts/database");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/getGJUserList20.php",
		schema: {
			consumes: ["x-www-form-urlencoded"],
			body: {
				type: "object",
				properties: {
					secret: { type: "string", const: secret },
					accountID: { type: "number" },
					type: { type: "number", enum: [0, 1], default: 0 },
				},
				required: ["secret", "accountID"],
			},
		},
		handler: async (req, reply) => {
			const { accountID, type } = req.body;

			if (!(await checkPassword(req.body))) return reply.send("-1");

			let users = [];

			if (type === 0) {
				const friends = await database.friends.findMany({
					where: { OR: [{ accountId1: accountID }, { accountId2: accountID }] },
				});
				if (!friends.length) return reply.send("-2");

				const newFriends = friends.filter((friendship) => {
					if (friendship.accountId1 === accountID) return friendship.isNewFor1;
					return friendship.isNewFor2;
				});

				users = await database.users
					.findMany({
						where: {
							extId: {
								in: friends.map((friendship) => {
									if (friendship.accountId1 === accountID) return String(friendship.accountId2);
									return String(friendship.accountId1);
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

				const [newFriends1, newFriends2] = _.partition(newFriends, (friendship) => friendship.accountId1 === accountID);
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
				const blocks = await database.blocks.findMany({ where: { accountId: accountID } });
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
