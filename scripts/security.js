const crypto = require("node:crypto");

function getGJP2(string) {
	return crypto.createHash("sha1").update(`${string}mI29fmAnxgTs`).digest("hex");
}

function getSolo3(string) {
	return crypto.createHash("sha1").update(`${string}oC36fpYaPtdg`).digest("hex");
}

function getSolo4(string) {
	return crypto.createHash("sha1").update(`${string}pC26fpYaQCtg`).digest("hex");
}

function fromBase64(string) {
	return Buffer.from(string, "base64"); // Don't use btoa
}
function toBase64(string) {
	return Buffer.from(string).toString("base64"); // Don't use atob
}

function fromSafeBase64(string) {
	return fromBase64(string.replaceAll("-", "+").replaceAll("_", "/"));
}
function toSafeBase64(string) {
	return toBase64(string).replaceAll("+", "-").replaceAll("/", "_");
}

class XOR {
	static text2ascii(input) {
		return String(input)
			.split("")
			.map((letter) => letter.charCodeAt());
	}
	static cipher(data, key) {
		key = this.text2ascii(key);
		data = this.text2ascii(data);
		let cipher = "";

		for (let i = 0; i < data.length; i++) {
			cipher += String.fromCodePoint(data[i] ^ key[i % key.length]);
		}
		return cipher;
	}
	static encrypt(password, key = 37526) {
		let encode = this.cipher(password, key);
		encode = Buffer.from(encode).toString("base64");
		encode = encode.replace(/\//g, "_").replace(/\+/g, "-");

		return encode;
	}
	static decrypt(gjp, key = 37526) {
		let decode = gjp.replace(/_/g, "/").replace(/-/g, "+");
		decode = Buffer.from(decode, "base64").toString();
		decode = this.cipher(decode, key);

		return decode;
	}
}

module.exports = {
	getGJP2,
	getSolo3,
	getSolo4,
	fromBase64,
	toBase64,
	fromSafeBase64,
	toSafeBase64,
	XOR,
};
