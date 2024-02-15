const _ = require("lodash");
const { getSolo3, cipher, fromBase64, toSafeBase64 } = require("../../scripts/security");
const { secretMiddleware, requiredBodyMiddleware } = require("../../scripts/middlewares");
const { getUser, database } = require("../../scripts/database");
const { rewards } = require("../../config/config");

const startQuestsTimestamp = new Date("2024-02-12T00:00:00.000Z");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/getGJChallenges.php",
		beforeHandler: [secretMiddleware, requiredBodyMiddleware(["udid", "chk"])],
		handler: async (req, reply) => {
			const { udid, accountID, gjp2, chk } = req.body;

			let account;
			if (accountID && gjp2) {
				account = await database.accounts.findFirst({ where: { id: parseInt(accountID), password: gjp2 } });
			}

			const user = await getUser(String(account?.id ?? udid), account?.username);

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
						account?.id ?? "",
						Math.round((new Date().setHours(0, 0, 0, 0) + 24 * 60 * 60_000 - Date.now()) / 1_000),
						...quests.slice(0, 3),
					].join(":"),
					19847,
				),
			);

			return reply.send(`XALIK${result}|${getSolo3(result)}`);
		},
	});
};
