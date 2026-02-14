const { Router } = require("express");
const { NotFoundError, ValidationError } = require("../errors/httpErrors");

function hasOwn(body, key) {
  return Object.prototype.hasOwnProperty.call(body, key);
}

function normalizeText(value) {
  if (value === undefined || value === null) {
    return "";
  }
  return String(value).trim();
}

function normalizeOptionalText(value) {
  if (value === undefined) {
    return undefined;
  }
  if (value === null || value === "") {
    return null;
  }
  return String(value);
}

function validateCreatePayload(body = {}) {
  const fields = [];
  const data = {};
  const templateName = normalizeText(body.template_name);
  if (!templateName) {
    fields.push({ path: "template_name", reason: "must not be blank" });
  } else if (templateName.length > 100) {
    fields.push({ path: "template_name", reason: "must be at most 100 characters" });
  } else {
    data.template_name = templateName;
  }

  const defaultTitle = normalizeOptionalText(body.default_title);
  if (defaultTitle !== undefined && defaultTitle !== null && defaultTitle.length > 200) {
    fields.push({ path: "default_title", reason: "must be at most 200 characters" });
  } else if (defaultTitle !== undefined) {
    data.default_title = defaultTitle;
  }

  const defaultMemo = normalizeOptionalText(body.default_memo);
  if (defaultMemo !== undefined && defaultMemo !== null && defaultMemo.length > 1000) {
    fields.push({ path: "default_memo", reason: "must be at most 1000 characters" });
  } else if (defaultMemo !== undefined) {
    data.default_memo = defaultMemo;
  }

  if (fields.length > 0) {
    throw new ValidationError("Invalid request", fields);
  }

  return data;
}

function validateUpdatePayload(body = {}) {
  const fields = [];
  const data = {};

  if (hasOwn(body, "template_name")) {
    const templateName = normalizeText(body.template_name);
    if (!templateName) {
      fields.push({ path: "template_name", reason: "must not be blank" });
    } else if (templateName.length > 100) {
      fields.push({ path: "template_name", reason: "must be at most 100 characters" });
    } else {
      data.template_name = templateName;
    }
  }

  if (hasOwn(body, "default_title")) {
    const defaultTitle = normalizeOptionalText(body.default_title);
    if (defaultTitle !== null && defaultTitle.length > 200) {
      fields.push({ path: "default_title", reason: "must be at most 200 characters" });
    } else {
      data.default_title = defaultTitle;
    }
  }

  if (hasOwn(body, "default_memo")) {
    const defaultMemo = normalizeOptionalText(body.default_memo);
    if (defaultMemo !== null && defaultMemo.length > 1000) {
      fields.push({ path: "default_memo", reason: "must be at most 1000 characters" });
    } else {
      data.default_memo = defaultMemo;
    }
  }

  if (Object.keys(data).length === 0) {
    fields.push({ path: "body", reason: "at least one field is required" });
  }

  if (fields.length > 0) {
    throw new ValidationError("Invalid request", fields);
  }

  return data;
}

function validateReplaceMappingsPayload(body = {}) {
  if (!Array.isArray(body.tag_ids)) {
    throw new ValidationError("Invalid request", [{ path: "tag_ids", reason: "must be an array" }]);
  }
  return { tag_ids: body.tag_ids };
}

function validateAddMappingPayload(body = {}) {
  if (!hasOwn(body, "tag_id")) {
    throw new ValidationError("Invalid request", [{ path: "tag_id", reason: "is required" }]);
  }
  return { tag_id: body.tag_id };
}

function toIso(value) {
  if (!value) {
    return null;
  }
  return value instanceof Date ? value.toISOString() : value;
}

function serializeTemplate(row) {
  return {
    template_id: String(row.id),
    user_id: String(row.user_id),
    template_name: row.template_name,
    default_title: row.default_title,
    default_memo: row.default_memo,
    is_active: Boolean(row.is_active),
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
  };
}

function serializeTemplateTag(row) {
  return {
    template_tag_id: String(row.id),
    template_id: String(row.template_id),
    tag_id: String(row.tag_id),
    tag_name: row.tag ? row.tag.tag_name : null,
    tag_is_active: row.tag ? Boolean(row.tag.is_active) : null,
    created_at: toIso(row.created_at),
  };
}

function wrap(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function createTemplatesRouter({ templateStore }) {
  if (!templateStore) {
    throw new Error("templateStore is required");
  }

  const router = Router();

  router.get(
    "/",
    wrap(async (req, res) => {
      const result = await templateStore.list(req, req.query);
      res.status(200).json({
        data: {
          list: result.list.map(serializeTemplate),
          page_no: result.page_no,
          page_size: result.page_size,
          total_count: result.total_count,
        },
      });
    }),
  );

  router.get(
    "/:template_id",
    wrap(async (req, res) => {
      const found = await templateStore.findById(req, req.params.template_id);
      if (!found) {
        throw new NotFoundError("Transaction template not found");
      }
      res.status(200).json({ data: serializeTemplate(found) });
    }),
  );

  router.post(
    "/",
    wrap(async (req, res) => {
      const payload = validateCreatePayload(req.body || {});
      const created = await templateStore.create(req, payload);
      res.status(201).json({ data: serializeTemplate(created) });
    }),
  );

  router.patch(
    "/:template_id",
    wrap(async (req, res) => {
      const payload = validateUpdatePayload(req.body || {});
      const updated = await templateStore.updateById(req, req.params.template_id, payload);
      if (!updated) {
        throw new NotFoundError("Transaction template not found");
      }
      res.status(200).json({ data: serializeTemplate(updated) });
    }),
  );

  router.delete(
    "/:template_id",
    wrap(async (req, res) => {
      const deleted = await templateStore.deleteById(req, req.params.template_id);
      if (!deleted) {
        throw new NotFoundError("Transaction template not found");
      }
      res.status(204).send();
    }),
  );

  router.get(
    "/:template_id/tags",
    wrap(async (req, res) => {
      const result = await templateStore.listMappings(req, req.params.template_id, req.query);
      if (!result) {
        throw new NotFoundError("Transaction template not found");
      }
      res.status(200).json({
        data: {
          list: result.list.map(serializeTemplateTag),
          page_no: result.page_no,
          page_size: result.page_size,
          total_count: result.total_count,
        },
      });
    }),
  );

  router.post(
    "/:template_id/tags",
    wrap(async (req, res) => {
      const payload = validateAddMappingPayload(req.body || {});
      const created = await templateStore.addMapping(req, req.params.template_id, payload.tag_id);
      if (!created) {
        throw new NotFoundError("Transaction template not found");
      }
      res.status(201).json({ data: serializeTemplateTag(created) });
    }),
  );

  router.delete(
    "/:template_id/tags/:tag_id",
    wrap(async (req, res) => {
      const deleted = await templateStore.removeMapping(req, req.params.template_id, req.params.tag_id);
      if (deleted === null) {
        throw new NotFoundError("Transaction template not found");
      }
      if (!deleted) {
        throw new NotFoundError("Template tag mapping not found");
      }
      res.status(204).send();
    }),
  );

  router.patch(
    "/:template_id/tags",
    wrap(async (req, res) => {
      const payload = validateReplaceMappingsPayload(req.body || {});
      const rows = await templateStore.replaceMappings(req, req.params.template_id, payload.tag_ids);
      if (rows === null) {
        throw new NotFoundError("Transaction template not found");
      }
      res.status(200).json({
        data: {
          list: rows.map(serializeTemplateTag),
        },
      });
    }),
  );

  return router;
}

module.exports = createTemplatesRouter;

