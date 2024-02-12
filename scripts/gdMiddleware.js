const { secret } = require("../config/config");

module.exports = (req, res, next) => {
	if (req.body?.secret !== secret) return res.send("-1");

	return next();
};
