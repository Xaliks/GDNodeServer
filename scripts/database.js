// eslint-disable-next-line no-unused-vars
const { PrismaClient, Prisma } = require("@prisma/client");

const database = new PrismaClient();

/**
 * @param {Prisma.UsersWhereInput} where
 * @param {Prisma.UsersUpdateInput} update
 * @param {Prisma.UsersCreateInput} create
 * @returns {Promise<Prisma.UsersGetPayload>}
 */
async function upsertUser(where, update, create) {
	let user;

	if (Object.keys(update).length || Object.keys(create).length) {
		let count = 0;
		if (Object.keys(update).length) {
			count = await database.users.updateMany({ where, data: update }).then((result) => result.count);
		} else user = await database.users.findFirst({ where });

		if (!count && !user && Object.keys(create).length) {
			user = await database.users.create({ data: create });
		}
	}

	if (!user) user = await database.users.findFirst({ where });

	return user;
}

async function getUser(extId, username) {
	if (!username) {
		let user = await database.users.findFirst({ where: { extId: String(extId) } });
		if (!user) user = await database.users.create({ data: { extId: String(extId) } });

		return user;
	}

	return upsertUser({ extId: String(extId) }, { username }, { extId: String(extId), username });
}

module.exports = {
	database,
	upsertUser,
	getUser,
};
