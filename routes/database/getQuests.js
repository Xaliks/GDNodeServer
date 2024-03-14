const { getSolo3, cipher, fromBase64, toSafeBase64 } = require("../../scripts/security");
const { getUser, database } = require("../../scripts/database");
const { secret, udidPattern, base64Pattern } = require("../../config/config");
const { Constants } = require("../../scripts/util");

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
					accountID: { type: "number" },
					udid: { type: "string", pattern: udidPattern },
					chk: { type: "string", pattern: base64Pattern },
				},
				required: ["secret", "udid", "chk"],
			},
		},
		handler: async (req, reply) => {
			const { udid, accountID, chk } = req.body;

			const { account, user } = await getUser(req.body);
			if (account === 0 || !user) return reply.send("-1");

			const quests = await database.$queryRaw`select * from "public"."Quests" order by random() limit 3`;
			const now = Date.now();

			const result = toSafeBase64(
				cipher(
					[
						"Xaliks", // random string
						user.id,
						cipher(fromBase64(chk.slice(5)).toString(), 19847),
						udid,
						accountID ?? "",
						Math.round((new Date().setHours(0, 0, 0, 0) + 24 * 60 * 60_000 - now) / 1_000),
						...quests.map((quest) =>
							[now + quest.id, Constants.questType[quest.type], quest.amount, quest.reward, quest.name].join(","),
						),
					].join(":"),
					19847,
				),
			);

			return reply.send(`XALIK${result}|${getSolo3(result)}`);
		},
	});
};
