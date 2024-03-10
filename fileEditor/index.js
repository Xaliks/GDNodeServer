const { Transform } = require("node:stream");
const fs = require("node:fs");
const path = require("node:path");
const readline = require("node:readline");
const Logger = require("../scripts/Logger");

const filePath = path.join(__dirname, "GeometryDash.exe");
const boom33 = toHex("http://www.boomlings.com/database");
const boom34 = toHex("https://www.boomlings.com/database");
const baseBoom33 = toHex(btoa("http://www.boomlings.com/database"));

function logError(...args) {
	return console.log(Logger.colors.bgRed(" ERROR "), ...args);
}

if (!fs.existsSync(filePath)) {
	logError("GeometryDash.exe is not found");
	process.exit();
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(question, length, example) {
	return new Promise((resolve) => {
		rl.question(question, (answer) => {
			if (answer.trim().length !== length) {
				logError(
					`Server URL ${Logger.colors.red("must be")} ${Logger.colors.cyan(length)} characters long! Example: ${Logger.colors.gray(example)}\n`,
				);
				return resolve(ask(question, length, example));
			}

			try {
				const url = new URL(answer).toString();
				resolve(url);
			} catch {
				logError(`Server URL is ${Logger.colors.red("invalid")}! Example: ${Logger.colors.gray(example)}\n`);
				return resolve(ask(question, length, example));
			}
		});
	});
}

ask(`Your server URL [${Logger.colors.cyan(34)} chars long]: `, 34, "https://gdserv.xaliks.dev/geometry").then(
	async (_url34) => {
		const url34 = toHex(_url34);

		let url33 = await ask(
			`Your server URL [${Logger.colors.cyan(33)} chars long]: `,
			33,
			"http://gdserv.xaliks.dev/geometry",
		);
		const baseUrl33 = toHex(btoa(url33));
		url33 = toHex(url33);

		let buffer = "";
		fs.createReadStream(filePath)
			.pipe(
				new Transform({
					transform(chunk, encoding, callback) {
						buffer = `${buffer}${toHex(chunk)}`
							.replaceAll(boom34, url34)
							.replaceAll(boom33, url33)
							.replaceAll(baseBoom33, baseUrl33)
							.slice(buffer.length);

						callback();
						this.push(Buffer.from(buffer, "hex"));
					},
				}),
			)
			.pipe(fs.createWriteStream(path.join(__dirname, "GeometryDashNew.exe")))
			.on("finish", () => {
				console.log(Logger.colors.bgBrightGreen(" Success! "));
				process.exit();
			});
	},
);

function toHex(data) {
	return Buffer.from(data).toString("hex");
}
