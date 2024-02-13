const Logger = require("../../scripts/Logger");
const { secretMiddleware, requiredBodyMiddleware } = require("../../scripts/middlewares");
const { database } = require("../../scripts/database");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/updateGJAccSettings20.php",
		beforeHandler: [secretMiddleware, requiredBodyMiddleware(["accountID", "gjp2"])],
		handler: async (req, reply) => {
			const { accountID, gjp2 } = req.body;

			try {
				const account = await database.accounts.findFirst({ where: { id: parseInt(accountID), password: gjp2 } });
				if (!account) return reply.send("-1");

				await database.accounts.update({
					where: { id: account.id },
					data: {
						messageState: parseInt(req.body.mS),
						friendRequestState: parseInt(req.body.frS),
						commentHistorySate: parseInt(req.body.cS),
						youtube: req.body.yt,
						twitter: req.body.twitter,
						twitch: req.body.twitch,
					},
				});

				Logger.log(
					"User update",
					`User ${Logger.color(Logger.colors.cyan)(account.username)}/${Logger.color(Logger.colors.gray)(account.id)} updated.`,
				);

				return reply.send("1");
			} catch (error) {
				Logger.error("User update", req.body, error);

				return reply.send("-1");
			}
		},
	});
};
