const { ValidationError } = require("../errors/httpErrors");

const DEFAULT_PAGE = 1;
const DEFAULT_SIZE = 20;
const MAX_SIZE = 100;

const SORT_FIELD_MAP = {
  account_id: "id",
  account_name: "name",
  account_type: "account_type",
  institution_name: "memo",
  account_no_masked: "account_no_masked",
  currency_code: "currency",
  current_balance: "balance",  
  display_order: "sort_order",
  is_active: "is_active",
  created_at: "created_at",
  updated_at: "updated_at",
};

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
      const prismaField = SORT_FIELD_MAP[fieldRaw.toLowerCase()];
      if (!prismaField) {
        return null;
      }

      const direction = directionRaw.toLowerCase() === "desc" ? "desc" : "asc";
      return { [prismaField]: direction };
    })
    .filter(Boolean);

  if (entries.length === 0) {
    return [{ id: "desc" }];
  }

  return entries;
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

function activeOwnedWhere(req, extraWhere = {}) {
  return {
    ...extraWhere,
    user_id: currentUserId(req),
    is_active: true,
  };
}

function createPrismaAccountStore(prismaClient) {
  return {
    async list(req, query) {
      const { pageNo, pageSize } = normalizePagination(query);
      const where = activeOwnedWhere(req);

      const [list, totalCount] = await Promise.all([
        prismaClient.account.findMany({
          where,
          orderBy: parseOrderBy(query && query.sort),
          skip: (pageNo - 1) * pageSize,
          take: pageSize,
        }),
        prismaClient.account.count({ where }),
      ]);

      return {
        list,
        page_no: pageNo,
        page_size: pageSize,
        total_count: totalCount,
      };
    },

    async create(req, payload) {
      return prismaClient.account.create({
        data: {
          user_id: currentUserId(req),
          name: payload.account_name,
          account_type: payload.account_type,
          memo: payload.institution_name,
          account_no_masked: payload.account_no_masked,
          currency: payload.currency_code,
          balance: payload.current_balance,
          sort_order: payload.display_order,
          is_active: payload.is_active,
        },
      });
    },

    async findById(req, id) {
      return prismaClient.account.findFirst({
        where: activeOwnedWhere(req, { id: parseBigIntId(id, "id") }),
      });
    },

    async updateById(req, id, payload) {
      const data = {};

      if (Object.prototype.hasOwnProperty.call(payload, "account_name")) {
        data.name = payload.account_name;
      }
      if (Object.prototype.hasOwnProperty.call(payload, "account_type")) {
        data.account_type = payload.account_type;
      }
      if (Object.prototype.hasOwnProperty.call(payload, "institution_name")) {
        data.memo = payload.institution_name;
      }
      if (Object.prototype.hasOwnProperty.call(payload, "account_no_masked")) {
        data.account_no_masked = payload.account_no_masked;
      }
      if (Object.prototype.hasOwnProperty.call(payload, "currency_code")) {
        data.currency = payload.currency_code;
      }
      if (Object.prototype.hasOwnProperty.call(payload, "current_balance")) {
        data.balance = payload.current_balance;
      }
      if (Object.prototype.hasOwnProperty.call(payload, "display_order")) {
        data.sort_order = payload.display_order;
      }
      if (Object.prototype.hasOwnProperty.call(payload, "is_active")) {
        data.is_active = payload.is_active;
      }

      const updated = await prismaClient.account.updateMany({
        where: activeOwnedWhere(req, { id: parseBigIntId(id, "id") }),
        data,
      });

      if (updated.count === 0) {
        return null;
      }

      return prismaClient.account.findFirst({
        where: activeOwnedWhere(req, { id: parseBigIntId(id, "id") }),
      });
    },

    async deleteById(req, id) {
      const deleted = await prismaClient.account.updateMany({
        where: activeOwnedWhere(req, { id: parseBigIntId(id, "id") }),
        data: { is_active: false },
      });

      return deleted.count > 0;
    },
  };
}

module.exports = {
  createPrismaAccountStore,
};
