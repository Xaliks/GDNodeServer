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

module.exports = {
	dateToRelative,
};
