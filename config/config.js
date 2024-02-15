/* eslint-disable no-unused-vars */
const FireShard = 1; // 1 2
const IceShard = 2;
const PoisonShard = 3;
const ShadowShard = 4;
const LavaShard = 5;
const Key = 6;
const CrashShard = 9; // IT LITERALLY CRASHES THE GAME
const EarthShard = 10;
const BloodShard = 11;
const MetalShard = 12;
const LightShard = 13;
const SoulShard = 14;

module.exports = {
	port: 59999,
	secret: "Wmfd2893gb7",
	path: "th",
	host: "http://localhost:59999",

	preActiveAccounts: true,
	showNotRegisteredUsersInLeaderboard: true,

	rewards: {
		smallChest: {
			minOrbs: 20,
			maxOrbs: 50,
			minDiamonds: 1,
			maxDiamonds: 4,
			items: [
				// Put a "//" before the shard name to remove it from the awards (Like in CrashShard)
				FireShard,
				IceShard,
				PoisonShard,
				ShadowShard,
				LavaShard,
				EarthShard,
				BloodShard,
				MetalShard,
				LightShard,
				SoulShard,
				// Remove "//" before CrashShard to do some trolling
				// CrashShard,
			],
			/**
			 * Translate it to english yourself cuz I'm too lazy lol :D
			 * Как работает подсчёт количества предметов
			 *
			 * 1. Считаем шанс item1Chance - Шанс выпадения ПЕРВОГО предмета. Если не выпал, то награда сундука - орбы и алмазы
			 * 2. Считаем шанс item2Chance - Шанс выпадения ВТОРОГО предмета, ЕСЛИ ВЫПАЛ ПЕРВЫЙ.
			 * 3. Считаем шанс key1Chance - Шанс, что ПЕРВЫМ предметом выпадет ключ.
			 * 4. Считаем шанс key2Chance - Шанс, что ВТОРЫМ предметом выпадет ключ, ЕСЛИ первый предмет это шард.
			 *
			 * ⚠ Шард не выпадет, если у игрока уже максимальное количество шардов
			 */
			item1Chance: (user) => 0.4,
			item2Chance: (user) => 0.15,
			key1Chance: (user) => 0.45,
			key2Chance: (user) => 0.85,

			cooldown: 4 * 60 * 60, // In seconds. 0 for no cooldown
		},
		bigChest: {
			minOrbs: 200,
			maxOrbs: 400,
			minDiamonds: 2,
			maxDiamonds: 10,
			items: [
				FireShard,
				IceShard,
				PoisonShard,
				ShadowShard,
				LavaShard,
				EarthShard,
				BloodShard,
				MetalShard,
				LightShard,
				SoulShard,
				// CrashShard,
			],
			item1Chance: (user) => 0.65,
			item2Chance: (user) => 0.4,
			key1Chance: (user) => 0.45,
			key2Chance: (user) => 0.85,

			cooldown: 24 * 60 * 60, // In seconds. 0 for no cooldown
		},
		quests: [
			{ name: "Orb finder", type: "orbs", amount: 200, reward: 10 },
			{ name: "Star collector", type: "stars", amount: 5, reward: 10 },
			{ name: "Coin master", type: "coins", amount: 2, reward: 10 },

			{ name: "Orb finder", type: "orbs", amount: 500, reward: 15 },
			{ name: "Star collector", type: "stars", amount: 10, reward: 15 },
			{ name: "Coin master", type: "coins", amount: 4, reward: 15 },

			{ name: "Orb finder", type: "orbs", amount: 1000, reward: 20 },
			{ name: "Star collector", type: "stars", amount: 15, reward: 20 },
			{ name: "Coin master", type: "coins", amount: 6, reward: 20 },
		],
	},

	timeMaxCounts: 2, // -> years, months, days, hours, minutes, seconds
	userCommentsPageSize: 10,
	userCommentMaxSize: 140,
	userMessageSubjectMaxSize: 35,
	userMessageContentMaxSize: 200,
	userMessagesPageSize: 10,

	// Don't touch the lines below this one
	chestKeyItemValue: Key,
};
