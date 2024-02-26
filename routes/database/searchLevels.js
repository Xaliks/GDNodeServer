const _ = require("lodash");
const { database, getUser } = require("../../scripts/database");
const { toBase64, getSolo2 } = require("../../scripts/security");
const {
	secret,
	searchLevelsPageSize,
	levelNamePattern,
	separatedNumbersPattern,
	magicLevelRequirements,
} = require("../../config/config");
const { Constants } = require("../../scripts/util");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/getGJLevels21.php",
		schema: {
			consumes: ["x-www-form-urlencoded"],
			body: {
				type: "object",
				properties: {
					secret: { type: "string", const: secret },
					str: {
						anyOf: [{ type: "number" }, { type: "string", pattern: `|${levelNamePattern}` }],
					},
					type: { type: "number", enum: [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 15, 16, 17, 18, 21, 22, 27] },
					diff: { type: "array", items: { type: "string", pattern: "-|^(?:(?:-[1-3]|[1-5]),)*(?:-[1-3]|[1-5])$" } },

					len: { type: "string", pattern: "-|^(?:[0-5],)*(?:[0-5])$" },
					page: { type: "number", minimum: 0, default: 0 },
					total: { type: "number", minimum: 0, default: 0 },
					legendary: { type: "number", enum: [0, 1], default: 0 },
					mythic: { type: "number", enum: [0, 1], default: 0 },
					epic: { type: "number", enum: [0, 1], default: 0 },
					featured: { type: "number", enum: [0, 1], default: 0 },
					original: { type: "number", enum: [0, 1], default: 0 },
					twoPlayer: { type: "number", enum: [0, 1], default: 0 },
					coins: { type: "number", enum: [0, 1], default: 0 },
					noStar: { type: "number", enum: [0, 1], default: 0 },
					song: { type: "number", default: 0 },
					customSong: { type: "number", default: 0 },
					demonFilter: { type: "number", enum: [1, 2, 3, 4, 5] },
					uncompleted: { type: "number", enum: [0, 1], default: 0 },
					onlyCompleted: { type: "number", enum: [0, 1], default: 0 },
					completedLevels: { type: "string", pattern: `|\\(${separatedNumbersPattern}\\)` },
					followed: { type: "string", pattern: `|${separatedNumbersPattern}` },
				},
				required: ["secret", "type"],
			},
		},
		handler: async (req, reply) => {
			const {
				type,
				str,
				page,
				total,
				diff,
				legendary,
				mythic,
				epic,
				featured,
				original,
				twoPlayer,
				coins,
				noStar,
				song,
				customSong,
				demonFilter,
				len,
				followed,
				uncompleted,
				onlyCompleted,
				completedLevels,
			} = req.body;

			if (uncompleted === 1 && onlyCompleted === 1) {
				return reply.send(await returnReplyString(levels, totalCount, page));
			}

			let levels = [];
			let totalCount = total;

			const difficulty = Array.isArray(diff) ? diff[0] : null;
			const isId = str && typeof str === "number";
			const queryArgs = { where: {} };

			if (isId) queryArgs.where.id = str;
			else {
				queryArgs.where.visibility = "Listed";
				queryArgs.orderBy = [{ ratedAt: "desc" }, { createdAt: "desc" }];
				queryArgs.skip = page * searchLevelsPageSize;
				queryArgs.take = searchLevelsPageSize;

				if (song !== 0) queryArgs.where.officialSongId = song;
				else if (customSong === 1) queryArgs.where.songId = { not: 0 };
				else if (customSong !== 0) queryArgs.where.songId = customSong;

				if (noStar === 1) queryArgs.where.stars = 0;
				if (legendary === 1) queryArgs.where.isLegendary = true;
				if (mythic === 1) queryArgs.where.isMythic = true;
				if (epic === 1) queryArgs.where.isMythic = true;
				if (featured === 1) queryArgs.where.isFeatured = true;
				if (original === 1) queryArgs.where.originalLevelId = 0;
				if (twoPlayer === 1) queryArgs.where.isTwoPlayer = true;
				if (coins === 1) queryArgs.where.coins = { gt: 0 };

				if (str) queryArgs.where.name = { contains: str, mode: "insensitive" };
				else if (completedLevels && completedLevels.length > 2) {
					queryArgs.where.id = { in: completedLevels.slice(1, -1).split(",").map(Number).filter(Boolean) };
				} else queryArgs.where.difficulty = { not: "NA" };

				if (len && len !== "-") {
					queryArgs.where.length = { in: _.uniq(len.split(",")).map((str) => Constants.levelLength[str]) };
				}
				if (difficulty && difficulty !== "-") {
					const fetchedDifficulties = [];
					for (const difficulty of _.uniq(difficulty.split(","))) {
						if (difficulty === "-2") {
							if (demonFilter) fetchedDifficulties.push(Constants.selectDemonDifficulty[demonFilter]);
							else fetchedDifficulties.push(...Constants.selectDemonDifficulty.values());
						} else fetchedDifficulties.push(Constants.selectLevelDifficulty[difficulty]);
					}

					queryArgs.where.difficulty = { in: fetchedDifficulties };
				}
			}

			switch (type) {
				case 0: // Search
					queryArgs.orderBy = { likes: "desc" };
					if (!isId) queryArgs.where.visibility = { not: "Unlisted" };
					levels = await database.levels.findMany(queryArgs);

					if (levels.some((level) => level.visibility === "FriendsOnly")) {
						const { account } = await getUser(req.body, false);
						if (!account) levels = levels.filter((level) => level.visibility !== "FriendsOnly");
						else if (levels.some((level) => level.accountId !== account.id)) {
							const friends = await database.friends.findMany({
								where: { OR: [{ accountId1: account.id }, { accountId2: account.id }] },
							});

							levels = levels.filter(
								(level) =>
									level.visibility !== "FriendsOnly" ||
									friends.some((friend) => [account.id, friend.accountId1, friend.accountId2].includes(level.accountId)),
							);
						}
					}
					break;
				case 1: // Downloads
					queryArgs.orderBy = { downloads: "desc" };
					break;
				case 2: // Most liked
				case 15: // Most liked in GD Word
					queryArgs.orderBy = { likes: "desc" };
					break;
				case 3: // Trending
					queryArgs.orderBy = { likes: "desc" };
					if (!isId) queryArgs.where.createdAt = { gt: new Date(Date.now() - 7 * 24 * 60 * 60_000) };
					break;
				case 4: // Recent
					if (queryArgs.where.difficulty?.not === "NA") delete queryArgs.where.difficulty;

					queryArgs.orderBy = { createdAt: "desc" };
					break;
				case 5: // User's levels
					if (!isId || str < 1) return reply.send(await returnReplyString());

					delete queryArgs.where.id;
					queryArgs.where.accountId = str;
					break;
				case 6: // Featured
				case 17: // Featured in GD Word
					queryArgs.isFeatured = true;
					break;
				case 7: // Magic
					queryArgs.where.length = {
						in: Constants.levelLength.entries
							.filter(
								([, key]) => key >= (Constants.levelLength[magicLevelRequirements.length] ?? Constants.levelLength.Medium),
							)
							.map(([name]) => name),
					};
					if (magicLevelRequirements.objects) queryArgs.where.objectCount = { gte: magicLevelRequirements.objects };
					if (magicLevelRequirements.LDM) queryArgs.where.isLDM = true;
					if (magicLevelRequirements.original) queryArgs.where.originalLevelId = 0;
					if (magicLevelRequirements.editorTime) queryArgs.where.editorTime = { gte: magicLevelRequirements.editorTime };
					break;
				case 10: // Map packs
				case 19: // Same as map packs
					if (!isId) {
						delete queryArgs.where.name;

						const ids = _.uniq(str.split(",")).map(Number).filter(Boolean);
						if (!ids.length) return reply.send(await returnReplyString());

						queryArgs.where.id = { in: ids };
					}
					break;
				case 11: // Awarded
					queryArgs.where.stars = { gt: 0 };
					break;
				case 12: // Followed
					if (!followed) return reply.send(await returnReplyString());

					queryArgs.where.id = { in: _.uniq(followed.split(",")).map((id) => Number(id)) };
					break;
				case 13: // Friends
					const { account } = await getUser(req.body, false);
					if (!account) return reply.send("-1");

					const friends = await database.friends.findMany({
						where: { OR: [{ accountId1: account.id }, { accountId2: account.id }] },
					});
					if (!friends.length) return reply.send(await returnReplyString());

					queryArgs.where = {
						accountId: {
							in: friends.map((friend) => (friend.accountId1 === account.id ? friend.accountId2 : friend.accountId1)),
						},
					};
					break;
				case 16: // Hall of fame
					queryArgs.where.isEpic = true;
					break;
				case 21: // Daily safe
				case 22: // Weekly safe
				case 23: // Event safe
				case 27: // Mod sent
				default:
					return reply.send(await returnReplyString());
			}

			console.log(queryArgs.where);
			if (!levels.length) levels = await database.levels.findMany(queryArgs);
			if (levels.length < searchLevelsPageSize) totalCount = page * searchLevelsPageSize + levels.length;
			else if (!totalCount) totalCount = await database.levels.count(queryArgs);

			return reply.send(await returnReplyString(levels, totalCount, page));
		},
	});
};

