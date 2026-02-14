const { ValidationError } = require("../errors/httpErrors");

const DEFAULT_PAGE = 1;
const DEFAULT_SIZE = 20;
const MAX_SIZE = 100;

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return parsed;
}

function normalizePagination(query = {}) {
  const pageNo = toPositiveInt(query.page_no, DEFAULT_PAGE);
  const pageSize = Math.min(toPositiveInt(query.page_size, DEFAULT_SIZE), MAX_SIZE);
  return { pageNo, pageSize };
}

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (typeof value === "boolean") {
    return value;
  }

  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "y", "yes"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "n", "no"].includes(normalized)) {
    return false;
  }

  return fallback;
}

function parseBigIntId(value, path) {
  const normalized = String(value || "").trim();
  if (!/^\d+$/.test(normalized)) {
    throw new ValidationError("Invalid request", [{ path, reason: "must be an integer id" }]);
  }
  return BigInt(normalized);
}

function currentUserId(req) {
  return parseBigIntId(req && req.auth && req.auth.userId, "X-Auth-User-Id");
}

function parseOrderBy(sortRaw, fieldMap, fallback) {
  if (!sortRaw || typeof sortRaw !== "string") {
    return [fallback];
  }

  const entries = sortRaw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [fieldRaw, directionRaw = "asc"] = part.split(":").map((token) => token.trim());
      const prismaField = fieldMap[fieldRaw.toLowerCase()];
      if (!prismaField) {
        return null;
      }
      const direction = directionRaw.toLowerCase() === "desc" ? "desc" : "asc";
      return { [prismaField]: direction };
    })
    .filter(Boolean);

  if (entries.length === 0) {
    return [fallback];
  }

  return entries;
}

function dateOnlyStartUtc(value, path) {
  const normalized = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new ValidationError("Invalid request", [{ path, reason: "must be YYYY-MM-DD" }]);
  }
  const asDate = new Date(`${normalized}T00:00:00.000Z`);
  if (Number.isNaN(asDate.getTime())) {
    throw new ValidationError("Invalid request", [{ path, reason: "must be a valid date" }]);
  }
  return asDate;
}

function dateOnlyEndUtc(value, path) {
  const start = dateOnlyStartUtc(value, path);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

function parseIsoDateTime(value, path) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new ValidationError("Invalid request", [{ path, reason: "must be a valid datetime" }]);
  }
  return parsed;
}

module.exports = {
  currentUserId,
  dateOnlyEndUtc,
  dateOnlyStartUtc,
  normalizePagination,
  parseBigIntId,
  parseBoolean,
  parseIsoDateTime,
  parseOrderBy,
};

