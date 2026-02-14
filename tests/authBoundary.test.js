const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const { createApp } = require("../src/server/app");

function nowIso() {
  return new Date().toISOString();
}

function createFakeAccountStore() {
  const rows = [];
  let seq = 0;

  return {
    async list(req, query) {
      const pageNo = Number.parseInt(query && query.page_no, 10) || 1;
      const pageSize = Number.parseInt(query && query.page_size, 10) || 20;
      const list = rows.filter((row) => row.user_id === req.auth.userId && row.is_active === true);
      return {
        list,
        page_no: pageNo,
        page_size: pageSize,
        total_count: list.length,
      };
    },

    async create(req, payload) {
      seq += 1;
      const row = {
        id: BigInt(seq),
        user_id: BigInt(req.auth.userId),
        name: payload.account_name,
        account_type: payload.account_type,
        memo: payload.institution_name,
        account_no_masked: payload.account_no_masked,
        currency: payload.currency_code,
        balance: payload.current_balance,
        balance_updated_at: payload.balance_updated_at || nowIso(),
        sort_order: payload.display_order || 0,
        is_active: payload.is_active !== false,
        created_at: nowIso(),
        updated_at: nowIso(),
      };
      rows.push(row);
      return row;
    },

    async findById(req, id) {
      return (
        rows.find(
          (row) => String(row.id) === String(id) && String(row.user_id) === String(req.auth.userId) && row.is_active,
        ) || null
      );
    },

    async updateById(req, id, payload) {
      const row = rows.find(
        (item) => String(item.id) === String(id) && String(item.user_id) === String(req.auth.userId) && item.is_active,
      );
      if (!row) {
        return null;
      }

      if (Object.prototype.hasOwnProperty.call(payload, "account_name")) row.name = payload.account_name;
      if (Object.prototype.hasOwnProperty.call(payload, "account_type")) row.account_type = payload.account_type;
      if (Object.prototype.hasOwnProperty.call(payload, "institution_name")) row.memo = payload.institution_name;
      if (Object.prototype.hasOwnProperty.call(payload, "account_no_masked")) row.account_no_masked = payload.account_no_masked;
      if (Object.prototype.hasOwnProperty.call(payload, "currency_code")) row.currency = payload.currency_code;
      if (Object.prototype.hasOwnProperty.call(payload, "current_balance")) row.balance = payload.current_balance;
      if (Object.prototype.hasOwnProperty.call(payload, "balance_updated_at")) row.balance_updated_at = payload.balance_updated_at;
      if (Object.prototype.hasOwnProperty.call(payload, "display_order")) row.sort_order = payload.display_order;
      if (Object.prototype.hasOwnProperty.call(payload, "is_active")) row.is_active = payload.is_active;
      row.updated_at = nowIso();
      return row;
    },

    async deleteById(req, id) {
      const row = rows.find(
        (item) => String(item.id) === String(id) && String(item.user_id) === String(req.auth.userId) && item.is_active,
      );
      if (!row) {
        return false;
      }
      row.is_active = false;
      row.updated_at = nowIso();
      return true;
    },
  };
}

test("missing X-Auth-User-Id returns 401", async () => {
  const app = createApp({ accountStore: createFakeAccountStore() });
  const res = await request(app).get("/api/accounts");

  assert.equal(res.status, 401);
  assert.equal(res.body.error.code, "UNAUTHORIZED");
});

test("with X-Auth-User-Id passes boundary", async () => {
  const app = createApp({ accountStore: createFakeAccountStore() });
  const res = await request(app)
    .get("/api/accounts")
    .set("X-Auth-User-Id", "1")
    .set("X-Auth-Provider", "oe");

  assert.equal(res.status, 200);
  assert.equal(Array.isArray(res.body.data.list), true);
});

test("missing X-Auth-Provider returns 401", async () => {
  const app = createApp({ accountStore: createFakeAccountStore() });
  const res = await request(app).get("/api/accounts").set("X-Auth-User-Id", "1");

  assert.equal(res.status, 401);
  assert.equal(res.body.error.code, "UNAUTHORIZED");
});

test("create ignores user_id in body", async () => {
  const app = createApp({ accountStore: createFakeAccountStore() });
  const res = await request(app)
    .post("/api/accounts")
    .set("X-Auth-User-Id", "1")
    .set("X-Auth-Provider", "oe")
    .send({
      user_id: "9999",
      account_name: "wallet",
      account_type: "ETC",
      current_balance: "100",
      currency_code: "KRW",
    });

  assert.equal(res.status, 201);
  assert.equal(res.body.data.user_id, "1");
});

test("cross-user resource access returns 404", async () => {
  const app = createApp({ accountStore: createFakeAccountStore() });

  const created = await request(app)
    .post("/api/accounts")
    .set("X-Auth-User-Id", "1")
    .set("X-Auth-Provider", "oe")
    .send({
      account_name: "a-account",
      account_type: "ETC",
      current_balance: "50",
      currency_code: "KRW",
    });

  const accountId = created.body.data.account_id;

  const foundByOther = await request(app)
    .get(`/api/accounts/${accountId}`)
    .set("X-Auth-User-Id", "2")
    .set("X-Auth-Provider", "oe");

  assert.equal(foundByOther.status, 404);
  assert.equal(foundByOther.body.error.code, "NOT_FOUND");
});