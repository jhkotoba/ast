const { ConflictError, ValidationError } = require("../errors/httpErrors");
const { currentUserId, normalizePagination, parseBigIntId, parseBoolean, parseOrderBy } = require("./queryUtils");

const SORT_FIELD_MAP = {
  template_id: "id",
  template_name: "template_name",
  default_title: "default_title",
  default_memo: "default_memo",
  is_active: "is_active",
  created_at: "created_at",
  updated_at: "updated_at",
};

function isPrismaUniqueError(error) {
  return error && error.code === "P2002";
}

function parseStringLike(value) {
  const normalized = String(value || "").trim();
  return normalized.length > 0 ? normalized : null;
}

async function findTemplateOwned(prismaClient, userId, templateId) {
  return prismaClient.transactionTemplate.findFirst({
    where: {
      id: templateId,
      user_id: userId,
    },
  });
}

async function assertTemplateForMapping(prismaClient, userId, templateId) {
  const target = await findTemplateOwned(prismaClient, userId, templateId);
  if (!target) {
    return null;
  }

  if (!target.is_active) {
    throw new ValidationError("Invalid request", [
      { path: "template_id", reason: "inactive template cannot be mapped" },
    ]);
  }

  return target;
}

async function validateActiveTagsOwned(prismaClient, userId, tagIds) {
  if (tagIds.length === 0) {
    return [];
  }

  const rows = await prismaClient.tag.findMany({
    where: {
      id: { in: tagIds },
      user_id: userId,
      is_active: true,
    },
    select: {
      id: true,
    },
  });

  if (rows.length !== tagIds.length) {
    throw new ValidationError("Invalid request", [
      { path: "tag_ids", reason: "all tags must be active and owned by user" },
    ]);
  }

  return rows;
}

