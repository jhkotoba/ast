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

function parseRequiredText(value, path, maxLength) {
  const normalized = String(value || "").trim();
  if (!normalized) {
    throw new ValidationError("Invalid request", [{ path, reason: "must not be blank" }]);
  }
  if (maxLength && normalized.length > maxLength) {
    throw new ValidationError("Invalid request", [{ path, reason: `must be at most ${maxLength} characters` }]);
  }
  return normalized;
}

function parsePeriod(value, path, required) {
  if (value === undefined || value === null || value === "") {
    if (required) {
      throw new ValidationError("Invalid request", [{ path, reason: "is required" }]);
    }
    return undefined;
  }

  const normalized = String(value).trim().toUpperCase();
  if (!["MONTHLY", "YEARLY"].includes(normalized)) {
    throw new ValidationError("Invalid request", [{ path, reason: "must be MONTHLY or YEARLY" }]);
  }
  return normalized;
}

function parseBillingDay(value, path, required) {
  if (value === undefined || value === null || value === "") {
    if (required) {
      throw new ValidationError("Invalid request", [{ path, reason: "is required" }]);
    }
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 31) {
    throw new ValidationError("Invalid request", [{ path, reason: "must be an integer between 1 and 31" }]);
  }
  return parsed;
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

function assertDateRange(startDate, endDate, fields = {}) {
  if (!startDate || !endDate) {
    return;
  }
  if (endDate.getTime() < startDate.getTime()) {
    throw new ValidationError("Invalid request", [
      { path: fields.endDate || "end_date", reason: "must be greater than or equal to start_date" },
    ]);
  }
}

function validateCreatePayload(body = {}) {
  const subscriptionName = parseRequiredText(body.subscription_name, "subscription_name", 100);
  const billingPeriod = parsePeriod(body.billing_period, "billing_period", true);
  const billingDay = parseBillingDay(body.billing_day, "billing_day", true);
  const amount = parsePositiveAmount(body.amount, "amount", true);
  const currencyCode = parseCurrencyCode(body.currency_code, "currency_code", false, "KRW");
  const startDate = parseDateOnly(body.start_date, "start_date", true);
  const endDate = parseDateOnly(body.end_date, "end_date", false);
  const memo = normalizeOptionalText(body.memo);

  if (memo !== undefined && memo !== null && memo.length > 1000) {
    throw new ValidationError("Invalid request", [{ path: "memo", reason: "must be at most 1000 characters" }]);
  }

  assertDateRange(startDate, endDate, { endDate: "end_date" });

  return {
    subscription_name: subscriptionName,
    billing_period: billingPeriod,
    billing_day: billingDay,
    amount,
    currency_code: currencyCode,
    start_date: startDate,
    end_date: endDate === undefined ? null : endDate,
    memo: memo === undefined ? null : memo,
  };
}

function validateUpdatePayload(body = {}) {
  const data = {};

  if (hasOwn(body, "subscription_name")) {
    data.subscription_name = parseRequiredText(body.subscription_name, "subscription_name", 100);
  }
  if (hasOwn(body, "billing_period")) {
    data.billing_period = parsePeriod(body.billing_period, "billing_period", true);
  }
  if (hasOwn(body, "billing_day")) {
    data.billing_day = parseBillingDay(body.billing_day, "billing_day", true);
  }
  if (hasOwn(body, "amount")) {
    data.amount = parsePositiveAmount(body.amount, "amount", true);
  }
  if (hasOwn(body, "currency_code")) {
    data.currency_code = parseCurrencyCode(body.currency_code, "currency_code", true);
  }
  if (hasOwn(body, "start_date")) {
    data.start_date = parseDateOnly(body.start_date, "start_date", true);
  }
  if (hasOwn(body, "end_date")) {
    data.end_date = parseDateOnly(body.end_date, "end_date", false);
    if (data.end_date === undefined) {
      data.end_date = null;
    }
  }
  if (hasOwn(body, "memo")) {
    const memo = normalizeOptionalText(body.memo);
    if (memo !== null && memo.length > 1000) {
      throw new ValidationError("Invalid request", [{ path: "memo", reason: "must be at most 1000 characters" }]);
    }
    data.memo = memo;
  }

  if (Object.keys(data).length === 0) {
    throw new ValidationError("Invalid request", [{ path: "body", reason: "at least one field is required" }]);
  }

  if (data.start_date && data.end_date) {
    assertDateRange(data.start_date, data.end_date, { endDate: "end_date" });
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
  if (!value) {
    return null;
  }
  const dateValue = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(dateValue.getTime())) {
    return null;
  }
  return dateValue.toISOString().slice(0, 10);
}

function serializeSubscription(row) {
  return {
    subscription_id: String(row.id),
    user_id: String(row.user_id),
    subscription_name: row.subscription_name,
    billing_period: row.billing_period,
    billing_day: row.billing_day,
    amount: row.amount === null || row.amount === undefined ? null : String(row.amount),
    currency_code: row.currency_code,
    start_date: toDateOnly(row.start_date),
    end_date: toDateOnly(row.end_date),
    memo: row.memo,
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

function createSubscriptionsRouter({ subscriptionStore }) {
  if (!subscriptionStore) {
    throw new Error("subscriptionStore is required");
  }

  const router = Router();

  router.get(
    "/",
    wrap(async (req, res) => {
      const result = await subscriptionStore.list(req, req.query);
      res.status(200).json({
        data: {
          list: result.list.map(serializeSubscription),
          page_no: result.page_no,
          page_size: result.page_size,
          total_count: result.total_count,
        },
      });
    }),
  );

  router.get(
    "/:subscription_id",
    wrap(async (req, res) => {
      const found = await subscriptionStore.findById(req, req.params.subscription_id);
      if (!found) {
        throw new NotFoundError("Subscription not found");
      }
      res.status(200).json({ data: serializeSubscription(found) });
    }),
  );

  router.post(
    "/",
    wrap(async (req, res) => {
      const payload = validateCreatePayload(req.body || {});
      const created = await subscriptionStore.create(req, payload);
      res.status(201).json({ data: serializeSubscription(created) });
    }),
  );

  router.patch(
    "/:subscription_id",
    wrap(async (req, res) => {
      const payload = validateUpdatePayload(req.body || {});
      const updated = await subscriptionStore.updateById(req, req.params.subscription_id, payload);
      if (!updated) {
        throw new NotFoundError("Subscription not found");
      }
      res.status(200).json({ data: serializeSubscription(updated) });
    }),
  );

  router.delete(
    "/:subscription_id",
    wrap(async (req, res) => {
      const deleted = await subscriptionStore.deleteById(req, req.params.subscription_id);
      if (!deleted) {
        throw new NotFoundError("Subscription not found");
      }
      res.status(204).send();
    }),
  );

  return router;
}

module.exports = createSubscriptionsRouter;
