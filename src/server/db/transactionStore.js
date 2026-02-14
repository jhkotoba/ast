const { ValidationError } = require("../errors/httpErrors");
const {
  currentUserId,
  dateOnlyEndUtc,
  dateOnlyStartUtc,
  normalizePagination,
  parseBigIntId,
  parseBoolean,
  parseIsoDateTime,
  parseOrderBy,
} = require("./queryUtils");

const SORT_FIELD_MAP = {
  transaction_id: "id",
  flow_type: "flow_type",
  transaction_date: "transaction_date",
  amount: "amount",
  currency_code: "currency_code",
  title: "title",
  created_at: "created_at",
  updated_at: "updated_at",
};

function parseDateOrDateTimeStart(value, path) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value || "").trim())) {
    return dateOnlyStartUtc(value, path);
  }
  return parseIsoDateTime(value, path);
}

function parseDateOrDateTimeEnd(value, path) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value || "").trim())) {
    return dateOnlyEndUtc(value, path);
  }
  return parseIsoDateTime(value, path);
}

async function validateActiveTagsOwned(prismaClient, userId, tagIds) {
  if (!Array.isArray(tagIds) || tagIds.length === 0) {
    return [];
  }

  const parsed = tagIds.map((item, idx) => parseBigIntId(item, `tag_ids[${idx}]`));
  const unique = [...new Set(parsed.map((id) => id.toString()))].map((id) => BigInt(id));

  if (unique.length !== parsed.length) {
    throw new ValidationError("Invalid request", [{ path: "tag_ids", reason: "must not contain duplicates" }]);
  }

  const rows = await prismaClient.tag.findMany({
    where: {
      id: { in: unique },
      user_id: userId,
      is_active: true,
    },
    select: {
      id: true,
    },
  });

  if (rows.length !== unique.length) {
    throw new ValidationError("Invalid request", [
      { path: "tag_ids", reason: "all tags must be active and owned by user" },
    ]);
  }

  return unique;
}

