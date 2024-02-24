const _ = require("lodash");
const { database } = require("../../scripts/database");
const { toBase64, getSolo2 } = require("../../scripts/security");
const { secret, searchLevelsPageSize, levelNamePattern } = require("../../config/config");

const levelDifficultyToNumber = {
	NA: 0,
	Easy: 10,
	Normal: 20,
	Hard: 30,
	Harder: 40,
	Insane: 50,
	EasyDemon: 50,
	MediumDemon: 50,
	HardDemon: 50,
	InsaneDemon: 50,
	ExtremeDemon: 50,
};
const numberDifficultyToDifficulty = {
	"-3": "Auto",
	"-1": "NA",
	1: "Easy",
	2: "Normal",
	3: "Hard",
	4: "Harder",
	5: "Insane",
};
const demonFilterToDemonDifficulty = {
	1: "EasyDemon",
	2: "MediumDemon",
	3: "HardDemon",
	4: "InsaneDemon",
	5: "ExtremeDemon",
};
const demonDifficultyToNumber = {
	EasyDemon: 3,
	MediumDemon: 4,
	HardDemon: 2,
	InsaneDemon: 5,
	ExtremeDemon: 6,
};
const lengthToNumber = {
	Tiny: 0,
	Short: 1,
	Medium: 2,
	Long: 3,
	XL: 4,
	Platformer: 5,
};

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
						anyOf: [
							{ type: "number", minimum: 1 },
							{ type: "string", pattern: `|${levelNamePattern}` },
						],
					},
					type: { type: "number", enum: [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 15, 16, 17, 18, 21, 22, 27] }, // 27 - mod sent
					diff: { type: "array", items: { type: "string", pattern: "-|^(?:(?:-[1-3]|[1-5]),)*(?:-[1-3]|[1-5])$" } },
					len: { type: "string", pattern: "-|^(?:[0-5],)*(?:[0-5])$" },
					page: { type: "number", minimum: 0, default: 0 },
					total: { type: "number", minimum: 0, default: 0 },
					demonFilter: { type: "number", enum: [1, 2, 3, 4, 5] },
				},
				required: ["secret", "type"],
			},
		},
		handler: async (req, reply) => {
			console.log(req.body);
			const {
				type,
				str,
				page,
				total,
				diff: [diff],
				demonFilter,
				len,
			} = req.body;
			const totalCount = total;

			let users = [];
			const isId = str && typeof str === "number";
			const queryArgs = { where: {} };

			if (isId) queryArgs.where.id = str;
			else {
				queryArgs.orderBy = { likes: "desc" };
				queryArgs.skip = page * searchLevelsPageSize;
				queryArgs.take = searchLevelsPageSize;

				if (str) queryArgs.where.name = { contains: str, mode: "insensitive" };
				else queryArgs.where.difficulty = { not: "NA" };

				if (len !== "-") queryArgs.where.length = { in: _.uniq(len.split(",")).map((str) => Number(str)) };
				if (diff !== "-") {
					const fetchedDifficulties = [];
					for (const difficulty of _.uniq(diff.split(","))) {
						if (difficulty === "-2") {
							if (demonFilter) fetchedDifficulties.push(demonFilterToDemonDifficulty[demonFilter]);
							else fetchedDifficulties.push(...Object.values(demonFilterToDemonDifficulty));
						} else fetchedDifficulties.push(numberDifficultyToDifficulty[difficulty]);
					}

					queryArgs.where.difficulty = { in: fetchedDifficulties };
				}
			}

			switch (type) {
				case 0: // Search
				case 2: // Most liked
				case 15: // Most liked in GD Word
					break;
				case 1: // Downloads
					queryArgs.orderBy = { downloads: "desc" };
					break;
				case 3: // Trending
					if (!isId) queryArgs.where.createdAt = { gt: new Date(Date.now() - 7 * 24 * 60 * 60_000) };
					break;
				default:
					return reply.send("-1");
			}

			const levels = await database.levels.findMany(queryArgs);
			if (levels.length) {
				users = await database.users.findMany({
					where: { extId: { in: _.uniq(levels.map((level) => String(level.accountId))) } },
				});
			}

			return reply.send(
				`${levels
					.map((level) => {
						return [
							[1, level.id],
							[2, level.name],
							[3, toBase64(level.description ?? "")],
							[5, level.version],
							[6, level.accountId],
							[8, level.difficulty === "NA" ? 0 : 10],
							[9, levelDifficultyToNumber[level.difficulty]],
							[10, level.downloads],
							[12, level.officialSongId],
							[13, level.gameVersion],
							[14, level.likes - level.dislikes],
							[15, lengthToNumber[level.length]],
							[17, Object.values(demonFilterToDemonDifficulty).includes(level.difficulty) ? 1 : 0],
							[18, level.stars],
							[19, level.isFeatured ? 1 : 0],
							[25, level.isAuto === true ? 1 : 0],
							[30, level.originalLevelId],
							[31, level.isTwoPlayer ? 1 : 0],
							[35, level.officialSongId],
							[37, level.coins],
							[38, level.coins ? 1 : 0],
							[39, level.requestedStars],
							[42, level.isEpic ? 1 : 0],
							[43, demonDifficultyToNumber[level.difficulty] ?? 0],
							[44, 0], // is in gauntlet
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
					levels
						.map((level) => `${String(level.id)[0]}${String(level.id).at(-1)}${level.stars}${level.coins ? 1 : 0}`)
						.join(""),
				)}`,
			);
		},
	});
};
