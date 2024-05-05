const zlib = require("node:zlib");
const { toBase64, getSolo, getSolo2, cipher, fromSafeBase64 } = require("../../scripts/security");
const { Constants, dateToRelative } = require("../../scripts/util");
const { checkPassword, database } = require("../../scripts/database");
const { secret, weeklyLevelIdInc } = require("../../config/config");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	// 1.8, 1.9, 2.0, 2.1-2.2
	["/downloadGJLevel.php", "/downloadGJLevel19.php", "/downloadGJLevel20.php", "/downloadGJLevel22.php"].forEach(
		(url, i, urls) =>
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
							levelID: { type: "number", minimum: -3 },
							inc: { type: "number", enum: [0, 1] },
							extras: { type: "number", enum: [0, 1] },
						},
						required: ["secret", "levelID"],
					},
				},
				handler: async (req, reply) => {
					const { extras, accountID, levelID, inc } = req.body;

					let level;
					let eventId = 0;
					// Daily level
					if (levelID === -1) {
						const eventLevel = await getEventLevel("Daily", true);
						if (!eventLevel?.level) return reply.send("-1");

						level = eventLevel.level;
						eventId = eventLevel.id;
					}
					// Weekly level
					else if (levelID === -2) {
						const eventLevel = await getEventLevel("Weekly", true);
						if (!eventLevel?.level) return reply.send("-1");

						level = eventLevel.level;
						eventId = eventLevel.id + weeklyLevelIdInc;
					}
					// Event
					else if (levelID === -3) {
						const eventLevel = await getEventLevel("Event", true);
						if (!eventLevel?.level) return reply.send("-1");

						level = eventLevel.level;
						eventId = eventLevel.id;
					} else level = await database.levels.findFirst({ where: { id: levelID } });

					if (!level || level.isDeleted) return reply.send("-1");

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
					const levelPasswordBeforeEncoding = level.password;

					// <=1.8
					if (i < urls.length - 3) {
						// Old level format
						if (levelData.data.startsWith("eJ")) {
							levelData.data = zlib.inflateSync(fromSafeBase64(levelData.data)).toString();
						} else if (levelData.data.startsWith("H4sI")) {
							levelData.data = zlib.gunzipSync(fromSafeBase64(levelData.data)).toString();
						}
					}
					// 2.0+
					if (i > urls.length - 3) {
						if (level.password !== 0) level.password = toBase64(cipher(level.password, 26364)).toString();
						level.description = toBase64(level.description ?? "");
					}

					const response = [
						[1, level.id],
						[2, level.name],
						[3, level.description],
						[4, levelData.data],
						[5, level.version],
						[6, user.id],
						[8, level.difficulty === "NA" ? 0 : 10],
						[9, Constants.returnLevelDifficulty[level.difficulty]],
						[10, level.downloads + inc],
						[12, level.officialSongId],
						[13, level.gameVersion],
						[14, level.likes],
						[15, Constants.levelLength[level.length]],
						[17, isDemon],
						[18, level.stars],
						[19, level.ratingType === "Featured" ? 1 : 0],
						[25, level.difficulty === "Auto" ? 1 : 0],
						[27, level.password],
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
						[42, Constants.levelRatingType[level.ratingType]],
						[43, isDemon ? Constants.returnDemonDifficulty[level.difficulty] : 0],
						[45, level.objectCount],
						[46, level.editorTime],
						[47, level.editorTimeCopies],
						[52, level.songIds.join(",")],
						[53, level.sfxIds.join(",")],
						[57, level.ts || ""],
					];

					if (eventId) response.push([41, eventId]);
					if (extras) response.push([26, level.levelInfo || ""]);

					const levelResponse = `${user.id},${level.stars},${isDemon},${level.id},${level.coins && level.stars ? 1 : 0},${level.ratingType === "Featured" ? 1 : 0},${levelPasswordBeforeEncoding},${eventId}`; // last - daily/weekly/event id

					reply.send(
						`${response.map(([key, value]) => `${key}:${value}`).join(":")}#${getSolo(levelData.data)}#${getSolo2(levelResponse)}#${user.id}:${user.username}:${level.accountId}`,
					);

					if (inc) await database.levels.update({ where: { id: level.id }, data: { downloads: { increment: 1 } } });
				},
			}),
	);

	fastify.route({
		method: ["POST"],
		url: "/getGJDailyLevel.php",
		schema: {
			consumes: ["x-www-form-urlencoded"],
			body: {
				type: "object",
				properties: {
					secret: { type: "string", const: secret },
					type: { type: "number", enum: [0, 1] },
				},
				required: ["secret", "type"],
			},
		},
		handler: async (req, reply) => {
			const { type } = req.body;

			const midnight = new Date();
			// next day 00:00:00
			if (type === Constants.eventLevelType.Daily) midnight.setHours(24, 0, 0, 0);
			// next monday
			if (type === Constants.eventLevelType.Weekly) {
				midnight.setDate(midnight.getDate() + ((1 + 7 - midnight.getDay()) % 7 || 7));
			}

			const eventLevel = await getEventLevel(Constants.eventLevelType[type]);
			if (!eventLevel) return reply.send("-1");

			if (type === Constants.eventLevelType.Weekly) eventLevel.id += weeklyLevelIdInc;

			return reply.send(`${eventLevel.id}|${Math.round((midnight - Date.now()) / 1_000)}`);
		},
	});
};

function getEventLevel(type, includeLevel = false) {
	return database.eventLevels.findFirst({
		include: { level: includeLevel },
		where: { type, timestamp: { lt: new Date() } },
		orderBy: { timestamp: "desc" },
	});
}
