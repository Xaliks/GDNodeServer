const _ = require("lodash");
const { PrismaClient } = require("@prisma/client");
const crypto = require("node:crypto");
const { getGJP2, fromBase64, cipher } = require("./security");
const { gjp2Pattern, safeBase64Pattern, udidPattern } = require("../config/config");
const { fetchBoomlings } = require("./util");

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

	static set(key, value, ttl) {
		let entry = this.cache.get(key);
		if (entry?.timeout) clearTimeout(entry.timeout);

		entry = {
			value,
			ttl: ttl || null,
			timeout: ttl ? setTimeout(() => this.delete(key), ttl) : null,
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
	if (body?.gjp && base64Regex.test(body.gjp)) return getGJP2(cipher(fromBase64(body.gjp), 37526));
	if (body?.password) return getGJP2(body.password);

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

		if (accountId) account = await database.accounts.findFirst({ where: { id: accountId, password, isActive: true } });
		else if (body.userName) {
			account = await database.accounts.findFirst({ where: { username: body.userName, password, isActive: true } });
		}

		if (account) saveUserPasswordToCache(account.id, account.password);
		else account = 0;
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
	CacheManager.set(
		`passwords:${accountId}`,
		{
			password: crypto.createHash("md5").update(`${password}${salt}`).digest("hex"),
			salt,
		},
		5 * 60_000,
	);
}

async function getCustomSong(songId, ip) {
	const song = await database.songs.findFirst({ where: { id: songId } });
	if (song) return song;

	const boomlings = await fetchBoomlings("getGJSongInfo", { songID: songId, inc: 0, ip }).catch(() => null);
	if (boomlings?.startsWith("1~|~")) {
		const data = boomlings.split("~|~");
		const result = {};
		for (let i = 0; i < data.length; i += 2) result[data[i]] = data[i + 1];

		return database.songs.create({
			data: {
				id: songId,
				name: result[2],
				artistId: parseInt(result[3]),
				artistName: result[4],
				size: parseInt(result[5]) * 1024 * 1024,
				url: result[10],
			},
		});
	}

	const newgrounds = await fetch(`https://www.newgrounds.com/audio/listen/${songId}`);
	if (!newgrounds.ok) return null;

	const body = await newgrounds.text();
	const dataInEmbed = body.match(/new embedController\((?<data>.+)\);/)?.groups.data;
	if (!dataInEmbed) return null;

	const url = dataInEmbed.match(/"filename":"([^"]+)"/)?.[1]?.replaceAll("\\/", "/");
	const name = dataInEmbed.match(/"name":"([^"]+)"/)?.[1];
	const filesize = dataInEmbed.match(/"filesize":(\d+)/)?.[1];
	const artistId = dataInEmbed.match(/"project_id":(\d+)/)?.[1];
	const artistName = dataInEmbed.match(/"artist":"([^"]+)"/)?.[1];
	if (![url, name, filesize, artistId, artistId].some(Boolean)) return null;

	return database.songs.create({
		data: {
			id: songId,
			name: decodeURIComponent(name),
			artistId: parseInt(artistId),
			artistName: decodeURIComponent(artistName),
			size: parseInt(filesize),
			url,
		},
	});
}

async function initCacheMaxValues() {
	const levels = await database.$queryRaw`
		select
			length,
			coalesce(sum(stars), 0) as stars,
			coalesce(sum(coins) filter (where stars > 0), 0) as coins,
			count(*) filter (where difficulty = 'EasyDemon') as "easyDemons",
			count(*) filter (where difficulty = 'MediumDemon') as "mediumDemons",
			count(*) filter (where difficulty = 'HardDemon') as "hardDemons",
			count(*) filter (where difficulty = 'InsaneDemon') as "insaneDemons",
			count(*) filter (where difficulty = 'ExtremeDemon') as "extremeDemons",
			count(*) filter (where type = 'Weekly' and difficulty in ('EasyDemon', 'MediumDemon', 'HardDemon', 'InsaneDemon', 'ExtremeDemon')) as "weeklyDemons",
			count(*) filter (where type = 'Gauntlet' and difficulty in ('EasyDemon', 'MediumDemon', 'HardDemon', 'InsaneDemon', 'ExtremeDemon')) as "gauntletDemons"
		from (
			select id, length, stars, coins, difficulty, 'Level' as type
			from "Levels"
			
			union all
			
			select l.id, l.length, l.stars, l.coins, l.difficulty, case when e.type = 'Weekly' then 'Weekly' else 'Level' end as type
			from "Levels" l
			join "EventLevels" e on l.id = e."levelId"
			
			union all
			
			select l.id, l.length, l.stars, l.coins, l.difficulty, 'Gauntlet' type
			from "Levels" l
			join "Gauntlets" g on l.id in (g."levelId1", g."levelId2", g."levelId3", g."levelId4", g."levelId5")
		)
		group by length`;

	const result = {
		coins: 164,
		userCoins: levels.reduce((c, { coins }) => c + Number(coins), 0),
		stars: 212,
		moons: 25,
		demons:
			3 +
			levels.reduce(
				(d, { easyDemons, mediumDemons, hardDemons, insaneDemons, extremeDemons }) =>
					d + Number(easyDemons + mediumDemons + hardDemons + insaneDemons + extremeDemons),
				0,
			),
		weeklyDemons: levels.reduce((count, { weeklyDemons }) => count + Number(weeklyDemons), 0),
		gauntletDemons: levels.reduce((count, { gauntletDemons }) => count + Number(gauntletDemons), 0),
		userDemons: 0,
		platformer: {
			easyDemons: 0,
			mediumDemons: 0,
			hardDemons: 0,
			insaneDemons: 0,
			extremeDemons: 0,
		},
		easyDemons: 0,
		mediumDemons: 0,
		hardDemons: 0,
		insaneDemons: 0,
		extremeDemons: 0,
	};
	const [[platformerLevels], otherLevels] = _.partition(levels, ({ length }) => length === "Platformer");
	if (platformerLevels) {
		result.moons += Number(platformerLevels.stars);
		result.platformer.easyDemons += Number(platformerLevels.easyDemons);
		result.platformer.mediumDemons += Number(platformerLevels.mediumDemons);
		result.platformer.hardDemons += Number(platformerLevels.hardDemons);
		result.platformer.insaneDemons += Number(platformerLevels.insaneDemons);
		result.platformer.extremeDemons += Number(platformerLevels.extremeDemons);
	}
	if (otherLevels.length) {
		result.stars += otherLevels.reduce((s, { stars }) => s + Number(stars), 0);
		result.easyDemons += otherLevels.reduce((demons, { easyDemons }) => demons + Number(easyDemons), 0);
		result.mediumDemons += otherLevels.reduce((demons, { mediumDemons }) => demons + Number(mediumDemons), 0);
		result.hardDemons += otherLevels.reduce((demons, { hardDemons }) => demons + Number(hardDemons), 0);
		result.insaneDemons += otherLevels.reduce((demons, { insaneDemons }) => demons + Number(insaneDemons), 0);
		result.extremeDemons += otherLevels.reduce((demons, { extremeDemons }) => demons + Number(extremeDemons), 0);
		result.userDemons +=
			result.easyDemons + result.mediumDemons + result.hardDemons + result.insaneDemons + result.extremeDemons;
	}

	CacheManager.set("maxValues", result);
}

initCacheMaxValues();
setInterval(initCacheMaxValues, 15 * 60_000);

module.exports = { CacheManager, getPassword, checkPassword, database, getUser, saveUserPasswordToCache, getCustomSong };
