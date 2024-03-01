const Logger = require("../../scripts/Logger");
const { database, checkPassword } = require("../../scripts/database");
const { fromSafeBase64 } = require("../../scripts/security");
const { Constants, byteLengthOf } = require("../../scripts/util");
const { secret, levelNamePattern, safeBase64Pattern, defaultLevel, maxLevelSize } = require("../../config/config");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/uploadGJLevel21.php",
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
					coins: { type: "number", enum: [0, 1, 2, 3] },
					requestedStars: { type: "number", enum: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
					unlisted: { type: "number", enum: Constants.levelVisibility.values() },
					wt: { type: "number", default: 0 }, // time spent in the editor (local copy) seconds
					wt2: { type: "number", default: 0 }, // time spent in the editor (previous copies) seconds
					ldm: { type: "number", enum: [0, 1] },
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
					"coins",
					"requestedStars",
					"unlisted",
					"ldm",
					"seed",
					"seed2",
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
					password: String(password).length === 7 ? Number(String(password).slice(1)) : password, // Needs to test in other versions
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

				const existingLevel = await database.levels.findFirst({ where: { accountId: accountID, name: levelName } });
				let level;
				if (existingLevel) {
					if (levelVersion === 1) return reply.send(existingLevel.id);

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
						`ID: ${Logger.color(Logger.colors.cyan)(level.id)}\n`,
						`Name: ${Logger.color(Logger.colors.cyan)(level.name)}\n`,
						`Account: ${Logger.color(Logger.colors.cyan)(accountID)}`,
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
						`ID: ${Logger.color(Logger.colors.cyan)(level.id)}\n`,
						`Name: ${Logger.color(Logger.colors.cyan)(level.name)}\n`,
						`Account: ${Logger.color(Logger.colors.cyan)(accountID)}`,
					);
				}

				return reply.send(level.id);
			} catch (error) {
				Logger.error("Create level", req.body, error);

				return reply.send("-1");
			}
		},
	});
};
