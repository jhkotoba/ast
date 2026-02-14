const { Router } = require("express");
const { NotFoundError, ValidationError } = require("../errors/httpErrors");

function hasOwn(body, key) {
  return Object.prototype.hasOwnProperty.call(body, key);
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

function parseFlowType(value, path, required) {
  if (value === undefined || value === null || value === "") {
    if (required) {
      throw new ValidationError("Invalid request", [{ path, reason: "is required" }]);
    }
    return undefined;
  }

  const normalized = String(value).trim().toUpperCase();
  if (!["IN", "OUT"].includes(normalized)) {
    throw new ValidationError("Invalid request", [{ path, reason: "must be IN or OUT" }]);
  }

  return normalized;
}

function parseDateOnly(value, path, required) {
  if (value === undefined || value === null || value === "") {
    if (required) {
      throw new ValidationError("Invalid request", [{ path, reason: "is required" }]);
    }
    return undefined;
  }

  const normalized = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new ValidationError("Invalid request", [{ path, reason: "must be YYYY-MM-DD" }]);
  }

  const asDate = new Date(`${normalized}T00:00:00.000Z`);
  if (Number.isNaN(asDate.getTime())) {
    throw new ValidationError("Invalid request", [{ path, reason: "must be valid date" }]);
  }
  return asDate;
}

function parsePositiveAmount(value, path, required) {
  if (value === undefined || value === null || value === "") {
    if (required) {
      throw new ValidationError("Invalid request", [{ path, reason: "is required" }]);
    }
    return undefined;
  }

  const normalized = String(value).trim();
  if (!/^[+-]?(?:\d+\.?\d*|\d*\.\d+)$/.test(normalized)) {
    throw new ValidationError("Invalid request", [{ path, reason: "must be a numeric string" }]);
  }

  if (Number(normalized) <= 0) {
    throw new ValidationError("Invalid request", [{ path, reason: "must be greater than 0" }]);
  }

  return normalized;
}

function parseCurrencyCode(value, path, required, fallback) {
  if (value === undefined || value === null || value === "") {
    if (required) {
      throw new ValidationError("Invalid request", [{ path, reason: "is required" }]);
    }
    return fallback;
  }

  const normalized = String(value).trim();
  if (!normalized) {
    throw new ValidationError("Invalid request", [{ path, reason: "must not be blank" }]);
  }
  return normalized;
}

function parseIdArray(value, path, required) {
  if (value === undefined) {
    if (required) {
      throw new ValidationError("Invalid request", [{ path, reason: "is required" }]);
    }
    return undefined;
  }
  if (!Array.isArray(value)) {
    throw new ValidationError("Invalid request", [{ path, reason: "must be an array" }]);
  }
  return value;
}

function parseTemplateId(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  return String(value).trim();
}

function validateCreatePayload(body = {}) {
  const data = {
    flow_type: parseFlowType(body.flow_type, "flow_type", true),
    transaction_date: parseDateOnly(body.transaction_date, "transaction_date", true),
    amount: parsePositiveAmount(body.amount, "amount", true),
    currency_code: parseCurrencyCode(body.currency_code, "currency_code", false, "KRW"),
    title: normalizeOptionalText(body.title),
    memo: normalizeOptionalText(body.memo),
    template_id: parseTemplateId(body.template_id),
    tag_ids: parseIdArray(body.tag_ids, "tag_ids", false) || [],
    tag_ids_provided: hasOwn(body, "tag_ids"),
    title_provided: hasOwn(body, "title"),
    memo_provided: hasOwn(body, "memo"),
  };

  if (data.title !== null && data.title !== undefined && data.title.length > 200) {
    throw new ValidationError("Invalid request", [{ path: "title", reason: "must be at most 200 characters" }]);
  }
  if (data.memo !== null && data.memo !== undefined && data.memo.length > 1000) {
    throw new ValidationError("Invalid request", [{ path: "memo", reason: "must be at most 1000 characters" }]);
  }

  return data;
}

