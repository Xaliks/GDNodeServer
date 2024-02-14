const { secretMiddleware, requiredBodyMiddleware } = require("../../scripts/middlewares");
const { database, getUser } = require("../../scripts/database");
const { toSafeBase64 } = require("../../scripts/security");
const { userCommentsPageSize } = require("../../config/config");

/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	fastify.route({
		method: ["POST"],
		url: "/getGJAccountComments20.php",
		beforeHandler: [secretMiddleware, requiredBodyMiddleware(["accountID", "page"])],
		handler: async (req, reply) => {
			const { accountID, page } = req.body;

			const comments = await database.accountComments.findMany({ where: { accountId: parseInt(accountID) } });
			if (!comments.length) return reply.send("#0:0:0");

			const user = await getUser(comments[0].accountId);

			reply.send(
				`${comments
					.map((comment) => {
						return [
							[2, toSafeBase64(comment.content)],
							[3, user.id],
							[4, comment.likes],
							[5, 0], // dislikes
							[6, comment.id],
							[7, comment.isSpam ? 1 : 0],
							[8, accountID],
							[9, timeToText(Date.now() - comment.createdAt.getTime())],
						]
							.map(([key, value]) => `${key}~${value}`)
							.join("~");
					})
					.join("|")}#${comments.length}:${page}:${userCommentsPageSize}`,
			);
		},
	});
};

function timeToText(ms) {
	const seconds = Math.floor((ms / 1000) % 60);
	const minutes = Math.floor((ms / 1000 / 60) % 60);
	const hours = Math.floor((ms / 1000 / 60 / 60) % 24);
	const days = Math.floor((ms / 1000 / 60 / 60 / 24) % 365);
	const years = Math.floor((ms / 1000 / 60 / 60 / 24 / 365) % 100);

	const text = [];

	const time = (name, time) => `${time} ${name}${time > 1 ? "s" : ""}`;

	if (years > 0) text.push(time("year", years));
	if (days > 0) text.push(time("day", days));
	if (hours > 0) text.push(time("hour", hours));
	if (minutes > 0) text.push(time("minute", minutes));
	if (seconds > 0) text.push(time("second", seconds));

	if (text.length === 0) return time("millisecond", ms);
	if (text.length === 1) return text[0];
	if (text.length === 2) return `${text[0]} and ${text[1]}`;

	return `${text[0]}, ${text[1]} and ${text[2]}`;
}