function createPrismaTransactionStore(prismaClient) {
  return {
    async list(req, query = {}) {
      const { pageNo, pageSize } = normalizePagination(query);
      const includeInactive = parseBoolean(query.include_inactive, false);
      const where = {
        user_id: currentUserId(req),
      };

      if (!includeInactive) {
        where.is_active = true;
      }

      if (query.flow_type) {
        where.flow_type = String(query.flow_type).trim().toUpperCase();
      }

      if (query.transaction_date_from || query.transaction_date_to) {
        where.transaction_date = {};
        if (query.transaction_date_from) {
          where.transaction_date.gte = dateOnlyStartUtc(query.transaction_date_from, "transaction_date_from");
        }
        if (query.transaction_date_to) {
          where.transaction_date.lte = dateOnlyEndUtc(query.transaction_date_to, "transaction_date_to");
        }
      }

      if (query.created_at_from || query.created_at_to) {
        where.created_at = {};
        if (query.created_at_from) {
          where.created_at.gte = parseDateOrDateTimeStart(query.created_at_from, "created_at_from");
        }
        if (query.created_at_to) {
          where.created_at.lte = parseDateOrDateTimeEnd(query.created_at_to, "created_at_to");
        }
      }

      if (query.tag_id !== undefined && query.tag_id !== null && String(query.tag_id).trim() !== "") {
        where.tags = {
          some: {
            tag_id: parseBigIntId(query.tag_id, "tag_id"),
            user_id: currentUserId(req),
          },
        };
      }

      const [list, totalCount] = await Promise.all([
        prismaClient.ledgerTransaction.findMany({
          where,
          include: {
            tags: {
              include: {
                tag: true,
              },
            },
          },
          orderBy: parseOrderBy(query.sort, SORT_FIELD_MAP, { id: "desc" }),
          skip: (pageNo - 1) * pageSize,
          take: pageSize,
        }),
        prismaClient.ledgerTransaction.count({ where }),
      ]);

      return {
        list,
        page_no: pageNo,
        page_size: pageSize,
        total_count: totalCount,
      };
    },

    async create(req, payload) {
      const userId = currentUserId(req);
      let resolvedTitle = payload.title === undefined ? null : payload.title;
      let resolvedMemo = payload.memo === undefined ? null : payload.memo;
      let resolvedTagIds = payload.tag_ids || [];

      if (payload.template_id !== undefined) {
        const templateId = parseBigIntId(payload.template_id, "template_id");
        const template = await prismaClient.transactionTemplate.findFirst({
          where: {
            id: templateId,
            user_id: userId,
            is_active: true,
          },
        });

        if (!template) {
          throw new ValidationError("Invalid request", [
            { path: "template_id", reason: "must reference an active template owned by user" },
          ]);
        }

        const templateMappings = await prismaClient.transactionTemplateTag.findMany({
          where: {
            user_id: userId,
            template_id: templateId,
          },
          include: {
            tag: true,
          },
        });

        const inactiveTemplateTag = templateMappings.find((item) => !item.tag || !item.tag.is_active);
        if (inactiveTemplateTag) {
          throw new ValidationError("Invalid request", [
            { path: "template_id", reason: "contains inactive mapped tags" },
          ]);
        }

        resolvedTitle = payload.title_provided ? payload.title : template.default_title;
        resolvedMemo = payload.memo_provided ? payload.memo : template.default_memo;
        resolvedTagIds = payload.tag_ids_provided
          ? payload.tag_ids
          : templateMappings.map((item) => item.tag_id.toString());
      }

      const tagIds = await validateActiveTagsOwned(prismaClient, userId, resolvedTagIds);
      const created = await prismaClient.$transaction(async (tx) => {
        const row = await tx.ledgerTransaction.create({
          data: {
            user_id: userId,
            flow_type: payload.flow_type,
            transaction_date: payload.transaction_date,
            amount: payload.amount,
            currency_code: payload.currency_code,
            title: resolvedTitle,
            memo: resolvedMemo,
            is_active: true,
          },
        });

        if (tagIds.length > 0) {
          await tx.ledgerTransactionTag.createMany({
            data: tagIds.map((tagId) => ({
              user_id: userId,
              transaction_id: row.id,
              tag_id: tagId,
            })),
          });
        }

        return row;
      });

      return prismaClient.ledgerTransaction.findFirst({
        where: {
          id: created.id,
          user_id: userId,
        },
        include: {
          tags: {
            include: { tag: true },
          },
        },
      });
    },

    async findById(req, transactionIdRaw) {
      return prismaClient.ledgerTransaction.findFirst({
        where: {
          id: parseBigIntId(transactionIdRaw, "transaction_id"),
          user_id: currentUserId(req),
        },
        include: {
          tags: {
            include: { tag: true },
          },
        },
      });
    },

    async updateById(req, transactionIdRaw, payload) {
      const transactionId = parseBigIntId(transactionIdRaw, "transaction_id");
      const userId = currentUserId(req);
      const target = await prismaClient.ledgerTransaction.findFirst({
        where: {
          id: transactionId,
          user_id: userId,
        },
      });

      if (!target) {
        return null;
      }

      if (!target.is_active) {
        throw new ValidationError("Invalid request", [
          { path: "transaction_id", reason: "inactive transaction cannot be updated" },
        ]);
      }

      const data = {};
      if (payload.flow_type !== undefined) data.flow_type = payload.flow_type;
      if (payload.transaction_date !== undefined) data.transaction_date = payload.transaction_date;
      if (payload.amount !== undefined) data.amount = payload.amount;
      if (payload.currency_code !== undefined) data.currency_code = payload.currency_code;
      if (payload.title !== undefined) data.title = payload.title;
      if (payload.memo !== undefined) data.memo = payload.memo;

      const hasScalarChanges = Object.keys(data).length > 0;
      const hasTagChanges = payload.tag_ids_provided === true;

      if (!hasScalarChanges && !hasTagChanges) {
        throw new ValidationError("Invalid request", [{ path: "body", reason: "at least one field is required" }]);
      }

      const tagIds = hasTagChanges ? await validateActiveTagsOwned(prismaClient, userId, payload.tag_ids) : [];

      await prismaClient.$transaction(async (tx) => {
        if (hasScalarChanges) {
          await tx.ledgerTransaction.update({
            where: { id: transactionId },
            data,
          });
        }

        if (hasTagChanges) {
          await tx.ledgerTransactionTag.deleteMany({
            where: {
              user_id: userId,
              transaction_id: transactionId,
            },
          });

          if (tagIds.length > 0) {
            await tx.ledgerTransactionTag.createMany({
              data: tagIds.map((tagId) => ({
                user_id: userId,
                transaction_id: transactionId,
                tag_id: tagId,
              })),
            });
          }
        }
      });

      return prismaClient.ledgerTransaction.findFirst({
        where: {
          id: transactionId,
          user_id: userId,
        },
        include: {
          tags: {
            include: { tag: true },
          },
        },
      });
    },

    async deleteById(req, transactionIdRaw) {
      const deleted = await prismaClient.ledgerTransaction.updateMany({
        where: {
          id: parseBigIntId(transactionIdRaw, "transaction_id"),
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
  createPrismaTransactionStore,
};