function validateUpdatePayload(body = {}) {
  const data = {
    tag_ids_provided: hasOwn(body, "tag_ids"),
    tag_ids: parseIdArray(body.tag_ids, "tag_ids", false),
  };

  if (hasOwn(body, "flow_type")) {
    data.flow_type = parseFlowType(body.flow_type, "flow_type", true);
  }
  if (hasOwn(body, "transaction_date")) {
    data.transaction_date = parseDateOnly(body.transaction_date, "transaction_date", true);
  }
  if (hasOwn(body, "amount")) {
    data.amount = parsePositiveAmount(body.amount, "amount", true);
  }
  if (hasOwn(body, "currency_code")) {
    data.currency_code = parseCurrencyCode(body.currency_code, "currency_code", true);
  }
  if (hasOwn(body, "title")) {
    const title = normalizeOptionalText(body.title);
    if (title !== null && title.length > 200) {
      throw new ValidationError("Invalid request", [{ path: "title", reason: "must be at most 200 characters" }]);
    }
    data.title = title;
  }
  if (hasOwn(body, "memo")) {
    const memo = normalizeOptionalText(body.memo);
    if (memo !== null && memo.length > 1000) {
      throw new ValidationError("Invalid request", [{ path: "memo", reason: "must be at most 1000 characters" }]);
    }
    data.memo = memo;
  }

  const hasScalar =
    hasOwn(body, "flow_type") ||
    hasOwn(body, "transaction_date") ||
    hasOwn(body, "amount") ||
    hasOwn(body, "currency_code") ||
    hasOwn(body, "title") ||
    hasOwn(body, "memo");

  if (!hasScalar && !data.tag_ids_provided) {
    throw new ValidationError("Invalid request", [{ path: "body", reason: "at least one field is required" }]);
  }

  if (!data.tag_ids_provided) {
    data.tag_ids = [];
  }

  return data;
}

function toIso(value) {
  if (!value) {
    return null;
  }
  return value instanceof Date ? value.toISOString() : value;
}

function toDateOnly(value) {
  const dateValue = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(dateValue.getTime())) {
    return null;
  }
  return dateValue.toISOString().slice(0, 10);
}

function serializeTransaction(row) {
  const mappings = Array.isArray(row.tags) ? row.tags : [];
  const tagIds = mappings.map((item) => String(item.tag_id));
  const tags = mappings
    .filter((item) => item.tag)
    .map((item) => ({
      tag_id: String(item.tag.id),
      tag_name: item.tag.tag_name,
    }));

  return {
    transaction_id: String(row.id),
    user_id: String(row.user_id),
    flow_type: row.flow_type,
    transaction_date: toDateOnly(row.transaction_date),
    amount: row.amount === null || row.amount === undefined ? null : String(row.amount),
    currency_code: row.currency_code,
    title: row.title,
    memo: row.memo,
    is_active: Boolean(row.is_active),
    tag_ids: tagIds,
    tags,
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
  };
}

function wrap(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function createTransactionsRouter({ transactionStore }) {
  if (!transactionStore) {
    throw new Error("transactionStore is required");
  }

  const router = Router();

  router.get(
    "/",
    wrap(async (req, res) => {
      const result = await transactionStore.list(req, req.query);
      res.status(200).json({
        data: {
          list: result.list.map(serializeTransaction),
          page_no: result.page_no,
          page_size: result.page_size,
          total_count: result.total_count,
        },
      });
    }),
  );

  router.get(
    "/:transaction_id",
    wrap(async (req, res) => {
      const found = await transactionStore.findById(req, req.params.transaction_id);
      if (!found) {
        throw new NotFoundError("Transaction not found");
      }
      res.status(200).json({ data: serializeTransaction(found) });
    }),
  );

  router.post(
    "/",
    wrap(async (req, res) => {
      const payload = validateCreatePayload(req.body || {});
      const created = await transactionStore.create(req, payload);
      res.status(201).json({ data: serializeTransaction(created) });
    }),
  );

  router.patch(
    "/:transaction_id",
    wrap(async (req, res) => {
      const payload = validateUpdatePayload(req.body || {});
      const updated = await transactionStore.updateById(req, req.params.transaction_id, payload);
      if (!updated) {
        throw new NotFoundError("Transaction not found");
      }
      res.status(200).json({ data: serializeTransaction(updated) });
    }),
  );

  router.delete(
    "/:transaction_id",
    wrap(async (req, res) => {
      const deleted = await transactionStore.deleteById(req, req.params.transaction_id);
      if (!deleted) {
        throw new NotFoundError("Transaction not found");
      }
      res.status(204).send();
    }),
  );

  return router;
}

module.exports = createTransactionsRouter;

