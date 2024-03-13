const _ = require("lodash");
const Logger = require("../../scripts/Logger");
const { secret, udidPattern, base64Pattern, usernameRegex, separatedNumbersPattern } = require("../../config/config");
const { database, getUser, CacheManager } = require("../../scripts/database");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	// 2.0, 2.1-2.2
	["/updateGJUserScore20.php", "/updateGJUserScore22.php"].forEach((url) =>
		fastify.route({
			method: ["POST"],
			url,
			schema: {
				consumes: ["x-www-form-urlencoded"],
				body: {
					type: "object",
					properties: {
						secret: { type: "string", const: secret },
						udid: { type: "string", pattern: udidPattern },
						accountID: { type: "number" },
						userName: { type: "string", pattern: usernameRegex.source },
						stars: { type: "number", minimum: 0 },
						moons: { type: "number", minimum: 0 },
						demons: { type: "number", minimum: 0 },
						diamonds: { type: "number", minimum: 0 },
						icon: { type: "number", minimum: 1 },
						iconType: { type: "number", enum: [0, 1, 2, 3, 4, 5, 6, 7] },
						color1: { type: "number", minimum: 0 },
						color2: { type: "number", minimum: 0 },
						color3: { type: "number", minimum: -1 },
						coins: { type: "number", minimum: 0 },
						userCoins: { type: "number", minimum: 0 },
						special: { type: "number" },
						accIcon: { type: "number", minimum: 1 },
						accShip: { type: "number", minimum: 1 },
						accBall: { type: "number", minimum: 1 },
						accBird: { type: "number", minimum: 1 },
						accDart: { type: "number", minimum: 1 },
						accRobot: { type: "number", minimum: 1 },
						accGlow: { type: "number", enum: [0, 1] },
						accSpider: { type: "number", minimum: 1 },
						accExplosion: { type: "number", minimum: 1 },
						accSwing: { type: "number", minimum: 1 },
						accJetpack: { type: "number", minimum: 1 },
						dinfo: { type: "string", pattern: separatedNumbersPattern }, // other demons
						dinfow: { type: "string", pattern: separatedNumbersPattern }, // weekly demons
						dinfog: { type: "string", pattern: separatedNumbersPattern }, // gauntlet demons
						seed: { type: "string", pattern: "^[0-9a-zA-Z]{10}$" },
						seed2: { type: "string", pattern: base64Pattern },
					},
					required: [
						"secret",
						"stars",
						"demons",
						"icon",
						"iconType",
						"color1",
						"color2",
						"coins",
						"userCoins",
						"accIcon",
						"accShip",
						"accBall",
						"accBird",
						"accDart",
						"accRobot",
						"accGlow",
					],
				},
			},
			handler: async (req, reply) => {
				try {
					const { account, user } = await getUser(req.body);
					if (account === 0 || !user || (!account && user.isRegistered)) return reply.send("-1");

					const maxValues = CacheManager.getValue("maxValues");
					if (checkIfInvalid(req.body, maxValues)) {
						Logger.log(
							"User update",
							`User ${Logger.colors.cyan(userData.username)}/${Logger.colors.gray(account?.id ?? 0)}/${Logger.colors.gray(user.id)} tried to update invalid data!`,
							req.body,
						);

						return reply.send("-1");
					}

					const userData = {
						username: account?.username || req.body.userName,
						stars: req.body.stars,
						demons: req.body.demons,
						coins: req.body.coins,
						userCoins: req.body.userCoins,
						special: req.body.special,
						displayIcon: req.body.icon,
						displayIconType: req.body.iconType,
						mainColor: req.body.color1,
						secondColor: req.body.color2,
						glow: req.body.accGlow === 1,
						cube: req.body.accIcon,
						ship: req.body.accShip,
						ball: req.body.accBall,
						ufo: req.body.accBird,
						wave: req.body.accDart,
						robot: req.body.accRobot,
						isRegistered: Boolean(account),
					};

					// 2.1
					if (req.body.diamonds) userData.diamonds = req.body.diamonds;
					if (req.body.accSpider) userData.spider = req.body.accSpider;
					if (req.body.accExplosion) userData.explosion = req.body.accExplosion;

					// 2.2
					if (req.body.moons) userData.moons = req.body.moons;
					if (req.body.color3) userData.glowColor = req.body.color3;
					if (req.body.accSwing) userData.swing = req.body.accSwing;
					if (req.body.jetpack) userData.jetpack = req.body.accJetpack;
					if (req.body.dinfo) {
						const demonsIds = _.uniq(
							req.body.dinfo
								.split(",")
								.map((id) => parseInt(id))
								.filter(Boolean),
						);
						if (demonsIds.length > maxValues.userDemons) return reply.send("-1");

						if (demonsIds.length) {
							const levels = await database.levels.findMany({ where: { id: { in: demonsIds } } });

							userData.demonsInfo = `${[
								["EasyDemon", "MediumDemon", "HardDemon", "InsaneDemon", "ExtremeDemon"],
								["EasyDemon", "MediumDemon", "HardDemon", "InsaneDemon", "ExtremeDemon"],
							]
								.map((difficulties, i) =>
									difficulties
										.map(
											(difficulty) =>
												levels.filter(
													(level) =>
														level.difficulty === difficulty &&
														(i ? level.length === "Platformer" : level.length !== "Platformer"),
												).length,
										)
										.join(","),
								)
								.join(",")},0,0`; // [TODO]: weekly & gauntlets
						}
					}

					await database.users.update({ where: { id: user.id }, data: userData });

					Logger.log(
						"User update",
						`User ${Logger.colors.cyan(userData.username)}/${Logger.colors.gray(account?.id ?? 0)}/${Logger.colors.gray(user.id)} updated.`,
					);

					return reply.send(user.id);
				} catch (error) {
					Logger.error("User update", req.body, error);

					return reply.send("-1");
				}
			},
		}),
	);
};

function checkIfInvalid(body, maxValues) {
	return (
		body.stars > maxValues.stars ||
		body.moons > maxValues.moons ||
		body.demons > maxValues.demons ||
		body.coins > maxValues.coins ||
		body.userCoins > maxValues.userCoins ||
		(!body.moons && !body.stars && body.userCoins)
	);
}
