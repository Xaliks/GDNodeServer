const { secret } = require("../../config/config");
const { getCustomSong } = require("../../scripts/database");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/getGJSongInfo.php",
		schema: {
			consumes: ["x-www-form-urlencoded"],
			body: {
				type: "object",
				properties: {
					secret: { type: "string", const: secret },
					songID: { type: "number", minimum: 1 },
				},
				required: ["secret", "songID"],
			},
		},
		handler: async (req, reply) => {
			const { songID } = req.body;

			const song = await getCustomSong(songID, req.ip);
			if (!song) return reply.send("-1");

			return reply.send(
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
			);
		},
	});
};
