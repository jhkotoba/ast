const { UnauthorizedError } = require("../errors/httpErrors");

function requireAuth(req, res, next) {
  const userId = req.header("X-Auth-User-Id");
  const provider = req.header("X-Auth-Provider") || null;
  const role = req.header("X-Auth-Role") || null;
  const session = req.header("X-Auth-Session") || null;

  if (!userId || String(userId).trim() === "") {
    return next(new UnauthorizedError("Missing X-Auth-User-Id"));
  }

  req.auth = {
    userId: String(userId),
    provider,
    role,
    session,
  };

  return next();
}

module.exports = {
  requireAuth,
};
