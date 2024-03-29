const Logger = require("../../scripts/Logger");
const { deleteLevelSecret } = require("../../config/config");
const { database, checkPassword } = require("../../scripts/database");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	// 2.2
	["/deleteGJLevelList.php"].forEach((url) =>
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
						listID: { type: "number", minimum: 1 },
					},
					required: ["secret", "accountID", "listID"],
				},
			},
			handler: async (req, reply) => {
				const { accountID, listID } = req.body;

				try {
					if (!(await checkPassword(req.body))) return reply.send("-1");

					const list = await database.lists.findFirst({ where: { id: listID } });
					if (!list || list.isDeleted) return reply.send("-1");

					if (list.accountId !== accountID) {
						const account = await database.accounts.findFirst({ where: { id: accountID } });
						if (!account?.isActive || !["Moderator", "ElderModerator"].includes(account.modBadge)) return reply.send("-1");
					}

					await database.lists.update({ where: { id: listID }, data: { isDeleted: true } });

					Logger.log("Delete list", `ID: ${Logger.colors.cyan(listID)}\n`, `Account: ${Logger.colors.cyan(accountID)}`);

					return reply.send("1");
				} catch (error) {
					Logger.error("Delete list", req.body, error);

					return reply.send("-1");
				}
			},
		}),
	);
};
