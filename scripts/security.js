const crypto = require("node:crypto");

function getGJP2(string) {
	return crypto.createHash("sha1").update(`${string}mI29fmAnxgTs`).digest("hex");
}

function getSolo(string) {
	if (string.length < 41) return getSolo2(string);

	const dividedLength = parseInt(string.length / 40);
	let hash = "";
	let i = 40;
	while (i) hash = string[--i * dividedLength] + hash;

	return getSolo2(hash);
}

function getSolo2(string) {
	return crypto.createHash("sha1").update(`${string}xI25fpAapCQg`).digest("hex");
}

function getSolo3(string) {
	return crypto.createHash("sha1").update(`${string}oC36fpYaPtdg`).digest("hex");
}

function getSolo4(string) {
	return crypto.createHash("sha1").update(`${string}pC26fpYaQCtg`).digest("hex");
}

function fromBase64(string) {
	return Buffer.from(String(string), "base64");
}
function toBase64(string) {
	return Buffer.from(String(string)).toString("base64");
}

function fromSafeBase64(string) {
	return fromBase64(String(string).replaceAll("-", "+").replaceAll("_", "/"));
}
function toSafeBase64(string) {
	return toBase64(string).replaceAll("+", "-").replaceAll("/", "_");
}

function textToAscii(string) {
	return String(string)
		.split("")
		.map((symbol) => symbol.charCodeAt());
}

function cipher(_data, _key) {
	const key = textToAscii(_key);
	const data = textToAscii(_data);

	let cipher = "";

	for (let i = 0; i < data.length; i++) {
		cipher += String.fromCodePoint(data[i] ^ key[i % key.length]);
	}
	return cipher;
}

function decodeSavedGameData(path) {
	return require("zlib")
		.gunzipSync(
			fromSafeBase64(
				Buffer.from(require("fs").readFileSync(path))
					.map((data) => data ^ 11)
					.toString(),
			),
		)
		.toString();
}

module.exports = {
	getGJP2,
	getSolo,
	getSolo2,
	getSolo3,
	getSolo4,
	fromBase64,
	toBase64,
	fromSafeBase64,
	toSafeBase64,
	cipher,

	decodeSavedGameData,
};
