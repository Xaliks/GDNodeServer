const _ = require("lodash");
const { database, getCustomSong } = require("../../scripts/database");
const { fetchBoomlings, Constants, relativeToDate } = require("../../scripts/util");
const { fromSafeBase64, cipher } = require("../../scripts/security");
const { levelReuploaderAccountId } = require("../../config/config");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.get("/reuploadLevel", (req, reply) => {
		return reply.type("text/html")
			.send(`<form action="${fastify.prefix}/reuploadLevel" method="post">Level ID: <input type="number" name="id"><br>
		<input type="submit" value="Reupload">
</form>`);
	});

	fastify.route({
		method: ["POST"],
		url: "/reuploadLevel",
		schema: {
			body: {
				type: "object",
				properties: {
					id: { type: "number", minimum: 1 },
				},
				required: ["id"],
			},
		},
		handler: async (req, reply) => {
			const levelId = req.body.id;
			if (!levelId) {
				return send(`<form action="${fastify.prefix}/reuploadLevel" method="post">Level ID: <input type="number" name="id"><br>
	<input type="submit" value="Reupload">
</form>`);
			}

			const existingLevel = await database.levels.findFirst({ where: { boomlingsId: levelId } });
			if (existingLevel) return send(`Level has been already reuploaded, ID: ${existingLevel.id}<br><hr><br>`);

			const levelRawBody = await fetchBoomlings("downloadGJLevel22", { levelID: req.body.id, inc: 0, ip: req.ip }).catch(
				() => null,
			);
			if (!levelRawBody) return send("<h2>An error has occurred while connecting to the server.</h2>");
			if (levelRawBody === "-1") return send("<h2>This level doesn't exist.</h2>");

			const body = _.chunk(levelRawBody.split("#")[0].split(":"), 2).reduce((obj, [key, value]) => {
				obj[key] = value;
				return obj;
			}, {});

			if (!body["4"]) return send("<h2>This level doesn't have data.</h2>");

			const data = {
				boomlingsId: levelId,
				name: body["2"],
				description: fromSafeBase64(body["3"]).toString(),
				version: parseInt(body["5"]),
				accountId: levelReuploaderAccountId,
				difficulty: body["25"] === 1 ? "Auto" : "NA",
				downloads: parseInt(body["10"]) || 0,
				likes: parseInt(body["14"]) || 0,
				officialSongId: parseInt(body["12"]) || 0,
				gameVersion: parseInt(body["13"]),
				length: Constants.levelLength[body["15"]],
				stars: parseInt(body["18"]),
				ratingType:
					(body["19"] === "1" ? "Featured" : body["42"] === "0" ? "None" : Constants.levelRatingType[body["42"]]) ||
					"None",
				password: body["27"].split("#")[0],
				createdAt: relativeToDate(body["28"]),
				updatedAt: relativeToDate(body["29"]),
				isTwoPlayer: body["31"] === "1",
				songId: parseInt(body["35"]) || 0,
				extraString: body["36"],
				coins: parseInt(body["37"]),
				requestedStars: parseInt(body["39"]),
				isLDM: body["40"] === "1",
				objectCount: parseInt(body["45"]),
				editorTime: parseInt(body["46"]) || 0,
				editorTimeCopies: parseInt(body["47"]) || 0,
				ts: parseInt(body["57"]) || 0,
				songIds: body["52"]?.split(",").map(Number).filter(Boolean) || [],
				sfxIds: body["53"]?.split(",").map(Number).filter(Boolean) || [],
			};
			if (body["17"] === "1") data.difficulty = Constants.returnDemonDifficulty[body["43"]];
			else if (body["8"] === "10") data.difficulty = Constants.returnLevelDifficulty[body["9"]];
			if (data.password !== "0") data.password = parseInt(cipher(fromSafeBase64(data.password), 26364));
			else data.password = 0;
			if (data.songId) {
				data.officialSongId = 0;
				await getCustomSong(data.songId, req.ip);
			}

			const level = await database.levels.create({ data });
			await database.levelsData.create({ data: { id: level.id, data: body["4"] } });

			return send(`Level reuploaded, ID: ${level.id}<br><hr><br>`);

			function send(text) {
				return reply.type("text/html").send(text);
			}
		},
	});
};
