const { Router } = require("express");
const { NotFoundError, ValidationError } = require("../errors/httpErrors");

function hasOwn(body, key) {
  return Object.prototype.hasOwnProperty.call(body, key);
}

function normalizeString(value) {
  if (value === undefined || value === null) {
    return "";
  }
  return String(value).trim();
}

function normalizeOptionalString(value) {
  if (value === undefined) {
    return undefined;
  }
  if (value === null || value === "") {
    return null;
  }
  return String(value);
}

function parseBalance(value, required) {
  if (value === undefined || value === null || value === "") {
    return required ? { ok: false } : { ok: true, value: null };
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return { ok: false };
    }
    return { ok: true, value: String(value) };
  }

  const normalized = String(value).trim();
  const numericPattern = /^[+-]?(?:\d+\.?\d*|\d*\.\d+)(?:[eE][+-]?\d+)?$/;

  if (!numericPattern.test(normalized)) {
    return { ok: false };
  }

  return { ok: true, value: normalized };
}

function parseIntField(value, required, fallback) {
  if (value === undefined || value === null || value === "") {
    if (required) {
      return { ok: false };
    }
    return { ok: true, value: fallback };
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return { ok: false };
  }

  return { ok: true, value: parsed };
}

function parseBooleanField(value, required, fallback) {
  if (value === undefined) {
    if (required) {
      return { ok: false };
    }
    return { ok: true, value: fallback };
  }

  if (typeof value === "boolean") {
    return { ok: true, value };
  }

  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "y", "yes"].includes(normalized)) {
    return { ok: true, value: true };
  }
  if (["0", "false", "n", "no"].includes(normalized)) {
    return { ok: true, value: false };
  }

  return { ok: false };
}

function parseDateTimeField(value) {
  if (value === undefined) {
    return { provided: false, ok: true };
  }

  if (value === null || value === "") {
    return { provided: true, ok: true, value: null };
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return { provided: true, ok: false };
  }

  return { provided: true, ok: true, value: parsed };
}

function validateCreatePayload(body = {}) {
  const fields = [];
  const data = {};

  const accountName = normalizeString(body.account_name);
  if (!accountName) {
    fields.push({ path: "account_name", reason: "must not be blank" });
  } else {
    data.account_name = accountName;
  }

  const accountType = normalizeString(body.account_type || "ETC");
  if (!accountType) {
    fields.push({ path: "account_type", reason: "must not be blank" });
  } else {
    data.account_type = accountType;
  }

  data.institution_name = normalizeOptionalString(body.institution_name);
  data.account_no_masked = normalizeOptionalString(body.account_no_masked);

  const currencyCode = normalizeString(body.currency_code || "KRW");
  if (!currencyCode) {
    fields.push({ path: "currency_code", reason: "must not be blank" });
  } else {
    data.currency_code = currencyCode;
  }

  const currentBalance = parseBalance(body.current_balance, true);
  if (!currentBalance.ok) {
    fields.push({ path: "current_balance", reason: "must be a numeric string" });
  } else {
    data.current_balance = currentBalance.value;
  }

  const balanceUpdatedAt = parseDateTimeField(body.balance_updated_at);
  if (!balanceUpdatedAt.ok) {
    fields.push({ path: "balance_updated_at", reason: "must be a valid datetime" });
  } else if (balanceUpdatedAt.provided) {
    data.balance_updated_at = balanceUpdatedAt.value;
  }

  const displayOrder = parseIntField(body.display_order, false, 0);
  if (!displayOrder.ok) {
    fields.push({ path: "display_order", reason: "must be an integer" });
  } else {
    data.display_order = displayOrder.value;
  }

  const isActive = parseBooleanField(body.is_active, false, true);
  if (!isActive.ok) {
    fields.push({ path: "is_active", reason: "must be boolean" });
  } else {
    data.is_active = isActive.value;
  }

  if (fields.length > 0) {
    throw new ValidationError("Invalid request", fields);
  }

  return data;
}

