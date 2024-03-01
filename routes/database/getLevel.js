const { toBase64, getSolo, getSolo2, cipher } = require("../../scripts/security");
const { Constants, dateToRelative } = require("../../scripts/util");
const { checkPassword, database } = require("../../scripts/database");
const { secret, base64Pattern } = require("../../config/config");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/downloadGJLevel22.php",
		schema: {
			consumes: ["x-www-form-urlencoded"],
			body: {
				type: "object",
				properties: {
					secret: { type: "string", const: secret },
					accountID: { type: "number" },
					levelID: { type: "number", minimum: -3 },
					rs: { type: "string", pattern: "^[A-Za-z0-9]{10}$" },
					chk: { type: "string", pattern: base64Pattern },
					inc: { type: "number", enum: [0, 1] },
					extras: { type: "number", enum: [0, 1] },
				},
				required: ["secret", "levelID"],
			},
		},
		handler: async (req, reply) => {
			const { extras, accountID, levelID, inc } = req.body;

			const level = await database.levels.findFirst({ where: { id: levelID } });
			if (!level) return reply.send("-1");

			if (level.visibility === "FriendsOnly") {
				if (!(await checkPassword(req.body))) return reply.send("-1");

				if (level.accountId !== accountID) {
					const friend = await database.friends.findFirst({
						where: {
							OR: [
								{ accountId1: accountID, accountId2: level.accountId },
								{ accountId1: level.accountId, accountId2: accountID },
							],
						},
					});
					if (!friend) return reply.send("-1");
				}
			}

			const [user, levelData] = await database.$transaction([
				database.users.findFirst({ where: { extId: String(level.accountId) } }),
				database.levelsData.findFirst({ where: { id: level.id } }),
			]);
			if (!user || !levelData) return reply.send("-1");

			const isDemon = Constants.selectDemonDifficulty.keys().includes(level.difficulty) ? 1 : 0;

			const response = [
				[1, level.id],
				[2, level.name],
				[3, toBase64(level.description ?? "")],
				[4, levelData.data],
				[5, level.version],
				[6, user.id],
				[8, level.difficulty === "NA" ? 0 : 10],
				[9, Constants.returnLevelDifficulty[level.difficulty]],
				[10, level.downloads],
				[12, level.officialSongId],
				[13, level.gameVersion],
				[14, level.likes],
				[15, Constants.levelLength[level.length]],
				[16, 0],
				[17, isDemon],
				[18, level.stars],
				[19, level.ratingType === "Featured" ? 1 : 0],
				[25, level.difficulty === "Auto" ? 1 : 0],
				[27, level.password !== 0 ? toBase64(cipher(level.password, 26364)).toString() : "0"],
				[28, dateToRelative(level.createdAt)],
				[29, dateToRelative(level.updatedAt)],
				[30, level.originalLevelId],
				[31, level.isTwoPlayer ? 1 : 0],
				[35, level.songId],
				[36, level.extraString || ""],
				[37, level.coins],
				[38, level.coins && level.stars ? 1 : 0],
				[39, level.requestedStars],
				[40, level.isLDM ? 1 : 0],
				[41, 0],
				[42, Constants.levelRatingType[level.ratingType]],
				[43, isDemon ? Constants.returnDemonDifficulty[level.difficulty] : 0],
				[44, 0],
				[45, level.objectCount],
				[46, level.editorTime],
				[47, level.editorTimeCopies],
				[57, level.ts || ""],
			];

			if (extras) response.push([26, level.levelInfo || ""]);

			const levelResponse = `${user.id},${level.stars},${isDemon},${level.id},${level.coins && level.stars ? 1 : 0},${level.ratingType === "Featured" ? 1 : 0},${level.password},0`; // last - daily/weekly/event id

			reply.send(
				`${response.map(([key, value]) => `${key}:${value}`).join(":")}#${getSolo(levelData.data)}#${getSolo2(levelResponse)}#${levelResponse}`,
			);

			if (inc) await database.levels.update({ where: { id: level.id }, data: { downloads: { increment: 1 } } });
		},
	});
};
