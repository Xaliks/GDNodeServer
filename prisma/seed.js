const { PrismaClient } = require("@prisma/client");
const Logger = require("../scripts/Logger");
const prisma = new PrismaClient();

const quests = [
	{ name: "Orb finder", type: "Orbs", amount: 200, reward: 10 },
	{ name: "Star collector", type: "Stars", amount: 5, reward: 10 },
	{ name: "Coin master", type: "Coins", amount: 2, reward: 10 },

	{ name: "Orb finder", type: "Orbs", amount: 500, reward: 15 },
	{ name: "Star collector", type: "Stars", amount: 10, reward: 15 },
	{ name: "Coin master", type: "Coins", amount: 4, reward: 15 },

	{ name: "Orb finder", type: "Orbs", amount: 1000, reward: 20 },
	{ name: "Star collector", type: "Stars", amount: 15, reward: 20 },
	{ name: "Coin master", type: "Coins", amount: 6, reward: 20 },
];

const load = async () => {
	try {
		const { count: deletedQuestsCount } = await prisma.quests.deleteMany();
		console.log(`Deleted ${Logger.colors.cyan(deletedQuestsCount)} quests`);

		await prisma.$queryRaw`ALTER SEQUENCE "Quests_id_seq" RESTART WITH 1`;

		await prisma.quests.createMany({ data: quests });
		console.log(`Added ${Logger.colors.cyan(quests.length)} quests`);
	} catch (e) {
		console.error(e);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
};

load();
