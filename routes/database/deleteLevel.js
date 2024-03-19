const Logger = require("../../scripts/Logger");
const { deleteLevelSecret } = require("../../config/config");
const { database, checkPassword } = require("../../scripts/database");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	// 1.8, 1.9, 2.0-2.2
	// No support for <2.0 cause the body doesn't contain the account password
	["/deleteGJLevelUser.php", "/deleteGJLevelUser19.php", "/deleteGJLevelUser20.php"].forEach((url) =>
		fastify.route({
			method: ["POST"],
			url,
			schema: {
				consumes: ["x-www-form-urlencoded"],
				body: {
					type: "object",
					properties: {
						secret: { type: "string", const: deleteLevelSecret },
						accountID: { type: "number" },
						levelID: { type: "number", minimum: 1 },
					},
					required: ["secret", "accountID", "levelID"],
				},
			},
			handler: async (req, reply) => {
				const { accountID, levelID } = req.body;

				try {
					if (!(await checkPassword(req.body))) return reply.send("-1");

					const level = await database.levels.findFirst({ where: { id: levelID } });
					if (!level || level.isDeleted) return reply.send("-1");

					if (level.accountId !== accountID) {
						const account = await database.accounts.findFirst({ where: { id: accountID } });
						if (!account?.isActive || !["Moderator", "ElderModerator"].includes(account.modBadge)) return reply.send("-1");
					}

					await database.levels.update({ where: { id: levelID }, data: { isDeleted: true } });

					Logger.log("Delete level", `ID: ${Logger.colors.cyan(levelID)}\n`, `Account: ${Logger.colors.cyan(accountID)}`);

					return reply.send("1");
				} catch (error) {
					Logger.error("Delete level", req.body, error);

					return reply.send("-1");
				}
			},
		}),
	);
};
