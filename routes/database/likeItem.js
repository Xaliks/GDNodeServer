const Logger = require("../../scripts/Logger");
const { database, checkPassword } = require("../../scripts/database");
const { Constants } = require("../../scripts/util");
const { secret } = require("../../config/config");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/likeGJItem211.php",
		schema: {
			consumes: ["x-www-form-urlencoded"],
			body: {
				type: "object",
				properties: {
					secret: { type: "string", const: secret },
					accountID: { type: "number" },
					type: { type: "number", enum: Constants.likeCommentType.values() },
					itemID: { type: "number", minimum: 1 },
					like: { type: "number", enum: [0, 1] },
				},
				required: ["secret", "itemID", "type", "like"],
			},
		},
		handler: async (req, reply) => {
			const { accountID, type, itemID, like } = req.body;

			try {
				if (!(await checkPassword(req.body))) return reply.send("-1");

				let table;
				if (type === Constants.likeCommentType.Level) {
					const level = await database.levels.findFirst({ where: { id: itemID } });
					if (!level) return reply.send("1");

					if (level.visibility === "FriendsOnly" && level.accountId !== accountID) {
						const friendship = await database.friends.findFirst({
							where: {
								OR: [
									{ accountId1: accountID, accountId2: level.accountId },
									{ accountId1: level.accountId, accountId2: accountID },
								],
							},
						});

						if (!friendship) return reply.send("1");
					}

					table = "levels";
				}
				if (type === Constants.likeCommentType.LevelComment) {
					const comment = await database.levelComments.findFirst({ where: { id: itemID }, include: { level: true } });
					if (!comment) return reply.send("1");

					if (comment.level.visibility === "FriendsOnly" && comment.level.accountId !== accountID) {
						const friendship = await database.friends.findFirst({
							where: {
								OR: [
									{ accountId1: accountID, accountId2: comment.level.accountId },
									{ accountId1: comment.level.accountId, accountId2: accountID },
								],
							},
						});

						if (!friendship) return reply.send("1");
					}

					table = "levelComments";
				}
				if (type === Constants.likeCommentType.AccountComment) {
					const comment = await database.accountComments.findFirst({ where: { id: itemID }, include: { account: true } });
					if (!comment) return reply.send("1");

					if (comment.account.commentHistoryState === 2) return reply.send("1");
					if (comment.account.commentHistoryState === 1) {
						const friendship = await database.friends.findFirst({
							where: {
								OR: [
									{ accountId1: accountID, accountId2: comment.accountId },
									{ accountId1: comment.accountId, accountId2: accountID },
								],
							},
						});

						if (!friendship) return reply.send("1");
					}

					table = "accountComments";
				}
				if (type === Constants.likeCommentType.List) {
					// TODO
				}

				const createdLike = await database.likes
					.create({
						data: {
							itemType: Constants.likeCommentType[type],
							itemId: itemID,
							accountId: accountID,
							isLike: Boolean(like),
						},
					})
					.catch(() => null);
				if (!createdLike) return reply.send("1");

				await database[table].update({
					where: { id: createdLike.itemId },
					data: { likes: { [like ? "increment" : "decrement"]: 1 } },
				});

				Logger.log(
					`${like ? "Like" : "Dislike"} item`,
					`ID: ${Logger.color(Logger.colors.cyan)(createdLike.itemId)}\n`,
					`Type: ${Logger.color(Logger.colors.cyan)(createdLike.itemType)}\n`,
					`Account: ${Logger.color(Logger.colors.cyan)(accountID)}`,
				);

				return reply.send("1");
			} catch (error) {
				Logger.error(`${like ? "Like" : "Dislike"} item`, req.body, error);

				return reply.send("-1");
			}
		},
	});
};
