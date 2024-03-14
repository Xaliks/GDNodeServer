const Logger = require("../../scripts/Logger");
const { database, checkPassword, getCustomSong } = require("../../scripts/database");
const { fromSafeBase64 } = require("../../scripts/security");
const { Constants, byteLengthOf } = require("../../scripts/util");
const { secret, levelNamePattern, safeBase64Pattern, defaultLevel, maxLevelSize } = require("../../config/config");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	// 1.9, 2.0, 2.1-2.2
	// No support for <2.0 cause the body doesn't contain the account password
	["/uploadGJLevel19.php", "/uploadGJLevel20.php", "/uploadGJLevel21.php"].forEach((url) =>
		fastify.route({
			method: ["POST"],
			url,
			schema: {
				consumes: ["x-www-form-urlencoded"],
				body: {
					type: "object",
					properties: {
						secret: { type: "string", const: secret },
						gameVersion: { type: "number" },
						accountID: { type: "number" },
						levelName: { type: "string", pattern: levelNamePattern },
						levelDesc: { type: "string", pattern: `|${safeBase64Pattern}`, default: "" },
						levelVersion: { type: "number", minimum: 1 },
						levelLength: { type: "number", enum: Constants.levelLength.values() },
						audioTrack: { type: "number", minimum: 0 }, // official song
						songID: { type: "number", minimum: 0 }, // newgrounds song id
						auto: { type: "number", enum: [0, 1], default: 0 },
						password: { type: "number", default: 0 }, // 0 - no copy (free copy in 2.2); 1 - free copy; 1****** - password;
						original: { type: "number", default: 0 },
						twoPlayer: { type: "number", enum: [0, 1] },
						objects: { type: "number", minimum: 1 },
						coins: { type: "number", enum: [0, 1, 2, 3], default: 0 },
						requestedStars: { type: "number", enum: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], default: 0 },
						unlisted: { type: "number", enum: Constants.levelVisibility.values(), default: 0 },
						wt: { type: "number", default: 0 }, // time spent in the editor (local copy) seconds
						wt2: { type: "number", default: 0 }, // time spent in the editor (previous copies) seconds
						ldm: { type: "number", enum: [0, 1], default: 0 },
						extraString: { type: "string" },
						seed: { type: "string", pattern: "^[0-9a-zA-Z]{10}$" },
						seed2: { type: "string", pattern: safeBase64Pattern },
						levelString: { type: "string", pattern: safeBase64Pattern },
						levelInfo: { type: "string", pattern: `|${safeBase64Pattern}` },
						ts: { type: "number" }, // idk
						// sfxIDs
						// songIDs
					},
					required: [
						"secret",
						"gameVersion",
						"accountID",
						"levelName",
						"levelVersion",
						"levelLength",
						"audioTrack",
						"songID",
						"auto",
						"original",
						"twoPlayer",
						"objects",
						"levelString",
					],
				},
			},
			handler: async (req, reply) => {
				const {
					gameVersion,
					accountID,
					levelName,
					levelDesc,
					levelVersion,
					levelString,
					levelLength,
					audioTrack,
					songID,
					objects,
					password,
					original,
					coins,
					requestedStars,
					unlisted,
					wt,
					wt2,
					ldm,
					twoPlayer,
					auto,
					extraString,
					levelInfo,
					ts,
				} = req.body;

				if (byteLengthOf(levelString) > maxLevelSize) return reply.send("-1");

				try {
					const levelDescription = fromSafeBase64(levelDesc).toString();
					if (levelDescription.length > 200) return reply.send("-1");

					if (!(await checkPassword(req.body))) return reply.send("-1");

					const data = {
						gameVersion,
						accountId: accountID,
						name: levelName,
						description: levelDescription || null,
						version: levelVersion,
						length: Constants.levelLength[levelLength],
						officialSongId: audioTrack,
						songId: songID,
						objectCount: objects,
						password: String(password).length === 7 ? Number(String(password).slice(1)) : password,
						originalLevelId: original,
						coins,
						requestedStars,
						visibility: Constants.levelVisibility[unlisted],
						editorTime: wt,
						editorTimeCopies: wt2,
						isLDM: ldm === 1,
						isTwoPlayer: twoPlayer === 1,
						isAuto: auto === 1,
						extraString,
						levelInfo,
						ts,
						downloads: Math.max(0, defaultLevel.downloads) || 0,
						likes: Math.max(0, defaultLevel.likes) || 0,
						updatedAt: new Date(),
					};

					const existingLevel = await database.levels.findFirst({
						where: { accountId: accountID, name: levelName, isDeleted: false },
					});
					let level;
					if (existingLevel) {
						[level] = await database.$transaction([
							database.levels.update({ where: { id: existingLevel.id }, data }),
							database.levelsData.upsert({
								where: { id: existingLevel.id },
								update: { data: levelString },
								create: { id: existingLevel.id, data: levelString },
							}),
						]);

						Logger.log(
							"Update level",
							`ID: ${Logger.colors.cyan(level.id)}\n`,
							`Name: ${Logger.colors.cyan(level.name)}\n`,
							`Account: ${Logger.colors.cyan(accountID)}`,
						);
					} else {
						level = await database.levels.create({ data });

						await database.levelsData.upsert({
							where: { id: level.id },
							update: { data: levelString },
							create: { id: level.id, data: levelString },
						});

						Logger.log(
							"Create level",
							`ID: ${Logger.colors.cyan(level.id)}\n`,
							`Name: ${Logger.colors.cyan(level.name)}\n`,
							`Account: ${Logger.colors.cyan(accountID)}`,
						);
					}

					reply.send(level.id);
					if (data.songId) await getCustomSong(data.songId);
				} catch (error) {
					Logger.error("Create level", req.body, error);

					return reply.send("-1");
				}
			},
		}),
	);
};
