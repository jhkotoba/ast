const { ConflictError, ValidationError } = require("../errors/httpErrors");
const { currentUserId, normalizePagination, parseBigIntId, parseBoolean, parseOrderBy } = require("./queryUtils");

const SORT_FIELD_MAP = {
  tag_id: "id",
  tag_name: "tag_name",
  display_order: "display_order",
  is_active: "is_active",
  created_at: "created_at",
  updated_at: "updated_at",
};

function normalizeTagName(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

async function assertNoNormalizedDuplicate(prismaClient, userId, tagName, excludeId) {
  const normalizedTarget = normalizeTagName(tagName);
  const rows = await prismaClient.tag.findMany({
    where: {
      user_id: userId,
    },
    select: {
      id: true,
      tag_name: true,
      is_active: true,
    },
  });

  const duplicated = rows.find((row) => {
    if (excludeId && row.id === excludeId) {
      return false;
    }
    return normalizeTagName(row.tag_name) === normalizedTarget;
  });

  if (!duplicated) {
    return;
  }

  if (duplicated.is_active) {
    throw new ConflictError("Tag name already exists");
  }

  throw new ConflictError(
    "Deleted tag name exists. Rename archived row in DB first, then register the new tag name.",
  );
}

function toSafeLike(value) {
  const normalized = String(value || "").trim();
  return normalized.length > 0 ? normalized : null;
}

function createPrismaTagStore(prismaClient) {
  return {
    async list(req, query = {}) {
      const { pageNo, pageSize } = normalizePagination(query);
      const includeInactive = parseBoolean(query.include_inactive, false);
      const searchTagName = toSafeLike(query.tag_name);
      const where = {
        user_id: currentUserId(req),
      };

      if (!includeInactive) {
        where.is_active = true;
      }

      if (searchTagName) {
        where.tag_name = {
          contains: searchTagName,
        };
      }

      const [list, totalCount] = await Promise.all([
        prismaClient.tag.findMany({
          where,
          orderBy: parseOrderBy(query.sort, SORT_FIELD_MAP, { id: "desc" }),
          skip: (pageNo - 1) * pageSize,
          take: pageSize,
        }),
        prismaClient.tag.count({ where }),
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
      await assertNoNormalizedDuplicate(prismaClient, userId, payload.tag_name, null);
      return prismaClient.tag.create({
        data: {
          user_id: userId,
          tag_name: payload.tag_name,
          display_order: payload.display_order,
          is_active: true,
        },
      });
    },

    async findById(req, id) {
      return prismaClient.tag.findFirst({
        where: {
          id: parseBigIntId(id, "tag_id"),
          user_id: currentUserId(req),
        },
      });
    },

    async updateById(req, id, payload) {
      const tagId = parseBigIntId(id, "tag_id");
      const userId = currentUserId(req);
      const target = await prismaClient.tag.findFirst({
        where: {
          id: tagId,
          user_id: userId,
        },
      });

      if (!target) {
        return null;
      }

      if (!target.is_active) {
        throw new ValidationError("Invalid request", [
          { path: "tag_id", reason: "inactive tag cannot be updated" },
        ]);
      }

      if (Object.prototype.hasOwnProperty.call(payload, "tag_name")) {
        await assertNoNormalizedDuplicate(prismaClient, userId, payload.tag_name, tagId);
      }

      const updated = await prismaClient.tag.update({
        where: { id: tagId },
        data: {
          tag_name:
            payload.tag_name === undefined
              ? target.tag_name
              : payload.tag_name,
          display_order:
            payload.display_order === undefined
              ? target.display_order
              : payload.display_order,
        },
      });

      return updated;
    },

    async deleteById(req, id) {
      const deleted = await prismaClient.tag.updateMany({
        where: {
          id: parseBigIntId(id, "tag_id"),
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
  createPrismaTagStore,
  normalizeTagName,
};

