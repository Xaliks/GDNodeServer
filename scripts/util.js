const { timeMaxCounts } = require("../config/config");

function dateToRelative(_date, unitCount = timeMaxCounts) {
	const date = new Date(_date);
	const now = new Date();

	const totalMonths = Math.max(0, (now.getFullYear() - date.getFullYear()) * 12 - date.getMonth() + now.getMonth());
	const months = totalMonths % 12;
	const years = Math.floor(totalMonths / 12);

	const ms = now.getTime() - date.setFullYear(now.getFullYear(), months + 1);

	const days = Math.floor(ms / 1_000 / 60 / 60 / 24);
	const hours = Math.floor((ms / 1_000 / 60 / 60) % 24);
	const minutes = Math.floor((ms / 1_000 / 60) % 60);
	const seconds = Math.floor((ms / 1_000) % 60);

	const text = [];

	const time = (name, time) => `${time} ${name}${time > 1 ? "s" : ""}`;

	if (years > 0) text.push(time("year", years));
	if (months > 0) text.push(time("month", months));
	if (days > 0) text.push(time("day", days));
	if (hours > 0) text.push(time("hour", hours));
	if (minutes > 0) text.push(time("minute", minutes));
	if (seconds > 0) text.push(time("second", seconds));

	if (text.length === 0) return time("millisecond", ms);
	if (text.length === 1 || unitCount === 1) return text[0];

	return `${text.slice(0, Math.min(text.length, unitCount) - 1).join(", ")} and ${text.at(Math.min(text.length, unitCount) - 1)}`;
}

module.exports = {
	dateToRelative,
};
