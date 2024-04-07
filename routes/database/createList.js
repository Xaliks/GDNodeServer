const Logger = require("../../scripts/Logger");
const { database, checkPassword } = require("../../scripts/database");
const { fromSafeBase64 } = require("../../scripts/security");
const { Constants, separatedNumbersToArray } = require("../../scripts/util");
const {
	secret,
	listNamePattern,
	safeBase64Pattern,
	defaultList,
	separatedNumbersPattern,
	maxListDescriptionLength,
	maxListLevelsCount,
} = require("../../config/config");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	// 2.2
	["/uploadGJLevelList.php"].forEach((url) =>
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
						listName: { type: "string", pattern: listNamePattern },
						listDesc: { type: "string", pattern: `|${safeBase64Pattern}`, default: "" },
						listLevels: { type: "string", pattern: separatedNumbersPattern },
						difficulty: { type: "number", enum: [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] }, // -1 NA 0 Auto
						original: { type: "number", default: 0 },
						unlisted: { type: "number", enum: Constants.levelVisibility.values(), default: 0 },
						seed: { type: "string", pattern: safeBase64Pattern },
						seed2: { type: "string", pattern: "^[0-9a-zA-Z]{5}$" },
					},
					required: ["secret", "accountID", "listName", "listLevels", "difficulty", "seed", "seed2"],
				},
			},
			handler: async (req, reply) => {
				const { accountID, listName, listDesc, listLevels, difficulty, original, unlisted } = req.body;

				try {
					const listDescription = fromSafeBase64(listDesc).toString();
					if (listDescription.length > maxListDescriptionLength) return reply.send("-1");

					const levelIds = separatedNumbersToArray(listLevels);
					if (!levelIds.length || levelIds.length > maxListLevelsCount) return reply.send("-1");

					if (!(await checkPassword(req.body))) return reply.send("-1");

					const levels = await database.levels.findMany({ where: { id: { in: levelIds } } });
					if (!levels.length) return reply.send("-6"); // idk if this code is correct

					const data = {
						accountId: accountID,
						name: listName.trim(),
						description: listDescription || null,
						version: 1,
						originalListId: original,
						visibility: Constants.levelVisibility[unlisted],
						difficulty: Constants.returnListDifficulty[difficulty],
						levels: levels.map((level) => level.id),
						downloads: Math.max(0, defaultList.downloads) || 0,
						likes: Math.max(0, defaultList.likes) || 0,
						updatedAt: new Date(),
					};

					const existingList = await database.lists.findFirst({
						where: { accountId: accountID, name: listName, isDeleted: false },
					});
					let list;
					if (existingList) {
						data.version = existingList.version + 1;
						list = await database.lists.update({ where: { id: existingList.id }, data });

						Logger.log(
							"Update list",
							`ID: ${Logger.colors.cyan(list.id)}\n`,
							`Name: ${Logger.colors.cyan(list.name)}\n`,
							`Account: ${Logger.colors.cyan(accountID)}`,
						);
					} else {
						list = await database.lists.create({ data });

						Logger.log(
							"Create list",
							`ID: ${Logger.colors.cyan(list.id)}\n`,
							`Name: ${Logger.colors.cyan(list.name)}\n`,
							`Account: ${Logger.colors.cyan(accountID)}`,
						);
					}

					reply.send(list.id);
				} catch (error) {
					Logger.error("Create list", req.body, error);

					return reply.send("-1");
				}
			},
		}),
	);
};
