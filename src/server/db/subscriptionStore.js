const { ValidationError } = require("../errors/httpErrors");
const {
  currentUserId,
  dateOnlyEndUtc,
  dateOnlyStartUtc,
  normalizePagination,
  parseBigIntId,
  parseBoolean,
  parseOrderBy,
} = require("./queryUtils");

const SORT_FIELD_MAP = {
  subscription_id: "id",
  subscription_name: "subscription_name",
  billing_period: "billing_period",
  billing_day: "billing_day",
  amount: "amount",
  currency_code: "currency_code",
  start_date: "start_date",
  end_date: "end_date",
  is_active: "is_active",
  created_at: "created_at",
  updated_at: "updated_at",
};

function parsePeriod(value) {
  const normalized = String(value || "")
    .trim()
    .toUpperCase();
  if (!normalized) {
    return null;
  }
  if (normalized !== "MONTHLY" && normalized !== "YEARLY") {
    throw new ValidationError("Invalid request", [{ path: "billing_period", reason: "must be MONTHLY or YEARLY" }]);
  }
  return normalized;
}

function parseLike(value) {
  const normalized = String(value || "").trim();
  return normalized.length > 0 ? normalized : null;
}

function createPrismaSubscriptionStore(prismaClient) {
  return {
    async list(req, query = {}) {
      const { pageNo, pageSize } = normalizePagination(query);
      const includeInactive = parseBoolean(query.include_inactive, false);
      const billingPeriod = parsePeriod(query.billing_period);
      const subscriptionName = parseLike(query.subscription_name);
      const where = {
        user_id: currentUserId(req),
      };

      if (!includeInactive) {
        where.is_active = true;
      }

      if (billingPeriod) {
        where.billing_period = billingPeriod;
      }

      if (subscriptionName) {
        where.subscription_name = { contains: subscriptionName };
      }

      if (query.start_date_from) {
        where.start_date = {
          ...(where.start_date || {}),
          gte: dateOnlyStartUtc(query.start_date_from, "start_date_from"),
        };
      }

      if (query.start_date_to) {
        where.start_date = {
          ...(where.start_date || {}),
          lte: dateOnlyEndUtc(query.start_date_to, "start_date_to"),
        };
      }

      const [list, totalCount] = await Promise.all([
        prismaClient.subscription.findMany({
          where,
          orderBy: parseOrderBy(query.sort, SORT_FIELD_MAP, { id: "desc" }),
          skip: (pageNo - 1) * pageSize,
          take: pageSize,
        }),
        prismaClient.subscription.count({ where }),
      ]);

      return {
        list,
        page_no: pageNo,
        page_size: pageSize,
        total_count: totalCount,
      };
    },

    async create(req, payload) {
      return prismaClient.subscription.create({
        data: {
          user_id: currentUserId(req),
          subscription_name: payload.subscription_name,
          billing_period: payload.billing_period,
          billing_day: payload.billing_day,
          amount: payload.amount,
          currency_code: payload.currency_code,
          start_date: payload.start_date,
          end_date: payload.end_date,
          memo: payload.memo,
          is_active: true,
        },
      });
    },

    async findById(req, id) {
      return prismaClient.subscription.findFirst({
        where: {
          id: parseBigIntId(id, "subscription_id"),
          user_id: currentUserId(req),
        },
      });
    },

    async updateById(req, id, payload) {
      const updated = await prismaClient.subscription.updateMany({
        where: {
          id: parseBigIntId(id, "subscription_id"),
          user_id: currentUserId(req),
          is_active: true,
        },
        data: payload,
      });

      if (updated.count === 0) {
        return null;
      }

      return prismaClient.subscription.findFirst({
        where: {
          id: parseBigIntId(id, "subscription_id"),
          user_id: currentUserId(req),
        },
      });
    },

    async deleteById(req, id) {
      const deleted = await prismaClient.subscription.updateMany({
        where: {
          id: parseBigIntId(id, "subscription_id"),
          user_id: currentUserId(req),
          is_active: true,
        },
        data: {
          is_active: false,
        },
      });

      return deleted.count > 0;
    },
  };
}

module.exports = {
  createPrismaSubscriptionStore,
};
