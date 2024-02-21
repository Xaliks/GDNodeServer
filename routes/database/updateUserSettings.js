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
		beforeHandler: [
			secretMiddleware,
			requiredBodyMiddleware(["accountID", "gjp2", "mS", "frS", "cS", "yt", "twitter", "twitch"]),
		],
		handler: async (req, reply) => {
			const { accountID, gjp2, mS, frS, cS, yt, twitter, twitch } = req.body;

			try {
				const account = await database.accounts
					.update({
						where: { id: parseInt(accountID), password: gjp2 },
						data: {
							messageState: parseInt(mS),
							friendRequestState: parseInt(frS),
							commentHistorySate: parseInt(cS),
							youtube: yt,
							twitter,
							twitch,
						},
					})
					.catch(() => null);
				if (!account) return reply.send("-1");

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
