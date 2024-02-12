const _ = require("lodash");
const { getSolo3, XOR, fromBase64, toBase64 } = require("../../scripts/security");
const gdMiddleware = require("../../scripts/gdMiddleware");
const database = require("../../scripts/database");
const { rewards } = require("../../config/config");

const startQuestsTimestamp = new Date("2024-02-12T00:00:00.000Z");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/getGJChallenges.php",
		beforeHandler: [gdMiddleware],
		handler: async (req, reply) => {
			const { udid, accountID, gjp2, chk } = req.body;

			const account = await database.accounts.findFirst({ where: { id: parseInt(accountID), password: gjp2 } });
			if (!account) return reply.send("-1");

			const user = await database.users.upsert({
				where: { extId: String(account.id) },
				update: {},
				create: { extId: String(account.id), username: account.username },
			});

			const quests = _.sampleSize(
				rewards.quests.map((quest, i) => {
					const type = { orbs: 1, stars: 2, coins: 3 }[quest.type];
					const id = Date.now() - startQuestsTimestamp.getTime() + i;

					return [id, type, quest.amount, quest.reward, quest.name].join(",");
				}),
				3,
			);

			const result = toBase64(
				XOR.cipher(
					[
						"SaKuJ",
						user.id,
						XOR.cipher(fromBase64(chk.slice(5)), 19847),
						udid,
						account.id,
						Math.round((new Date().setHours(0, 0, 0, 0) + 24 * 60 * 60_000 - Date.now()) / 1_000),
						...quests.slice(0, 3),
					].join(":"),
					19847,
				),
			)
				.replaceAll("+", "-")
				.replaceAll("_", "/");

			return reply.send(`SaKuJ${result}|${getSolo3(result)}`);
		},
	});
};
