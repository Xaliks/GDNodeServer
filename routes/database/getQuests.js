const _ = require("lodash");
const { getSolo3, cipher, fromBase64, toSafeBase64 } = require("../../scripts/security");
const { getUser } = require("../../scripts/database");
const { rewards, secret, gjp2Pattern, udidPattern } = require("../../config/config");

const startQuestsTimestamp = new Date("2024-02-12T00:00:00.000Z");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/getGJChallenges.php",
		schema: {
			consumes: ["x-www-form-urlencoded"],
			body: {
				type: "object",
				properties: {
					secret: { type: "string", const: secret },
					accountID: { type: "number", minimum: 1 },
					gjp2: { type: "string", pattern: gjp2Pattern },
					udid: { type: "string", pattern: udidPattern },
					chk: { type: "string", pattern: "^[A-Za-z0-9+/]{4,}={0,2}$" },
				},
				required: ["secret", "udid", "chk"],
			},
		},
		handler: async (req, reply) => {
			const { udid, accountID, chk } = req.body;

			const { account, user } = await getUser(req.body);
			if (account === 0) return reply.send("-1");

			const quests = _.sampleSize(
				rewards.quests.map((quest, i) => {
					const type = { orbs: 1, coins: 2, stars: 3 }[quest.type];
					const id = Date.now() - startQuestsTimestamp.getTime() + i;

					return [id, type, quest.amount, quest.reward, quest.name].join(",");
				}),
				3,
			);

			const result = toSafeBase64(
				cipher(
					[
						"Xaliks", // random string
						user.id,
						cipher(fromBase64(chk.slice(5)).toString(), 19847),
						udid,
						accountID ?? "",
						Math.round((new Date().setHours(0, 0, 0, 0) + 24 * 60 * 60_000 - Date.now()) / 1_000),
						...quests,
					].join(":"),
					19847,
				),
			);

			return reply.send(`XALIK${result}|${getSolo3(result)}`);
		},
	});
};
