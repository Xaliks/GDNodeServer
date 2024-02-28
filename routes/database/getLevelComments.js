const _ = require("lodash");
const { database, getUser } = require("../../scripts/database");
const { toSafeBase64 } = require("../../scripts/security");
const { dateToRelative, hexToRGB, Constants } = require("../../scripts/util");
const { secret, commentColors } = require("../../config/config");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/getGJComments21.php",
		schema: {
			consumes: ["x-www-form-urlencoded"],
			body: {
				type: "object",
				properties: {
					secret: { type: "string", const: secret },
					levelID: { type: "number", minimum: 1 },
					page: { type: "number", minimum: 0, default: 0 },
					total: { type: "number", minimum: 0, default: 0 },
					mode: { type: "number", enum: [0, 1], default: 0 },
					count: { type: "number", minimum: 1, maximum: 50, default: 20 },
				},
				required: ["secret", "levelID"],
			},
		},
		handler: async (req, reply) => {
			const { levelID, page, total, count, mode } = req.body;

			let totalCount = total;

			const level = await database.levels.findFirst({ where: { id: levelID } });
			if (!level) return reply.send("-1");

			if (level.visibility === "FriendsOnly") {
				const { account } = await getUser(req.body, false);
				if (!account) return reply.send("-1");

				if (level.accountId !== account.id) {
					const friend = await database.friends.findFirst({
						where: {
							OR: [
								{ accountId1: account.id, accountId2: level.accountId },
								{ accountId1: level.accountId, accountId2: account.id },
							],
						},
					});
					if (!friend) return reply.send("-1");
				}
			}

			let orderBy = [{ id: "desc" }];
			if (mode === 1) orderBy = [{ likes: "desc" }, { id: "asc" }];

			const comments = await database.levelComments.findMany({
				where: { levelId: level.id },
				take: count,
				skip: page * count,
				orderBy,
			});
			if (!comments.length) return reply.send("#0:0:0");

			if (comments.length < count) totalCount = page * count + comments.length;
			else if (!totalCount) {
				totalCount = await database.levelComments.count({ where: { levelId: level.id } });
			}

			const [accounts, users] = await database.$transaction([
				database.accounts.findMany({
					where: { id: { in: _.uniq(comments.map((comment) => comment.accountId)) } },
				}),
				database.users.findMany({
					where: { extId: { in: _.uniq(comments.map((comment) => String(comment.accountId))) } },
				}),
			]);

			reply.send(
				`${comments
					.map((comment) => {
						const user = users.find((user) => user.extId === String(comment.accountId));
						const account = accounts.find((account) => account.id === comment.accountId);

						return `${[
							[2, toSafeBase64(comment.content)],
							[3, user.id],
							[4, comment.likes],
							[5, 0], // dislikes
							[6, comment.id],
							[7, comment.likes <= -5 ? 1 : 0],
							[8, comment.accountId],
							[9, dateToRelative(comment.createdAt)],
							[10, comment.percent],
							[11, (account && Constants.modBadge[account.modBadge]) || 0],
							[
								12,
								hexToRGB(
									commentColors[comment.accountId] || (account && commentColors[account.modBadge]) || "#ffffff",
								).join(","),
							],
						]
							.map(([key, value]) => `${key}~${value}`)
							.join("~")}:${[
							[1, account?.username || user.username],
							[9, user.displayIcon],
							[10, user.mainColor],
							[11, user.secondColor],
							[14, user.displayIconType],
							[15, user.glow ? 1 : 0],
							[16, comment.accountId],
						]
							.map(([key, value]) => `${key}~${value}`)
							.join("~")}`;
					})
					.join("|")}#${totalCount}:${page * count}:${count}`,
			);
		},
	});
};
