const Logger = require("../../scripts/Logger");
const { secretMiddleware, requiredBodyMiddleware } = require("../../scripts/middlewares");
const { database, getUser } = require("../../scripts/database");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/updateGJUserScore22.php",
		beforeHandler: [
			secretMiddleware,
			requiredBodyMiddleware([
				"accountID",
				"gjp2",
				"stars",
				"demons",
				"diamonds",
				"icon",
				"iconType",
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
				"seed2",
			]),
		],
		handler: async (req, reply) => {
			const { userName } = req.body;

			try {
				const { account, user } = await getUser(req.body);
				if (account === 0 || (!account && user.isRegistered)) return reply.send("-1");

				const userData = {
					username: account?.username || userName,
					stars: parseInt(req.body.stars),
					moons: parseInt(req.body.moons),
					demons: parseInt(req.body.demons),
					coins: parseInt(req.body.coins),
					userCoins: parseInt(req.body.userCoins),
					special: parseInt(req.body.special),
					diamonds: parseInt(req.body.diamonds),
					displayIcon: parseInt(req.body.icon),
					displayIconType: parseInt(req.body.iconType),
					mainColor: parseInt(req.body.color1),
					secondColor: parseInt(req.body.color2),
					glowColor: parseInt(req.body.color3),
					glow: Boolean(req.body.accGlow),
					explosion: parseInt(req.body.accExplosion),
					cube: parseInt(req.body.accIcon),
					ship: parseInt(req.body.accShip),
					ball: parseInt(req.body.accBall),
					ufo: parseInt(req.body.accBird),
					wave: parseInt(req.body.accDart),
					robot: parseInt(req.body.accRobot),
					spider: parseInt(req.body.accSpider),
					swing: parseInt(req.body.accSwing),
					jetpack: parseInt(req.body.accJetpack),
					isRegistered: Boolean(account),
				};

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
