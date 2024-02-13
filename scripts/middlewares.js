const { secret } = require("../config/config");

function secretMiddleware(req, reply, next) {
	if (req.body?.secret !== secret) return reply.send("-1");

	return next();
}

function requiredBodyMiddleware(req, reply, next) {
	return (params) => {
		if (params.some((param) => !(param in req.body))) return reply.send("-1");

		return next();
	};
}

module.exports = {
	secretMiddleware,
	requiredBodyMiddleware,
};
