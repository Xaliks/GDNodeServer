const _ = require("lodash");
const { getSolo4, XOR, fromBase64, toBase64 } = require("../../scripts/security");
const gdMiddleware = require("../../scripts/gdMiddleware");
const database = require("../../scripts/database");
const { rewards, chestKeyItemValue } = require("../../config/config");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/getGJRewards.php",
		beforeHandler: [gdMiddleware],
		handler: async (req, reply) => {
			const { udid, accountID, gjp2, rewardType, chk } = req.body;

			const account = await database.accounts.findFirst({ where: { id: parseInt(accountID), password: gjp2 } });
			if (!account) return reply.send("-1");

			const updateObject = {};
			if (rewardType === "1") {
				updateObject.lastSmallChest = new Date();
				updateObject.totalSmallChests = { increment: 1 };
			}
			if (rewardType === "2") {
				updateObject.lastBigChest = new Date();
				updateObject.totalBigChests = { increment: 1 };
			}
			const user = await database.users.upsert({
				where: { extId: String(account.id) },
				update: updateObject,
				create: { extId: String(account.id), username: account.username },
			});

			const { remaining: smallChestRemaining, stuff: smallChestStuff } = getChestStuff("1", user);
			const { remaining: bigChestRemaining, stuff: bigChestStuff } = getChestStuff("2", user);

			const result = toBase64(
				XOR.cipher(
					[
						1,
						user.id,
						XOR.cipher(fromBase64(chk.slice(5)), 59182),
						udid,
						account.id,
						smallChestRemaining,
						smallChestStuff,
						user.totalSmallChests,
						bigChestRemaining,
						bigChestStuff,
						user.totalBigChests,
						rewardType,
					].join(":"),
					59182,
				),
			)
				.replaceAll("+", "-")
				.replaceAll("_", "/");

			return reply.send(`SaKuJ${result}|${getSolo4(result)}`);
		},
	});
};

function getChestStuff(type, user) {
	const chest = type === "1" ? rewards.smallChest : rewards.bigChest;
	const lastUserChest = type === "1" ? user.lastSmallChest : user.lastBigChest;

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

	return {
		remaining: lastUserChest ? chest.cooldown - Math.round((Date.now() - lastUserChest.getTime()) / 1_000) : 0,
		stuff: `${orbs},${diamonds},${items.join(",")}`,
	};
}