async function returnReplyString(levels = [], totalCount = 0, page = 0) {
	let users = [];
	if (levels.length) {
		users = await database.users.findMany({
			where: { extId: { in: _.uniq(levels.map((level) => String(level.accountId))) } },
		});
	}

	return `${levels
		.map((level) => {
			return [
				[1, level.id],
				[2, level.name],
				[3, toBase64(level.description ?? "")],
				[5, level.version],
				[6, level.accountId],
				[8, level.difficulty === "NA" ? 0 : 10],
				[9, Constants.returnLevelDifficulty[level.difficulty]],
				[10, level.downloads],
				[12, level.officialSongId],
				[13, level.gameVersion],
				[14, level.likes - level.dislikes],
				[15, Constants.levelLength[level.length]],
				[17, Constants.selectDemonDifficulty.values().includes(level.difficulty) ? 1 : 0],
				[18, level.stars],
				[19, level.isFeatured ? 1 : 0],
				[25, level.difficulty === "Auto" ? 1 : 0],
				[30, level.originalLevelId],
				[31, level.isTwoPlayer ? 1 : 0],
				[35, level.officialSongId],
				[36, level.extraString],
				[37, level.coins],
				[38, level.coins ? 1 : 0],
				[39, level.requestedStars],
				[42, level.isEpic ? 1 : 0],
				[43, Constants.returnDemonDifficulty[level.difficulty] ?? 0],
				[45, level.objectCount],
				[46, level.editorTime],
				[47, level.editorTimeCopies],
			]
				.map(([key, value]) => `${key}:${value}`)
				.join(":");
		})
		.join("|")}#${users.map((user) => `${user.id}:${user.username}:${user.extId}`).join("|")}#${
		"" // Insert here custom songs https://github.com/Wyliemaster/gddocs/blob/master/docs/resources/server/song.md
	}#${totalCount}:${page * searchLevelsPageSize}:${searchLevelsPageSize}#${getSolo2(
		levels.map((level) => `${String(level.id)[0]}${String(level.id).at(-1)}${level.stars}${level.coins ? 1 : 0}`).join(""),
	)}`;
}
