const _ = require("lodash");
const { database, checkPassword } = require("../../scripts/database");
const { toBase64, getSolo2 } = require("../../scripts/security");
const { secret, searchListsPageSize, listNamePattern, separatedNumbersPattern } = require("../../config/config");
const { Constants } = require("../../scripts/util");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	// 2.2
	["/getGJLevelLists.php"].forEach((url) =>
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
							anyOf: [{ type: "number" }, { type: "string", pattern: `|${listNamePattern}` }],
						},
						type: { type: "number", enum: [0, 1, 2, 3, 4, 5, 6, 7, 11, 12, 13, 27] },
						diff: { type: "array", items: { type: "string", pattern: "-|^(?:(?:-[1-3]|[1-5]),)*(?:-[1-3]|[1-5])$" } },
						demonFilter: { type: "number", enum: [1, 2, 3, 4, 5] },
						page: { type: "number", minimum: 0, default: 0 },
						total: { type: "number", minimum: 0, default: 0 },
						star: { type: "number", enum: [0, 1], default: 0 },
						followed: { type: "string", pattern: `|${separatedNumbersPattern}` },
					},
					required: ["secret", "str"],
				},
			},
			handler: async (req, reply) => {
				const { type, str, accountID, page, total, diff, demonFilter, star, followed } = req.body;

				let lists = [];
				let totalCount = total;

				const difficulties = Array.isArray(diff) ? diff[0] : null;
				const isId = str && typeof str === "number";
				const queryArgs = { where: { visibility: "Listed", isDeleted: false } };

				if (isId) queryArgs.where.id = str;
				else {
					queryArgs.orderBy = [{ ratedAt: "desc" }, { createdAt: "desc" }];
					queryArgs.skip = page * searchListsPageSize;
					queryArgs.take = searchListsPageSize;

					if (star === 1) queryArgs.where.reward = { gt: 0 };
					if (str) queryArgs.where.name = { contains: str, mode: "insensitive" };

					if (difficulties && difficulties !== "-") {
						const fetchedDifficulties = [];
						for (const difficulty of _.uniq(difficulties.split(","))) {
							if (difficulty === "-2") {
								if (demonFilter) fetchedDifficulties.push(Constants.selectDemonDifficulty[demonFilter]);
								else fetchedDifficulties.push(...Constants.selectDemonDifficulty.keys());
							} else fetchedDifficulties.push(Constants.selectLevelDifficulty[difficulty]);
						}

						queryArgs.where.difficulty = { in: fetchedDifficulties };
					}
				}

				switch (type) {
					case 0: // Search
						if (isId) {
							const list = await database.lists.findFirst({ where: { id: str } });
							if (!list || list.isDeleted) return reply.send(await returnReplyString());

							if (list.visibility === "FriendsOnly") {
								if (await checkPassword(req.body)) {
									if (accountID === list.accountId) lists = [list];
									else {
										const friend = await database.friends.findFirst({
											where: {
												OR: [
													{ accountId1: accountID, accountId2: list.accountId },
													{ accountId1: list.accountId, accountId2: accountID },
												],
											},
										});

										if (friend) lists = [list];
									}
								}
							} else lists = [list];
						} else {
							queryArgs.orderBy = { likes: "desc" };
							queryArgs.where.visibility = { not: "Unlisted" };

							lists = await database.lists.findMany(queryArgs);

							if (lists.some((list) => list.visibility === "FriendsOnly")) {
								if (!(await checkPassword(req.body))) lists = lists.filter((list) => list.visibility === "Listed");
								else if (lists.some((list) => list.accountId !== accountID)) {
									const friends = await database.friends.findMany({
										where: { OR: [{ accountId1: accountID }, { accountId2: accountID }] },
									});

									lists = lists.filter(
										(list) =>
											list.visibility === "Listed" ||
											friends.some((friend) => [accountID, friend.accountId1, friend.accountId2].includes(list.accountId)),
									);
								}
							}
						}
						break;
					case 1: // Downloads
						queryArgs.orderBy = { downloads: "desc" };
						break;
					case 2: // Most liked
					case 7: // Magic (There's no criteria yet)
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
					case 5: // Account's lists
						if (!isId || str < 1) return reply.send(await returnReplyString());

						delete queryArgs.where.id;
						queryArgs.where.accountId = str;
						break;
					case 6: // Top lists
						queryArgs.where.ratingType = "Featured";
						break;
					case 11: // Awarded
						queryArgs.where.reward = { gt: 0 };
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
					case 27: // Mod sent
					default:
						return reply.send(await returnReplyString());
				}

				if (!lists.length) lists = await database.lists.findMany(queryArgs);
				if (lists.length < searchListsPageSize) totalCount = page * searchListsPageSize + lists.length;
				else if (!totalCount) totalCount = await database.lists.count(queryArgs);

				return reply.send(await returnReplyString(lists, totalCount, page));
			},
		}),
	);
};

async function returnReplyString(lists = [], totalCount = 0, page = 0) {
	let users = [];
	if (lists.length) {
		users = await database.users.findMany({
			where: { extId: { in: _.uniq(lists.map((level) => String(level.accountId))) } },
		});
	}

	return `${lists
		.map((list) => {
			const user = users.find((user) => user.extId === String(list.accountId));

			return [
				[1, list.id],
				[2, list.name],
				[3, toBase64(list.description ?? "")],
				[5, list.version],
				[49, list.accountId],
				[50, user.username],
				[10, list.downloads],
				[7, Constants.returnListDifficulty[list.difficulty]],
				[14, list.likes],
				[19, list.ratingType === "None" ? "" : 1],
				[51, list.levels.join(",")],
				[55, list.reward],
				[56, list.levelsToReward],
				[28, Math.round(list.createdAt.getTime() / 1_000)],
				[29, Math.round(list.updatedAt.getTime() / 1_000)],
			]
				.map(([key, value]) => `${key}:${value}`)
				.join(":");
		})
		.join(
			"|",
		)}#${users.map((user) => `${user.id}:${user.username}:${user.extId}`).join("|")}#${totalCount}:${page * searchListsPageSize}:${searchListsPageSize}#${getSolo2("idk")}`;
}
