const { Router } = require("express");
const { NotFoundError, ValidationError } = require("../errors/httpErrors");

function hasOwn(body, key) {
  return Object.prototype.hasOwnProperty.call(body, key);
}

function normalizeString(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}

function parseBalance(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return parsed;
}

function parseSortOrder(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return parsed;
}

function validateCreatePayload(body = {}) {
  const fields = [];
  const data = {};

  const name = normalizeString(body.name);
  if (!name) {
    fields.push({ path: "name", reason: "must not be blank" });
  } else {
    data.name = name;
  }

  const balance = parseBalance(body.balance);
  if (balance === null) {
    fields.push({ path: "balance", reason: "must be a number" });
  } else {
    data.balance = balance;
  }

  const currency = normalizeString(body.currency || "KRW");
  if (!currency) {
    fields.push({ path: "currency", reason: "must not be blank" });
  } else {
    data.currency = currency;
  }

  if (hasOwn(body, "memo")) {
    data.memo = body.memo === null ? null : String(body.memo);
  }

  if (hasOwn(body, "sort_order")) {
    const sortOrder = parseSortOrder(body.sort_order);
    if (sortOrder === null) {
      fields.push({ path: "sort_order", reason: "must be an integer" });
    } else {
      data.sort_order = sortOrder;
    }
  } else {
    data.sort_order = 0;
  }

  if (fields.length > 0) {
    throw new ValidationError("Invalid request", fields);
  }

  return data;
}

function validateUpdatePayload(body = {}) {
  const fields = [];
  const data = {};

  if (hasOwn(body, "name")) {
    const name = normalizeString(body.name);
    if (!name) {
      fields.push({ path: "name", reason: "must not be blank" });
    } else {
      data.name = name;
    }
  }

  if (hasOwn(body, "balance")) {
    const balance = parseBalance(body.balance);
    if (balance === null) {
      fields.push({ path: "balance", reason: "must be a number" });
    } else {
      data.balance = balance;
    }
  }

  if (hasOwn(body, "currency")) {
    const currency = normalizeString(body.currency);
    if (!currency) {
      fields.push({ path: "currency", reason: "must not be blank" });
    } else {
      data.currency = currency;
    }
  }

  if (hasOwn(body, "memo")) {
    data.memo = body.memo === null ? null : String(body.memo);
  }

  if (hasOwn(body, "sort_order")) {
    const sortOrder = parseSortOrder(body.sort_order);
    if (sortOrder === null) {
      fields.push({ path: "sort_order", reason: "must be an integer" });
    } else {
      data.sort_order = sortOrder;
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

function serializeAccount(row) {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    balance: Number(row.balance),
    currency: row.currency,
    memo: row.memo,
    sort_order: row.sort_order,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
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
          items: result.items.map(serializeAccount),
          page: result.page,
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

  router.put(
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
