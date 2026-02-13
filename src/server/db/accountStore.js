const { ownedData, ownedWhere } = require("./ownerScope");

const DEFAULT_PAGE = 1;
const DEFAULT_SIZE = 20;
const MAX_SIZE = 100;

const ALLOWED_SORT_FIELDS = new Set([
  "id",
  "name",
  "balance",
  "currency",
  "sort_order",
  "created_at",
  "updated_at",
]);

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return parsed;
}

function normalizePagination(query = {}) {
  const page = toPositiveInt(query.page, DEFAULT_PAGE);
  const pageSize = Math.min(toPositiveInt(query.page_size, DEFAULT_SIZE), MAX_SIZE);
  return { page, pageSize };
}

function parseOrderBy(sortRaw) {
  if (!sortRaw || typeof sortRaw !== "string") {
    return [{ id: "desc" }];
  }

  const entries = sortRaw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [fieldRaw, directionRaw = "asc"] = part.split(":").map((token) => token.trim());
      const field = fieldRaw;
      const direction = directionRaw.toLowerCase() === "desc" ? "desc" : "asc";

      if (!ALLOWED_SORT_FIELDS.has(field)) {
        return null;
      }

      return { [field]: direction };
    })
    .filter(Boolean);

  if (entries.length === 0) {
    return [{ id: "desc" }];
  }

  return entries;
}

function createPrismaAccountStore(prismaClient) {
  return {
    async list(req, query) {
      const { page, pageSize } = normalizePagination(query);
      const where = ownedWhere(req);

      const [list, totalCount] = await Promise.all([
        prismaClient.account.findMany({
          where,
          orderBy: parseOrderBy(query && query.sort),
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prismaClient.account.count({ where }),
      ]);

      return {
        list,
        page,
        page_size: pageSize,
        total_count: totalCount,
      };
    },

    async create(req, payload) {
      return prismaClient.account.create({
        data: ownedData(req, payload),
      });
    },

    async findById(req, id) {
      return prismaClient.account.findFirst({
        where: ownedWhere(req, { id }),
      });
    },

    async updateById(req, id, payload) {
      const updated = await prismaClient.account.updateMany({
        where: ownedWhere(req, { id }),
        data: payload,
      });

      if (updated.count === 0) {
        return null;
      }

      return prismaClient.account.findFirst({
        where: ownedWhere(req, { id }),
      });
    },

    async deleteById(req, id) {
      const deleted = await prismaClient.account.deleteMany({
        where: ownedWhere(req, { id }),
      });

      return deleted.count > 0;
    },
  };
}

module.exports = {
  createPrismaAccountStore,
};
