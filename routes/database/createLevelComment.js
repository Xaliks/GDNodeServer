const Logger = require("../../scripts/Logger");
const { database, checkPassword } = require("../../scripts/database");
const { fromSafeBase64 } = require("../../scripts/security");
const { maxLevelCommentLength, secret, safeBase64Pattern } = require("../../config/config");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	// 1.8, 1.9, 2.0, 2.1-2.2
	// No support for <2.0 cause the body doesn't contain the account password
	["/uploadGJComment.php", "/uploadGJComment19.php", "/uploadGJComment20.php", "/uploadGJComment21.php"].forEach((url) =>
		fastify.route({
			method: ["POST"],
			url,
			schema: {
				consumes: ["x-www-form-urlencoded"],
				body: {
					type: "object",
					properties: {
						secret: { type: "string", const: secret },
						accountID: { type: "number" },
						levelID: { type: "number" },
						percent: { type: "number", minimum: 0, maximum: 100, default: 0 },
						comment: { type: "string", pattern: safeBase64Pattern },
					},
					required: ["secret", "accountID", "levelID", "comment"],
				},
			},
			handler: async (req, reply) => {
				const { accountID, levelID, percent, comment: base64Content } = req.body;

				try {
					if (!(await checkPassword(req.body))) return reply.send("-1");

					let levelOrList;
					if (levelID > 0) levelOrList = await database.levels.findFirst({ where: { id: levelID } });
					else levelOrList = await database.lists.findFirst({ where: { id: Math.abs(levelID) } });
					if (!levelOrList || levelOrList.isDeleted) return reply.send("-1");

					if (levelOrList.visibility === "FriendsOnly") {
						if (!(await checkPassword(req.body))) return reply.send("-1");

						if (levelOrList.accountId !== accountID) {
							const friend = await database.friends.findFirst({
								where: {
									OR: [
										{ accountId1: accountID, accountId2: levelOrList.accountId },
										{ accountId1: levelOrList.accountId, accountId2: accountID },
									],
								},
							});
							if (!friend) return reply.send("-1");
						}
					}

					const content = fromSafeBase64(base64Content).toString().slice(0, maxLevelCommentLength);

					const comment = await database.levelComments.create({
						data: { levelId: levelID, accountId: accountID, content, percent },
					});

					Logger.log(
						"Create level comment",
						`ID: ${Logger.colors.cyan(comment.id)}\n`,
						`Level ID: ${Logger.colors.cyan(levelID)}\n`,
						`Account: ${Logger.colors.cyan(accountID)}`,
					);

					return reply.send("1");
				} catch (error) {
					Logger.error("Create account comment", req.body, error);

					return reply.send("-1");
				}
			},
		}),
	);
};
