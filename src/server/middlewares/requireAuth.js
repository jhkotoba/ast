const { UnauthorizedError } = require("../errors/httpErrors");

function requireAuth(req, res, next) {
  const userId = req.header("X-Auth-User-Id");
  const provider = req.header("X-Auth-Provider");
  const role = req.header("X-Auth-Role") || null;
  const session = req.header("X-Auth-Session") || null;

  if (!userId || String(userId).trim() === "") {
    return next(new UnauthorizedError("Missing X-Auth-User-Id"));
  }

  if (!provider || String(provider).trim() === "") {
    return next(new UnauthorizedError("Missing X-Auth-Provider"));
  }

  req.auth = {
    userId: String(userId),
    provider: String(provider),
    role,
    session,
  };

  return next();
}

module.exports = {
  requireAuth,
};
