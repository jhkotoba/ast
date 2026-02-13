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
      const page = Number.parseInt(query && query.page, 10) || 1;
      const pageSize = Number.parseInt(query && query.page_size, 10) || 20;
      const list = rows.filter((row) => row.user_id === req.auth.userId);
      return {
        list,
        page,
        page_size: pageSize,
        total_count: list.length,
      };
    },

    async create(req, payload) {
      seq += 1;
      const row = {
        id: String(seq),
        user_id: req.auth.userId,
        name: payload.name,
        balance: payload.balance,
        currency: payload.currency,
        memo: payload.memo || null,
        sort_order: payload.sort_order || 0,
        created_at: nowIso(),
        updated_at: nowIso(),
      };
      rows.push(row);
      return row;
    },

    async findById(req, id) {
      return rows.find((row) => row.id === id && row.user_id === req.auth.userId) || null;
    },

    async updateById(req, id, payload) {
      const row = rows.find((item) => item.id === id && item.user_id === req.auth.userId);
      if (!row) {
        return null;
      }

      Object.assign(row, payload, { updated_at: nowIso() });
      return row;
    },

    async deleteById(req, id) {
      const index = rows.findIndex((row) => row.id === id && row.user_id === req.auth.userId);
      if (index < 0) {
        return false;
      }
      rows.splice(index, 1);
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
    .set("X-Auth-User-Id", "u1")
    .set("X-Auth-Provider", "oe");

  assert.equal(res.status, 200);
  assert.equal(Array.isArray(res.body.data.list), true);
});

test("missing X-Auth-Provider returns 401", async () => {
  const app = createApp({ accountStore: createFakeAccountStore() });
  const res = await request(app).get("/api/accounts").set("X-Auth-User-Id", "u1");

  assert.equal(res.status, 401);
  assert.equal(res.body.error.code, "UNAUTHORIZED");
});

test("create ignores user_id in body", async () => {
  const app = createApp({ accountStore: createFakeAccountStore() });
  const res = await request(app)
    .post("/api/accounts")
    .set("X-Auth-User-Id", "owner-1")
    .set("X-Auth-Provider", "oe")
    .send({
      user_id: "attacker",
      name: "wallet",
      balance: "100",
      currency: "KRW",
    });

  assert.equal(res.status, 201);
  assert.equal(res.body.data.user_id, "owner-1");
});

test("cross-user resource access returns 404", async () => {
  const app = createApp({ accountStore: createFakeAccountStore() });

  const created = await request(app)
    .post("/api/accounts")
    .set("X-Auth-User-Id", "user-a")
    .set("X-Auth-Provider", "oe")
    .send({
      name: "a-account",
      balance: "50",
      currency: "KRW",
    });

  const accountId = created.body.data.id;

  const foundByOther = await request(app)
    .get(`/api/accounts/${accountId}`)
    .set("X-Auth-User-Id", "user-b")
    .set("X-Auth-Provider", "oe");

  assert.equal(foundByOther.status, 404);
  assert.equal(foundByOther.body.error.code, "NOT_FOUND");
});
