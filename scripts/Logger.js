const categoryLength = 5;

class Logger {
	// https://github.com/Marak/colors.js/blob/master/lib/styles.js
	colors = {
		reset: [0, 0],

		bold: [1, 22],
		dim: [2, 22],
		italic: [3, 23],
		underline: [4, 24],
		inverse: [7, 27],
		hidden: [8, 28],
		strikethrough: [9, 29],

		black: [30, 39],
		red: [31, 39],
		green: [32, 39],
		yellow: [33, 39],
		blue: [34, 39],
		magenta: [35, 39],
		cyan: [36, 39],
		white: [37, 39],
		gray: [90, 39],
		grey: [90, 39],

		brightRed: [91, 39],
		brightGreen: [92, 39],
		brightYellow: [93, 39],
		brightBlue: [94, 39],
		brightMagenta: [95, 39],
		brightCyan: [96, 39],
		brightWhite: [97, 39],

		bgBlack: [40, 49],
		bgRed: [41, 49],
		bgGreen: [42, 49],
		bgYellow: [43, 49],
		bgBlue: [44, 49],
		bgMagenta: [45, 49],
		bgCyan: [46, 49],
		bgWhite: [47, 49],
		bgGray: [100, 49],
		bgGrey: [100, 49],

		bgBrightRed: [101, 49],
		bgBrightGreen: [102, 49],
		bgBrightYellow: [103, 49],
		bgBrightBlue: [104, 49],
		bgBrightMagenta: [105, 49],
		bgBrightCyan: [106, 49],
		bgBrightWhite: [107, 49],
	};

	get date() {
		const to2num = (num) => String(num).padStart(2, "0");

		const date = new Date();
		return `${to2num(date.getDate())}.${to2num(date.getMonth() + 1)} ${to2num(date.getHours())}:${to2num(date.getMinutes())}:${to2num(date.getSeconds())}`;
	}

	color(code) {
		return (text) =>
			`\u001B[${Array.isArray(code[0]) ? code[0].join(";") : code[0]}m${text}\u001B[${Array.isArray(code[1]) ? code[1].join(";") : code[1]}m`;
	}

	_log(color, category, ...message) {
		return console.log(
			`${this.color([
				[this.colors.bgWhite[0], this.colors.brightWhite[0]],
				[this.colors.bgWhite[1], this.colors.brightWhite[1]],
			])(this.date)} ${(Array.isArray(category) ? category : [category])
				.map((category) =>
					this.color(color)(
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
