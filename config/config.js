/* eslint-disable no-unused-vars */
const FireShard = 1; // 1 2
const IceShard = 2;
const PoisonShard = 3;
const ShadowShard = 4;
const LavaShard = 5;
const Key = 6;
const EarthShard = 10;
const BloodShard = 11;
const MetalShard = 12;
const LightShard = 13;
const SoulShard = 14;

module.exports = {
	port: 34602,
	dashboardPath: "dashboard",
	databasePath: ["gd_database", "gddatabase"], // 1 - for http; 2 - for https. If your host starts with https, then set them to the same with final length 34
	host: "http://localhost:34602",
	// In this case, it will be "http://localhost:34602/gd_database" and "http://localhost:34602/gddatabase" - [34, 33] symbols, no more, no less.

	preActiveAccounts: true,
	showNotRegisteredUsersInLeaderboard: true,
	levelReuploaderAccountId: 2, // Create an account and then set its id here.

	rewards: {
		smallChest: {
			minOrbs: 20,
			maxOrbs: 50,
			minDiamonds: 1,
			maxDiamonds: 4,
			items: [
				// Put a "//" before the shard name to remove it from the awards
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
			],
			item1Chance: (user) => 0.65,
			item2Chance: (user) => 0.4,
			key1Chance: (user) => 0.45,
			key2Chance: (user) => 0.85,

			cooldown: 24 * 60 * 60, // In seconds. 0 for no cooldown
		},
	},

	commentColors: {
		Moderator: "#a8ffa8",
		ElderModerator: "#00ff00",
		LeaderboardModerator: "#69bbff",
	},
	defaultLevel: {
		downloads: 0,
		likes: 0,
	},
	defaultList: {
		downloads: 0,
		likes: 0,
	},

	magicLevelRequirements: {
		length: "Medium", // Minimum length of the level (Tiny | Short | Medium | Long | XL). Default: Medium
		objects: 10000, // Minimum number of the objects. Default: 10000
		LDM: true, // Level must have LDM (true | false). Default: true
		original: true, // Level must be original (true | false). Default: true
		editorTime: 2700, // Seconds spent in the editor. Default: 2700 (45 min)
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
	searchListsPageSize: 10, // Number of lists per page
	maxAccountBackupSize: 50 * 1024 * 1024, // Maximum size of the account backup in bytes
	maxLevelSize: 5 * 1024 * 1024,
	maxLevelCommentLength: 100,

	// Don't touch the lines below this one
	secret: "Wmfd2893gb7",
	accountSecret: "Wmfv3899gc9",
	deleteLevelSecret: "Wmfv2898gc9",
	gjp2Pattern: "^[0-9a-f]{40}$",
	udidPattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
	safeBase64Pattern: "^[A-Za-z0-9-_]{2,}={0,2}$",
	base64Pattern: "^[A-Za-z0-9+/]{2,}={0,2}$",
	levelNamePattern: "^[ a-zA-Z0-9]{1,20}$",
	listNamePattern: "^[ a-zA-Z0-9]{1,25}$",
	separatedNumbersPattern: "^(?:\\d+,)*\\d+$",
	chestKeyItemValue: Key,
	chest21Items: [FireShard, IceShard, PoisonShard, ShadowShard, LavaShard, Key],
	// https://emailregex.com
	emailRegex:
		/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
	// From login form
	usernameRegex: /^[a-zA-Z0-9]{3,15}$/,
	passwordRegex: /^[ -_a-zA-Z0-9]{6,20}$/,
};
