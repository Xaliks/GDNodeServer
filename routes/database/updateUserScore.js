const Logger = require("../../scripts/Logger");
const { secret, udidPattern, base64Pattern, usernameRegex } = require("../../config/config");
const { database, getUser } = require("../../scripts/database");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/updateGJUserScore22.php",
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
					seed: { type: "string", pattern: "^[0-9a-zA-Z]{10}$" },
					seed2: { type: "string", pattern: base64Pattern },
				},
				required: [
					"secret",
					"stars",
					"demons",
					"diamonds",
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
					"accSpider",
					"accExplosion",
					"seed",
					"seed2",
				],
			},
		},
		handler: async (req, reply) => {
			try {
				const { account, user } = await getUser(req.body);
				if (account === 0 || (!account && user.isRegistered)) return reply.send("-1");

				const userData = {
					username: account?.username || req.body.userName,
					stars: req.body.stars,
					demons: req.body.demons,
					coins: req.body.coins,
					userCoins: req.body.userCoins,
					special: req.body.special,
					diamonds: req.body.diamonds,
					displayIcon: req.body.icon,
					displayIconType: req.body.iconType,
					mainColor: req.body.color1,
					secondColor: req.body.color2,
					glow: Boolean(req.body.accGlow === 1),
					explosion: req.body.accExplosion,
					cube: req.body.accIcon,
					ship: req.body.accShip,
					ball: req.body.accBall,
					ufo: req.body.accBird,
					wave: req.body.accDart,
					robot: req.body.accRobot,
					spider: req.body.accSpider,
					isRegistered: Boolean(account),
				};

				// 2.2
				if (req.body.moons) userData.moons = req.body.moons;
				if (req.body.color3) userData.color3 = req.body.color3;
				if (req.body.accSwing) userData.swing = req.body.accSwing;
				if (req.body.jetpack) userData.jetpack = req.body.accJetpack;

				await database.users.update({ where: { id: user.id }, data: userData });

				Logger.log(
					"User update",
					`User ${Logger.color(Logger.colors.cyan)(userData.username)}/${Logger.color(Logger.colors.gray)(account?.id ?? 0)}/${Logger.color(Logger.colors.gray)(user.id)} updated.`,
				);

				return reply.send(user.id);
			} catch (error) {
				Logger.error("User update", req.body, error);

				return reply.send("-1");
			}
		},
	});
};
