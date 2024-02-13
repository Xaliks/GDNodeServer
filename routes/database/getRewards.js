const _ = require("lodash");
const { getSolo4, XOR, fromBase64, toSafeBase64 } = require("../../scripts/security");
const { secretMiddleware, requiredBodyMiddleware } = require("../../scripts/middlewares");
const { getUser, database } = require("../../scripts/database");
const { rewards, chestKeyItemValue } = require("../../config/config");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/getGJRewards.php",
		beforeHandler: [secretMiddleware, requiredBodyMiddleware(["udid", "rewardType", "chk"])],
		handler: async (req, reply) => {
			const { udid, accountID, rewardType, chk, r1, r2 } = req.body;

			let user = await getUser(String(accountID || udid));

			const totalSmallChests = Math.max(user.totalSmallChests, parseInt(r1) + 1);
			const totalBigChests = Math.max(user.totalBigChests, parseInt(r2) + 1);

			if (rewardType !== "0") {
				const smallChestRemaining = getChestRemaining("1", user);
				const bigChestRemaining = getChestRemaining("2", user);

				if ((rewardType === "1" && smallChestRemaining > 0) || (rewardType === "2" && bigChestRemaining > 0)) {
					return reply.send("-1");
				}

				user = await database.users.update({
					where: { id: user.id },
					data: {
						[rewardType === "1" ? "lastSmallChest" : "lastBigChest"]: new Date(),
						[rewardType === "1" ? "totalSmallChests" : "totalBigChests"]:
							rewardType === "1" ? totalSmallChests : totalBigChests,
					},
				});
			}

			const result = toSafeBase64(
				XOR.cipher(
					[
						"Xaliks", // random string
						user.id,
						XOR.cipher(fromBase64(chk.slice(5)), 59182),
						udid,
						accountID ?? "",
						getChestRemaining("1", user),
						getChestStuff("1", user),
						totalSmallChests,
						getChestRemaining("2", user),
						getChestStuff("2", user),
						totalBigChests,
						rewardType,
					].join(":"),
					59182,
				),
			);

			return reply.send(`XALIK${result}|${getSolo4(result)}`);
		},
	});
};

function getChestStuff(type, user) {
	const chest = type === "1" ? rewards.smallChest : rewards.bigChest;

	const orbs = _.random(chest.minOrbs, chest.maxOrbs);
	const diamonds = _.random(chest.minDiamonds, chest.maxDiamonds);

	const items = [0, 0];
	if (Math.random() < chest.item1Chance(user)) {
		const item1 = Math.random() < chest.key1Chance(user) ? chestKeyItemValue : _.sample(chest.items);
		items.splice(0, 1, item1);

		if (Math.random() < chest.item2Chance(user)) {
			items.splice(
				1,
				1,
				item1 !== chestKeyItemValue && Math.random() < chest.key2Chance(user) ? chestKeyItemValue : _.sample(chest.items),
			);
		}
	}

	return `${orbs},${diamonds},${items.join(",")}`;
}

function getChestRemaining(type, user) {
	const chest = type === "1" ? rewards.smallChest : rewards.bigChest;
	const lastUserChest = type === "1" ? user.lastSmallChest : user.lastBigChest;

	return lastUserChest ? chest.cooldown - Math.round((Date.now() - lastUserChest.getTime()) / 1_000) : 0;
}
