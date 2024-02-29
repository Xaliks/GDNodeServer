const { PrismaClient } = require("@prisma/client");
const crypto = require("node:crypto");
const { getGJP2, fromBase64, cipher } = require("./security");
const { gjp2Pattern, safeBase64Pattern, udidPattern } = require("../config/config");

const gjp2Regex = new RegExp(gjp2Pattern);
const base64Regex = new RegExp(safeBase64Pattern);
const udidRegex = new RegExp(udidPattern);

const database = new PrismaClient();

class CacheManager {
	static cache = new Map();

	static get(key) {
		return this.cache.get(key) ?? null;
	}

	static getValue(key) {
		return this.get(key)?.value ?? null;
	}

	static set(key, value, ttl = 5 * 60_000) {
		let entry = this.cache.get(key);
		if (entry) clearTimeout(entry.timeout);

		entry = {
			value,
			ttl,
			timeout: setTimeout(() => this.delete(key), ttl),
		};
		this.cache.set(key, entry);

		return entry;
	}

	static delete(key) {
		const entry = this.cache.get(key);
		if (!entry) return false;

		clearTimeout(entry.timeout);

		return this.cache.delete(key);
	}
}

function getPassword(body) {
	if (body?.gjp2 && gjp2Regex.test(body.gjp2)) return body.gjp2;
	if (body?.password) return getGJP2(body.password);
	if (body?.gjp && base64Regex.test(body.gjp)) return getGJP2(cipher(fromBase64(body.gjp), 37526));

	return null;
}

async function checkPassword(body) {
	if (!body) return false;
	const accountId = Array.isArray(body.accountID) ? body.accountID[0] : body.accountID;
	if (!accountId) return false;

	const password = getPassword(body);
	if (!password) return false;

	const cachedEntry = CacheManager.getValue(`passwords:${accountId}`);
	if (cachedEntry) {
		return cachedEntry.password === crypto.createHash("md5").update(`${password}${cachedEntry.salt}`).digest("hex");
	}

	const account = await database.accounts.findFirst({ where: { id: accountId, password } });
	if (!account) return false;

	saveUserPasswordToCache(accountId, password);

	return true;
}

async function getUser(body) {
	let user = null;
	let account = null;

	const password = getPassword(body);
	const udid = body?.udid ? udidRegex.test(body.udid) && body.udid : null;

	if (password) {
		const accountId = Number(body.accountID);

		if (accountId) account = await database.accounts.findFirst({ where: { id: accountId, password } });
		else if (body.userName) {
			account = await database.accounts.findFirst({ where: { username: body.userName, password } });
		}

		if (!account) account = 0;
		else saveUserPasswordToCache(account.id, account.password);
	}

	if (account) {
		user = await database.users.findFirst({ where: { extId: String(account.id) } });

		if (!user) {
			user = await database.users.create({
				data: { extId: String(account.id), isRegistered: true, username: account.username },
			});
		} else if (!user.isRegistered || user.username !== account.username) {
			user = await database.users.update({
				where: { id: user.id },
				data: { isRegistered: true, username: account.username },
			});
		}
	} else if (udid) {
		user = await database.users.findFirst({ where: { extId: udid } });

		if (!user) user = await database.users.create({ data: { extId: udid } });
	}

	return { user, account };
}

function saveUserPasswordToCache(accountId, password) {
	const salt = crypto.randomBytes(16).toString("hex");
	CacheManager.set(`passwords:${accountId}`, {
		password: crypto.createHash("md5").update(`${password}${salt}`).digest("hex"),
		salt,
	});
}

module.exports = { getPassword, checkPassword, database, getUser, saveUserPasswordToCache };
