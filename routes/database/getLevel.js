const { toBase64, getSolo, getSolo2 } = require("../../scripts/security");
const { Constants, dateToRelative } = require("../../scripts/util");
const { getUser, database } = require("../../scripts/database");
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
					levelID: { type: "number", minimum: -3 },
					rs: { type: "string", pattern: "^[A-Za-z0-9]{10}$" },
					chk: { type: "string", pattern: base64Pattern },
				},
				required: ["secret", "levelID"],
			},
		},
		handler: async (req, reply) => {
			const { levelID } = req.body;

			const level = await database.levels.findFirst({ where: { id: levelID } });
			if (!level) return reply.send("-1");

			if (level.visibility === "FriendsOnly") {
				const { account } = await getUser(req.body, false);
				if (!account) return reply.send("-1");

				if (level.accountId !== account.id) {
					const friend = await database.friends.findFirst({
						where: {
							OR: [
								{ accountId1: account.id, accountId2: level.accountId },
								{ accountId1: level.accountId, accountId2: account.id },
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

			const response = [
				[1, level.id],
				[2, level.name],
				[3, toBase64(level.description ?? "")],
				[4, levelData.data],
				[5, level.version],
				[6, user.extId],
				[8, level.difficulty === "NA" ? 0 : 10],
				[9, Constants.returnLevelDifficulty[level.difficulty]],
				[10, level.downloads],
				[12, level.officialSongId],
				[13, level.gameVersion],
				[14, level.likes - level.dislikes],
				[15, Constants.levelLength[level.length]],
				[17, Constants.selectDemonDifficulty.values().includes(level.difficulty) ? 1 : 0],
				[18, level.stars],
				[19, level.ratingType === "Featured" ? 1 : 0],
				[25, level.difficulty === "Auto" ? 1 : 0],
				[27, level.password], // XOR encrypted with a key of 26364. [TODO] Needs to test in 2.1
				[28, dateToRelative(level.createdAt)],
				[29, dateToRelative(level.updatedAt)],
				[30, level.originalLevelId],
				[31, level.isTwoPlayer ? 1 : 0],
				[35, level.officialSongId],
				[36, level.extraString],
				[37, level.coins],
				[38, level.coins ? 1 : 0],
				[39, level.requestedStars],
				[40, level.isLDM ? 1 : 0],
				[42, (level.ratingType && Constants.levelRatingType[level.ratingType]) || 0],
				[43, Constants.returnDemonDifficulty[level.difficulty] ?? 0],
				[45, level.objectCount],
				[46, level.editorTime],
				[47, level.editorTimeCopies],
			]
				.map(([key, value]) => `${key}:${value}`)
				.join(":");
			const levelResponse = `${user.extId},${level.stars},${Constants.returnDemonDifficulty[level.difficulty] ?? 0},${level.id},${level.coins ? 1 : 0},${level.ratingType === "Featured" ? 1 : 0},${level.password},0`; // last - daily/weekly/event id

			return reply.send(`${response}#${getSolo(levelData.data)}#${getSolo2(levelResponse)}#${levelResponse}`);
		},
	});
};
