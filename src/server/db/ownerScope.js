function currentUserId(req) {
  const userId = req && req.auth && req.auth.userId;
  if (!userId) {
    throw new Error("currentUserId called without req.auth.userId");
  }
  return userId;
}

function ownedWhere(req, extraWhere = {}) {
  return {
    ...extraWhere,
    user_id: currentUserId(req),
  };
}

function ownedData(req, data = {}) {
  return {
    ...data,
    user_id: currentUserId(req),
  };
}

module.exports = {
  currentUserId,
  ownedData,
  ownedWhere,
};
