const Logger = require("../../scripts/Logger");
const { accountSecret } = require("../../config/config");
const { database, getPassword } = require("../../scripts/database");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/updateGJAccSettings20.php",
		schema: {
			consumes: ["x-www-form-urlencoded"],
			body: {
				type: "object",
				properties: {
					secret: { type: "string", const: accountSecret },
					accountID: { type: "number" },
					mS: { type: "number", enum: [0, 1, 2] },
					frS: { type: "number", enum: [0, 1] },
					cS: { type: "number", enum: [0, 1, 2] },
					yt: { type: "string" },
					twitter: { type: "string" },
					twitch: { type: "string" },
				},
				required: ["secret", "accountID", "mS", "frS", "cS", "yt", "twitter", "twitch"],
			},
		},
		handler: async (req, reply) => {
			const { accountID, mS, frS, cS, yt, twitter, twitch } = req.body;

			try {
				const password = getPassword(req.body);
				if (!password) return reply.send("-1");

				const account = await database.accounts
					.update({
						where: { id: accountID, password },
						data: { messageState: mS, friendRequestState: frS, commentHistoryState: cS, youtube: yt, twitter, twitch },
					})
					.catch(() => null);
				if (!account) return reply.send("-1");

				Logger.log(
					"User update",
					`User ${Logger.colors.cyan(account.username)}/${Logger.colors.gray(account.id)} updated.`,
				);

				return reply.send("1");
			} catch (error) {
				Logger.error("User update", req.body, error);

				return reply.send("-1");
			}
		},
	});
};
