const _ = require("lodash");
const { database, checkPassword } = require("../../scripts/database");
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
	// 1.9, 2.0, 2.1-2.2
	["/getGJLevels19.php", "/getGJLevels20.php", "/getGJLevels21.php"].forEach((url, i, urls) =>
		fastify.route({
			method: ["POST"],
			url,
			schema: {
				consumes: ["x-www-form-urlencoded"],
				body: {
					type: "object",
					properties: {
						secret: { type: "string", const: secret },
						accountID: { type: "number" },
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
					accountID,
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

				if (uncompleted === 1 && onlyCompleted === 1) return reply.send(await returnReplyString());

				let levels = [];
				let totalCount = total;

				const difficulties = Array.isArray(diff) ? diff[0] : null;
				const isId = str && typeof str === "number";
				const queryArgs = { where: { visibility: "Listed", isDeleted: false } };

				if (isId) queryArgs.where.id = str;
				else {
					queryArgs.orderBy = [{ ratedAt: "desc" }, { createdAt: "desc" }];
					queryArgs.skip = page * searchLevelsPageSize;
					queryArgs.take = searchLevelsPageSize;

					if (song !== 0) queryArgs.where.officialSongId = song;
					else if (customSong === 1) queryArgs.where.songId = { not: 0 };
					else if (customSong !== 0) queryArgs.where.songId = customSong;

					if (noStar === 1) queryArgs.where.stars = 0;
					if (mythic || legendary || epic || featured) {
						queryArgs.where.ratingType = { in: [] };

						if (featured === 1) queryArgs.where.ratingType.in.push("Epic");
						if (epic === 1) queryArgs.where.ratingType.in.push("Epic");
						if (legendary === 1) queryArgs.where.ratingType.in.push("Mythic"); // https://i.xaliks.dev/7d64d8a8c5f3f75115c516d0eef0842e.png
						if (mythic === 1) queryArgs.where.ratingType.in.push("Legendary"); // https://i.xaliks.dev/7d64d8a8c5f3f75115c516d0eef0842e.png
					}
					if (original === 1) queryArgs.where.originalLevelId = 0;
					if (twoPlayer === 1) queryArgs.where.isTwoPlayer = true;
					if (coins === 1) queryArgs.where.coins = { gt: 0 };

					if (str) queryArgs.where.name = { contains: str, mode: "insensitive" };
					else if (completedLevels && completedLevels.length > 2) {
						queryArgs.where.id = { in: completedLevels.slice(1, -1).split(",").map(Number).filter(Boolean) };
						if (uncompleted) queryArgs.where.id = { not: queryArgs.where.id };
					} else queryArgs.where.difficulty = { not: "NA" };

					if (len && len !== "-") {
						queryArgs.where.length = { in: _.uniq(len.split(",")).map((str) => Constants.levelLength[str]) };
					}
					if (difficulties && difficulties !== "-") {
						const fetchedDifficulties = [];
						for (const difficulty of _.uniq(difficulties.split(","))) {
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
						if (isId) {
							const level = await database.levels.findFirst({ where: { id: str } });
							if (!level || level.isDeleted) return reply.send(await returnReplyString());

							if (level.visibility === "FriendsOnly") {
								if (await checkPassword(req.body)) {
									if (accountID === level.accountId) levels = [level];
									else {
										const friend = await database.friends.findFirst({
											where: {
												OR: [
													{ accountId1: accountID, accountId2: level.accountId },
													{ accountId1: level.accountId, accountId2: accountID },
												],
											},
										});

										if (friend) levels = [level];
									}
								}
							} else levels = [level];
						} else {
							queryArgs.orderBy = { likes: "desc" };
							queryArgs.where.visibility = { not: "Unlisted" };

							levels = await database.levels.findMany(queryArgs);

							if (levels.some((level) => level.visibility === "FriendsOnly")) {
								if (!(await checkPassword(req.body))) levels = levels.filter((level) => level.visibility === "Listed");
								else if (levels.some((level) => level.accountId !== accountID)) {
									const friends = await database.friends.findMany({
										where: { OR: [{ accountId1: accountID }, { accountId2: accountID }] },
									});

									levels = levels.filter(
										(level) =>
											level.visibility === "Listed" ||
											friends.some((friend) =>
												[accountID, friend.accountId1, friend.accountId2].includes(level.accountId),
											),
									);
								}
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

						const user = await database.users.findFirst({ where: { id: str, isRegistered: true } });
						if (!user) return reply.send(await returnReplyString());

						delete queryArgs.where.id;
						queryArgs.where.accountId = Number(user.extId);
						break;
					case 6: // Featured
					case 17: // Featured in GD Word
						queryArgs.where.ratingType = "Featured";
						break;
					case 7: // Magic
						queryArgs.where.length = {
							in: Constants.levelLength
								.entries()
								.filter(
									([, key]) =>
										key >= (Constants.levelLength[magicLevelRequirements.length] ?? Constants.levelLength.Medium),
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
						if (!(await checkPassword(req.body))) return reply.send("-1");

						const friends = await database.friends.findMany({
							where: { OR: [{ accountId1: accountID }, { accountId2: accountID }] },
						});
						if (!friends.length) return reply.send(await returnReplyString());

						queryArgs.where = {
							accountId: {
								in: friends.map((friend) => (friend.accountId1 === accountID ? friend.accountId2 : friend.accountId1)),
							},
						};
						break;
					case 16: // Hall of fame
						queryArgs.where.ratingType = "Epic";
						break;
					case 21: // Daily safe
					case 22: // Weekly safe
					case 23: // Event safe
					case 27: // Mod sent
					default:
						return reply.send(await returnReplyString());
				}

				if (!levels.length) levels = await database.levels.findMany(queryArgs);
				if (levels.length < searchLevelsPageSize) totalCount = page * searchLevelsPageSize + levels.length;
				else if (!totalCount) totalCount = await database.levels.count(queryArgs);

				return reply.send(await returnReplyString(levels, totalCount, page, i, urls));
			},
		}),
	);
};

async function returnReplyString(levels = [], totalCount = 0, page = 0, i = 0, urls = []) {
	let users = [];
	if (levels.length) {
		users = await database.users.findMany({
			where: { extId: { in: _.uniq(levels).map((level) => String(level.accountId)) } },
		});
	}

	let songs = [];
	const customSongIds = _.uniq(levels.map((level) => level.songId).filter(Boolean));
	if (customSongIds.length) songs = await database.songs.findMany({ where: { id: { in: customSongIds } } });

	return `${levels
		.map((level) => {
			const user = users.find((user) => user.extId === String(level.accountId));
			const isDemon = Constants.selectDemonDifficulty.keys().includes(level.difficulty) ? 1 : 0;

			return [
				[1, level.id],
				[2, level.name],
				// base64 level description for 2.0+
				[3, i <= urls.length - 2 ? level.description ?? "" : toBase64(level.description ?? "")],
				[5, level.version],
				[6, user.id],
				[8, level.difficulty === "NA" ? 0 : 10],
				[9, Constants.returnLevelDifficulty[level.difficulty]],
				[10, level.downloads],
				[12, level.officialSongId],
				[13, level.gameVersion],
				[14, level.likes],
				[15, Constants.levelLength[level.length]],
				[17, isDemon],
				[16, 0],
				[18, level.stars],
				[19, level.ratingType === "Featured" ? 1 : 0],
				[25, level.difficulty === "Auto" ? 1 : 0],
				[30, level.originalLevelId],
				[31, level.isTwoPlayer ? 1 : 0],
				[35, level.songId],
				[36, level.extraString || ""],
				[37, level.coins],
				[38, level.coins && level.stars ? 1 : 0],
				[39, level.requestedStars],
				[42, Constants.levelRatingType[level.ratingType]],
				[43, isDemon ? Constants.returnDemonDifficulty[level.difficulty] : 0],
				[44, 0],
				[45, level.objectCount],
				[46, level.editorTime],
				[47, level.editorTimeCopies],
			]
				.map(([key, value]) => `${key}:${value}`)
				.join(":");
		})
		.join("|")}#${users.map((user) => `${user.id}:${user.username}:${user.extId}`).join("|")}#${songs
		.map((song) =>
			[
				[1, song.id],
				[2, song.name],
				[3, song.artistId],
				[4, song.artistName],
				[5, (song.size / 1024 / 1024).toFixed(2)],
				[6, ""],
				[7, ""],
				[8, 1],
				[10, song.url],
			]
				.map(([key, value]) => `${key}~|~${value}`)
				.join("~|~"),
		)
		.join("~:~")}#${totalCount}:${page * searchLevelsPageSize}:${searchLevelsPageSize}#${getSolo2(
		levels
			.map(
				(level) => `${String(level.id)[0]}${String(level.id).at(-1)}${level.stars}${level.coins && level.stars ? 1 : 0}`,
			)
			.join(""),
	)}`;
}
