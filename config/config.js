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
	databasePath: "gd_database", // if your full url (like http://localhost:59999) length is not matching to 33, then use it /
	host: "http://localhost:59999",
	// In this case, it will be "http://localhost:59999/gd_database" - 33 symbols, no more, no less.

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
	userCommentsPageSize: 10, // Number of comments per page
	userCommentMaxSize: 140, // Max length of user comment
	userFriendsMax: 300, // User friends limit
	userFriendRequestCommentMaxSize: 140, // Max length of friend request comment
	userFriendRequestPageSize: 10, // Number of friend requests per page
	userMessageSubjectMaxSize: 35, // Max length of message subject
	userMessageContentMaxSize: 200, // Max length of message content
	userMessagesPageSize: 10, // Number of messages per page
	searchUsersPageSize: 10, // Number of users per page
	searchLevelsPageSize: 10, // Number of levels per page

	// Don't touch the lines below this one
	secret: "Wmfd2893gb7",
	accountSecret: "Wmfv3899gc9",
	gjp2Pattern: "^[0-9a-f]{40}$",
	udidPattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
	safeBase64Pattern: "^[A-Za-z0-9-_]{4,}={0,2}$",
	base64Pattern: "^[A-Za-z0-9+/]{4,}={0,2}$",
	levelNamePattern: "^[ a-zA-Z0-9]{1,20}$",
	separatedNumbersPattern: "^(?:\\d+,)*\\d+$",
	chestKeyItemValue: Key,
	// https://emailregex.com
	emailRegex:
		/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
	// From login form
	usernameRegex: /^[a-zA-Z0-9]{3,15}$/,
	passwordRegex: /^[ -_a-zA-Z0-9]{6,20}$/,
};
