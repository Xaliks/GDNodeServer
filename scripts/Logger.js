const categoryLength = 5;

class Logger {
	// https://github.com/Marak/colors.js/blob/master/lib/styles.js
	colors = {
		reset: this.color([0, 0]),

		bold: this.color([1, 22]),
		dim: this.color([2, 22]),
		italic: this.color([3, 23]),
		underline: this.color([4, 24]),
		inverse: this.color([7, 27]),
		hidden: this.color([8, 28]),
		strikethrough: this.color([9, 29]),

		black: this.color([30, 39]),
		red: this.color([31, 39]),
		green: this.color([32, 39]),
		yellow: this.color([33, 39]),
		blue: this.color([34, 39]),
		magenta: this.color([35, 39]),
		cyan: this.color([36, 39]),
		white: this.color([37, 39]),
		gray: this.color([90, 39]),
		grey: this.color([90, 39]),

		brightRed: this.color([91, 39]),
		brightGreen: this.color([92, 39]),
		brightYellow: this.color([93, 39]),
		brightBlue: this.color([94, 39]),
		brightMagenta: this.color([95, 39]),
		brightCyan: this.color([96, 39]),
		brightWhite: this.color([97, 39]),

		bgBlack: this.color([40, 49]),
		bgRed: this.color([41, 49]),
		bgGreen: this.color([42, 49]),
		bgYellow: this.color([43, 49]),
		bgBlue: this.color([44, 49]),
		bgMagenta: this.color([45, 49]),
		bgCyan: this.color([46, 49]),
		bgWhite: this.color([47, 49]),
		bgGray: this.color([100, 49]),
		bgGrey: this.color([100, 49]),

		bgBrightRed: this.color([101, 49]),
		bgBrightGreen: this.color([102, 49]),
		bgBrightYellow: this.color([103, 49]),
		bgBrightBlue: this.color([104, 49]),
		bgBrightMagenta: this.color([105, 49]),
		bgBrightCyan: this.color([106, 49]),
		bgBrightWhite: this.color([107, 49]),
	};

	get date() {
		const to2num = (num) => String(num).padStart(2, "0");

		const date = new Date();
		return `${to2num(date.getDate())}.${to2num(date.getMonth() + 1)} ${to2num(date.getHours())}:${to2num(date.getMinutes())}:${to2num(date.getSeconds())}`;
	}

	color(code) {
		function color(text) {
			return `\u001B[${Array.isArray(code[0]) ? code[0].join(";") : code[0]}m${text}\u001B[${Array.isArray(code[1]) ? code[1].join(";") : code[1]}m`;
		}
		color.code = code;

		return color;
	}

	_log(color, category, ...message) {
		return console.log(
			`${this.color([
				[this.colors.bgWhite.code[0], this.colors.brightWhite.code[0]],
				[this.colors.bgWhite.code[1], this.colors.brightWhite.code[1]],
			])(this.date)} ${(Array.isArray(category) ? category : [category])
				.map((category) =>
					color(
						category.length >= categoryLength
							? ` ${category} `
							: `${" ".repeat(Math.round((categoryLength - category.length) / 2))}${category}${" ".repeat(Math.round((categoryLength - category.length) / 2))}`,
					),
				)
				.join(" ")}`,
			...message,
		);
	}

	log(category, ...message) {
		return this._log(this.colors.bgCyan, category, ...message);
	}

	error(category, ...message) {
		return this._log(this.colors.bgRed, category, ...message);
	}

	success(category, ...message) {
		return this._log(this.colors.bgGreen, category, ...message);
	}

	warning(category, ...message) {
		return this._log(this.colors.bgYellow, category, ...message);
	}

	devLog(category, ...message) {
		if (process.env.BotLogs === "true") return this._log(this.colors.bgMagenta, category, ...message);
	}
}

module.exports = new Logger();