function validateUpdatePayload(body = {}) {
  const fields = [];
  const data = {};

  if (hasOwn(body, "account_name")) {
    const accountName = normalizeString(body.account_name);
    if (!accountName) {
      fields.push({ path: "account_name", reason: "must not be blank" });
    } else {
      data.account_name = accountName;
    }
  }

  if (hasOwn(body, "account_type")) {
    const accountType = normalizeString(body.account_type);
    if (!accountType) {
      fields.push({ path: "account_type", reason: "must not be blank" });
    } else {
      data.account_type = accountType;
    }
  }

  if (hasOwn(body, "institution_name")) {
    data.institution_name = normalizeOptionalString(body.institution_name);
  }

  if (hasOwn(body, "account_no_masked")) {
    data.account_no_masked = normalizeOptionalString(body.account_no_masked);
  }

  if (hasOwn(body, "currency_code")) {
    const currencyCode = normalizeString(body.currency_code);
    if (!currencyCode) {
      fields.push({ path: "currency_code", reason: "must not be blank" });
    } else {
      data.currency_code = currencyCode;
    }
  }

  if (hasOwn(body, "current_balance")) {
    const currentBalance = parseBalance(body.current_balance, true);
    if (!currentBalance.ok) {
      fields.push({ path: "current_balance", reason: "must be a numeric string" });
    } else {
      data.current_balance = currentBalance.value;
    }
  }

  if (hasOwn(body, "balance_updated_at")) {
    const balanceUpdatedAt = parseDateTimeField(body.balance_updated_at);
    if (!balanceUpdatedAt.ok) {
      fields.push({ path: "balance_updated_at", reason: "must be a valid datetime" });
    } else {
      data.balance_updated_at = balanceUpdatedAt.value;
    }
  }

  if (hasOwn(body, "display_order")) {
    const displayOrder = parseIntField(body.display_order, true, 0);
    if (!displayOrder.ok) {
      fields.push({ path: "display_order", reason: "must be an integer" });
    } else {
      data.display_order = displayOrder.value;
    }
  }

  if (hasOwn(body, "is_active")) {
    const isActive = parseBooleanField(body.is_active, true, true);
    if (!isActive.ok) {
      fields.push({ path: "is_active", reason: "must be boolean" });
    } else {
      data.is_active = isActive.value;
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

function serializeAccount(row) {
  return {
    account_id: String(row.id),
    user_id: String(row.user_id),
    account_name: row.name,
    account_type: row.account_type,
    institution_name: row.memo,
    account_no_masked: row.account_no_masked,
    currency_code: row.currency,
    current_balance: row.balance === null || row.balance === undefined ? null : String(row.balance),
    balance_updated_at: toIso(row.balance_updated_at),
    display_order: row.sort_order,
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

function createAccountsRouter({ accountStore }) {
  if (!accountStore) {
    throw new Error("accountStore is required");
  }

  const router = Router();

  router.get(
    "/",
    wrap(async (req, res) => {
      const result = await accountStore.list(req, req.query);

      res.status(200).json({
        data: {
          list: result.list.map(serializeAccount),
          page_no: result.page_no,
          page_size: result.page_size,
          total_count: result.total_count,
        },
      });
    }),
  );

  router.get(
    "/:id",
    wrap(async (req, res) => {
      const row = await accountStore.findById(req, req.params.id);
      if (!row) {
        throw new NotFoundError("Account not found");
      }

      res.status(200).json({ data: serializeAccount(row) });
    }),
  );

  router.post(
    "/",
    wrap(async (req, res) => {
      const payload = validateCreatePayload(req.body || {});
      const created = await accountStore.create(req, payload);

      res.status(201).json({ data: serializeAccount(created) });
    }),
  );

  router.patch(
    "/:id",
    wrap(async (req, res) => {
      const payload = validateUpdatePayload(req.body || {});
      const updated = await accountStore.updateById(req, req.params.id, payload);

      if (!updated) {
        throw new NotFoundError("Account not found");
      }

      res.status(200).json({ data: serializeAccount(updated) });
    }),
  );

  router.delete(
    "/:id",
    wrap(async (req, res) => {
      const deleted = await accountStore.deleteById(req, req.params.id);
      if (!deleted) {
        throw new NotFoundError("Account not found");
      }

      res.status(204).send();
    }),
  );

  return router;
}

module.exports = createAccountsRouter;