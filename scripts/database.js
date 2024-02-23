const { PrismaClient } = require("@prisma/client");

const database = new PrismaClient({ log: ["query"] });

async function getUser(body, returnUser = true, createUserData = {}) {
	let user = null;
	let account = null;

	const accountId = body?.accountID;
	const password = body?.gjp2;
	const udid = body?.udid;

	if (password) {
		if (accountId) {
			account = await database.accounts.findFirst({ where: { id: Number(accountId), password } });
		} else if (body.userName) {
			account = await database.accounts.findFirst({ where: { username: body.userName, password } });
		}

		if (!account) return { user, account: 0 };
	}

	if (returnUser) {
		if (account) {
			if (!("username" in createUserData)) createUserData.username = account.username;

			user = await database.users.findFirst({ where: { extId: String(account.id) } });

			if (!user?.isRegistered || user.username !== account.username) {
				user = await database.users.upsert({
					where: { extId: String(account.id) },
					update: { isRegistered: true, username: account.username },
					create: { extId: String(account.id), isRegistered: true, ...createUserData },
				});
			}
		} else if (udid) {
			user = await database.users.findFirst({ where: { extId: udid } });

			if (!user) user = await database.users.create({ data: { extId: udid, ...createUserData } });
		}
	}

	return { user, account };
}

module.exports = { database, getUser };