function createPrismaTemplateStore(prismaClient) {
  return {
    async list(req, query = {}) {
      const { pageNo, pageSize } = normalizePagination(query);
      const includeInactive = parseBoolean(query.include_inactive, false);
      const searchTemplateName = parseStringLike(query.template_name);
      const where = {
        user_id: currentUserId(req),
      };

      if (!includeInactive) {
        where.is_active = true;
      }

      if (searchTemplateName) {
        where.template_name = { contains: searchTemplateName };
      }

      const [list, totalCount] = await Promise.all([
        prismaClient.transactionTemplate.findMany({
          where,
          orderBy: parseOrderBy(query.sort, SORT_FIELD_MAP, { id: "desc" }),
          skip: (pageNo - 1) * pageSize,
          take: pageSize,
        }),
        prismaClient.transactionTemplate.count({ where }),
      ]);

      return {
        list,
        page_no: pageNo,
        page_size: pageSize,
        total_count: totalCount,
      };
    },

    async create(req, payload) {
      return prismaClient.transactionTemplate.create({
        data: {
          user_id: currentUserId(req),
          template_name: payload.template_name,
          default_title: payload.default_title,
          default_memo: payload.default_memo,
          is_active: true,
        },
      });
    },

    async findById(req, templateIdRaw) {
      return findTemplateOwned(prismaClient, currentUserId(req), parseBigIntId(templateIdRaw, "template_id"));
    },

    async updateById(req, templateIdRaw, payload) {
      const templateId = parseBigIntId(templateIdRaw, "template_id");
      const userId = currentUserId(req);
      const target = await findTemplateOwned(prismaClient, userId, templateId);
      if (!target) {
        return null;
      }

      return prismaClient.transactionTemplate.update({
        where: { id: templateId },
        data: {
          template_name:
            payload.template_name === undefined
              ? target.template_name
              : payload.template_name,
          default_title:
            payload.default_title === undefined
              ? target.default_title
              : payload.default_title,
          default_memo:
            payload.default_memo === undefined
              ? target.default_memo
              : payload.default_memo,
        },
      });
    },

    async deleteById(req, templateIdRaw) {
      const deleted = await prismaClient.transactionTemplate.updateMany({
        where: {
          id: parseBigIntId(templateIdRaw, "template_id"),
          user_id: currentUserId(req),
          is_active: true,
        },
        data: {
          is_active: false,
        },
      });

      return deleted.count > 0;
    },

    async listMappings(req, templateIdRaw, query = {}) {
      const userId = currentUserId(req);
      const templateId = parseBigIntId(templateIdRaw, "template_id");
      const target = await findTemplateOwned(prismaClient, userId, templateId);
      if (!target) {
        return null;
      }

      const { pageNo, pageSize } = normalizePagination(query);
      const where = {
        user_id: userId,
        template_id: templateId,
      };

      const [list, totalCount] = await Promise.all([
        prismaClient.transactionTemplateTag.findMany({
          where,
          include: {
            tag: true,
          },
          orderBy: [{ id: "desc" }],
          skip: (pageNo - 1) * pageSize,
          take: pageSize,
        }),
        prismaClient.transactionTemplateTag.count({ where }),
      ]);

      return {
        list,
        page_no: pageNo,
        page_size: pageSize,
        total_count: totalCount,
      };
    },

    async addMapping(req, templateIdRaw, tagIdRaw) {
      const userId = currentUserId(req);
      const templateId = parseBigIntId(templateIdRaw, "template_id");
      const tagId = parseBigIntId(tagIdRaw, "tag_id");
      const target = await assertTemplateForMapping(prismaClient, userId, templateId);
      if (!target) {
        return null;
      }

      const tag = await prismaClient.tag.findFirst({
        where: {
          id: tagId,
          user_id: userId,
          is_active: true,
        },
      });

      if (!tag) {
        throw new ValidationError("Invalid request", [
          { path: "tag_id", reason: "tag must be active and owned by user" },
        ]);
      }

      try {
        return await prismaClient.transactionTemplateTag.create({
          data: {
            user_id: userId,
            template_id: templateId,
            tag_id: tagId,
          },
          include: {
            tag: true,
          },
        });
      } catch (error) {
        if (isPrismaUniqueError(error)) {
          throw new ConflictError("Template tag mapping already exists");
        }
        throw error;
      }
    },

    async removeMapping(req, templateIdRaw, tagIdRaw) {
      const userId = currentUserId(req);
      const templateId = parseBigIntId(templateIdRaw, "template_id");
      const tagId = parseBigIntId(tagIdRaw, "tag_id");
      const target = await assertTemplateForMapping(prismaClient, userId, templateId);
      if (!target) {
        return null;
      }

      const deleted = await prismaClient.transactionTemplateTag.deleteMany({
        where: {
          user_id: userId,
          template_id: templateId,
          tag_id: tagId,
        },
      });

      return deleted.count > 0;
    },

    async replaceMappings(req, templateIdRaw, tagIdsRaw) {
      const userId = currentUserId(req);
      const templateId = parseBigIntId(templateIdRaw, "template_id");
      const target = await assertTemplateForMapping(prismaClient, userId, templateId);
      if (!target) {
        return null;
      }

      const tagIds = tagIdsRaw.map((item, idx) => parseBigIntId(item, `tag_ids[${idx}]`));
      const uniqueTagIds = [...new Set(tagIds.map((id) => id.toString()))].map((id) => BigInt(id));
      if (uniqueTagIds.length !== tagIds.length) {
        throw new ValidationError("Invalid request", [{ path: "tag_ids", reason: "must not contain duplicates" }]);
      }

      await validateActiveTagsOwned(prismaClient, userId, uniqueTagIds);

      await prismaClient.$transaction(async (tx) => {
        await tx.transactionTemplateTag.deleteMany({
          where: {
            user_id: userId,
            template_id: templateId,
          },
        });

        if (uniqueTagIds.length > 0) {
          await tx.transactionTemplateTag.createMany({
            data: uniqueTagIds.map((tagId) => ({
              user_id: userId,
              template_id: templateId,
              tag_id: tagId,
            })),
          });
        }
      });

      return prismaClient.transactionTemplateTag.findMany({
        where: {
          user_id: userId,
          template_id: templateId,
        },
        include: { tag: true },
        orderBy: [{ id: "desc" }],
      });
    },
  };
}

module.exports = {
  createPrismaTemplateStore,
};

