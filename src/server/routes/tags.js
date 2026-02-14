const { Router } = require("express");
const { NotFoundError, ValidationError } = require("../errors/httpErrors");

function hasOwn(body, key) {
  return Object.prototype.hasOwnProperty.call(body, key);
}

function normalizeTagNameInput(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function parseIntField(value, path, fallback) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    throw new ValidationError("Invalid request", [{ path, reason: "must be an integer" }]);
  }

  return parsed;
}

function validateCreatePayload(body = {}) {
  const fields = [];
  const data = {};
  const tagName = normalizeTagNameInput(body.tag_name);

  if (!tagName) {
    fields.push({ path: "tag_name", reason: "must not be blank" });
  } else if (tagName.length > 50) {
    fields.push({ path: "tag_name", reason: "must be at most 50 characters" });
  } else {
    data.tag_name = tagName;
  }

  try {
    data.display_order = parseIntField(body.display_order, "display_order", 0);
  } catch (error) {
    fields.push(...(error.fields || []));
  }

  if (fields.length > 0) {
    throw new ValidationError("Invalid request", fields);
  }

  return data;
}

function validateUpdatePayload(body = {}) {
  const fields = [];
  const data = {};

  if (hasOwn(body, "tag_name")) {
    const tagName = normalizeTagNameInput(body.tag_name);
    if (!tagName) {
      fields.push({ path: "tag_name", reason: "must not be blank" });
    } else if (tagName.length > 50) {
      fields.push({ path: "tag_name", reason: "must be at most 50 characters" });
    } else {
      data.tag_name = tagName;
    }
  }

  if (hasOwn(body, "display_order")) {
    try {
      data.display_order = parseIntField(body.display_order, "display_order", 0);
    } catch (error) {
      fields.push(...(error.fields || []));
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

function toIso(value) {
  if (!value) {
    return null;
  }
  return value instanceof Date ? value.toISOString() : value;
}

function serializeTag(row) {
  return {
    tag_id: String(row.id),
    user_id: String(row.user_id),
    tag_name: row.tag_name,
    display_order: row.display_order,
    is_active: Boolean(row.is_active),
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
  };
}

function wrap(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function createTagsRouter({ tagStore }) {
  if (!tagStore) {
    throw new Error("tagStore is required");
  }

  const router = Router();

  router.get(
    "/",
    wrap(async (req, res) => {
      const result = await tagStore.list(req, req.query);
      res.status(200).json({
        data: {
          list: result.list.map(serializeTag),
          page_no: result.page_no,
          page_size: result.page_size,
          total_count: result.total_count,
        },
      });
    }),
  );

  router.get(
    "/:tag_id",
    wrap(async (req, res) => {
      const found = await tagStore.findById(req, req.params.tag_id);
      if (!found) {
        throw new NotFoundError("Tag not found");
      }
      res.status(200).json({ data: serializeTag(found) });
    }),
  );

  router.post(
    "/",
    wrap(async (req, res) => {
      const payload = validateCreatePayload(req.body || {});
      const created = await tagStore.create(req, payload);
      res.status(201).json({ data: serializeTag(created) });
    }),
  );

  router.patch(
    "/:tag_id",
    wrap(async (req, res) => {
      const payload = validateUpdatePayload(req.body || {});
      const updated = await tagStore.updateById(req, req.params.tag_id, payload);
      if (!updated) {
        throw new NotFoundError("Tag not found");
      }
      res.status(200).json({ data: serializeTag(updated) });
    }),
  );

  router.delete(
    "/:tag_id",
    wrap(async (req, res) => {
      const deleted = await tagStore.deleteById(req, req.params.tag_id);
      if (!deleted) {
        throw new NotFoundError("Tag not found");
      }
      res.status(204).send();
    }),
  );

  return router;
}

module.exports = createTagsRouter;

