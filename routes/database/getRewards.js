const _ = require("lodash");
const Logger = require("../../scripts/Logger");
const { getSolo4, cipher, fromBase64, toSafeBase64 } = require("../../scripts/security");
const { getUser, database } = require("../../scripts/database");
const { rewards, chestKeyItemValue, secret, udidPattern, base64Pattern, chest21Items } = require("../../config/config");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/getGJRewards.php",
		schema: {
			consumes: ["x-www-form-urlencoded"],
			body: {
				type: "object",
				properties: {
					secret: { type: "string", const: secret },
					gameVersion: { type: "number", default: 22 },
					accountID: { type: "number" },
					udid: { type: "string", pattern: udidPattern },
					chk: { type: "string", pattern: base64Pattern },
					rewardType: { type: "number", default: 0 },
					r1: { type: "number", default: 0 },
					r2: { type: "number", default: 0 },
				},
				required: ["secret", "udid", "chk"],
			},
		},
		handler: async (req, reply) => {
			const { gameVersion, udid, accountID, chk, r1, r2, rewardType } = req.body;

			try {
				// eslint-disable-next-line prefer-const
				let { account, user } = await getUser(req.body);
				if (account === 0) return reply.send("-1");

				let totalSmallChests = Math.max(user.totalSmallChests, r1);
				let totalBigChests = Math.max(user.totalSmallChests, r2);

				if (rewardType !== 0) {
					const smallChestRemaining = getChestRemaining(1, user);
					const bigChestRemaining = getChestRemaining(2, user);

					if ((rewardType === 1 && smallChestRemaining > 0) || (rewardType === 2 && bigChestRemaining > 0)) {
						return reply.send("-1");
					}

					if (rewardType === 1) totalSmallChests++;
					else totalBigChests++;

					user = await database.users.update({
						where: { id: user.id },
						data: {
							[rewardType === 1 ? "lastSmallChest" : "lastBigChest"]: new Date(),
							[rewardType === 1 ? "totalSmallChests" : "totalBigChests"]:
								rewardType === 1 ? totalSmallChests : totalBigChests,
						},
					});
				}

				const result = toSafeBase64(
					cipher(
						[
							"Xaliks", // random string
							user.id,
							cipher(fromBase64(chk.slice(5)).toString(), 59182),
							udid,
							accountID ?? "",
							getChestRemaining(1, user),
							getChestStuff(1, user, gameVersion),
							totalSmallChests,
							getChestRemaining(2, user),
							getChestStuff(2, user, gameVersion),
							totalBigChests,
							rewardType,
						].join(":"),
						59182,
					),
				);

				return reply.send(`XALIK${result}|${getSolo4(result)}`);
			} catch (error) {
				Logger.error("Get chests", req.body, error);

				return reply.send("-1");
			}
		},
	});
};

function getChestStuff(type, user, gameVersion) {
	const chest = type === 1 ? rewards.smallChest : rewards.bigChest;

	const orbs = _.random(chest.minOrbs, chest.maxOrbs);
	const diamonds = _.random(chest.minDiamonds, chest.maxDiamonds);
	const chestItems = chest.items.filter((item) => gameVersion >= 22 || chest21Items.includes(item));

	const items = [0, 0];
	if (Math.random() < chest.item1Chance(user)) {
		const item1 = Math.random() < chest.key1Chance(user) ? chestKeyItemValue : _.sample(chestItems);
		items.splice(0, 1, item1);

		if (Math.random() < chest.item2Chance(user)) {
			items.splice(
				1,
				1,
				item1 !== chestKeyItemValue && Math.random() < chest.key2Chance(user) ? chestKeyItemValue : _.sample(chestItems),
			);
		}
	}

	return `${orbs},${diamonds},${items.join(",")}`;
}

function getChestRemaining(type, user) {
	const chest = type === 1 ? rewards.smallChest : rewards.bigChest;
	const lastUserChest = type === 1 ? user.lastSmallChest : user.lastBigChest;

	return lastUserChest ? Math.max(0, chest.cooldown - Math.round((Date.now() - lastUserChest.getTime()) / 1_000)) : 0;
}
