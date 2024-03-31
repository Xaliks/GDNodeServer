/**
 * @param {import("fastify").FastifyInstance} fastify
 */
module.exports = (fastify) => {
	["/accountManagement.php", "/backupGJAccountNew.php", "/lostpassword.php", "/lostusername.php"].forEach((url) =>
		fastify.get(url, (req, reply) => reply.redirect("/dashboard/account")),
	);
};
