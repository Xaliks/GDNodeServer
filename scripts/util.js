const { timeMaxCounts } = require("../config/config");

function dateToRelative(_date, unitCount = timeMaxCounts) {
	let date = new Date(_date);
	let date2 = new Date();

	if (date.getTime() > date2.getTime()) [date, date2] = [date2, date];

	const totalMonths = Math.max(0, (date2.getFullYear() - date.getFullYear()) * 12 - date.getMonth() + date2.getMonth());
	const months = totalMonths % 12;
	const years = Math.floor(totalMonths / 12);

	const ms = date2.getTime() - date.setFullYear(date2.getFullYear(), months + 1);

	const days = Math.floor(ms / 1_000 / 60 / 60 / 24);
	const hours = Math.floor((ms / 1_000 / 60 / 60) % 24);
	const minutes = Math.floor((ms / 1_000 / 60) % 60);
	const seconds = Math.floor((ms / 1_000) % 60);

	const text = [];

	const time = (name, time) => `${time} ${name}${time > 1 ? "s" : ""}`;

	if (years) text.push(time("year", years));
	if (months) text.push(time("month", months));
	if (days) text.push(time("day", days));
	if (hours) text.push(time("hour", hours));
	if (minutes) text.push(time("minute", minutes));
	if (seconds) text.push(time("second", seconds));

	if (text.length === 0) return time("millisecond", ms);
	if (text.length === 1 || unitCount === 1) return text[0];

	return `${text.slice(0, Math.min(text.length, unitCount) - 1).join(", ")} and ${text.at(Math.min(text.length, unitCount) - 1)}`;
}

function reverseObject(obj) {
	const _obj = obj;
	const result = Object.entries(_obj).reduce((obj, [key, value]) => {
		obj[key] = value;
		obj[value] = key;
		return obj;
	}, {});

	return {
		...result,
		values: () => Object.values(_obj),
		entries: () => Object.entries(_obj),
		keys: () => Object.keys(_obj),
	};
}

module.exports = {
	dateToRelative,
	reverseObject,
	Constants: {
		levelLength: reverseObject({
			Tiny: 0,
			Short: 1,
			Medium: 2,
			Long: 3,
			XL: 4,
			Platformer: 5,
		}),
		levelVisibility: reverseObject({
			Listed: 0,
			FriendsOnly: 1,
			Unlisted: 2,
		}),
		returnLevelDifficulty: reverseObject({
			NA: 0,
			Easy: 10,
			Normal: 20,
			Hard: 30,
			Harder: 40,
			Insane: 50,
			EasyDemon: 50,
			MediumDemon: 50,
			HardDemon: 50,
			InsaneDemon: 50,
			ExtremeDemon: 50,
		}),
		selectLevelDifficulty: reverseObject({
			Auto: -3,
			NA: -1,
			Easy: 1,
			Normal: 2,
			Hard: 3,
			Harder: 4,
			Insane: 5,
		}),
		returnDemonDifficulty: reverseObject({
			EasyDemon: 3,
			MediumDemon: 4,
			HardDemon: 2,
			InsaneDemon: 5,
			ExtremeDemon: 6,
		}),
		selectDemonDifficulty: reverseObject({
			EasyDemon: 1,
			MediumDemon: 2,
			HardDemon: 3,
			InsaneDemon: 4,
			ExtremeDemon: 5,
		}),
	},
};
