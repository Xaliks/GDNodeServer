const Logger = require("../../scripts/Logger");
const { database, getUser } = require("../../scripts/database");
const { fromSafeBase64 } = require("../../scripts/security");
const { maxLevelCommentLength, secret, gjp2Pattern, safeBase64Pattern } = require("../../config/config");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/uploadGJComment21.php",
		schema: {
			consumes: ["x-www-form-urlencoded"],
			body: {
				type: "object",
				properties: {
					secret: { type: "string", const: secret },
					accountID: { type: "number", minimum: 1 },
					gjp2: { type: "string", pattern: gjp2Pattern },
					levelID: { type: "number", minimum: 1 },
					percent: { type: "number", minimum: 0, maximum: 100, default: 0 },
					comment: { type: "string", pattern: safeBase64Pattern },
				},
				required: ["secret", "accountID", "gjp2", "levelID", "comment"],
			},
		},
		handler: async (req, reply) => {
			const { levelID, percent, comment: base64Content } = req.body;

			try {
				const { account } = await getUser(req.body, false);
				if (!account) return reply.send("-1");

				const level = await database.levels.findFirst({ where: { id: levelID } });
				if (!level) return reply.send("-1");

				const content = fromSafeBase64(base64Content).toString().slice(0, maxLevelCommentLength);

				const comment = await database.levelComments.create({
					data: { levelId: level.id, accountId: account.id, content, percent },
				});

				Logger.log(
					"Create level comment",
					`ID: ${Logger.color(Logger.colors.cyan)(comment.id)}\n`,
					`Level ID: ${Logger.color(Logger.colors.cyan)(level.id)}\n`,
					`Account: ${Logger.color(Logger.colors.cyan)(account.username)}/${Logger.color(Logger.colors.gray)(account.id)}`,
				);

				return reply.send("1");
			} catch (error) {
				Logger.error("Create account comment", req.body, error);

				return reply.send("-1");
			}
		},
	});
};
