const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const { createApp } = require("../src/server/app");
const { ValidationError } = require("../src/server/errors/httpErrors");

function nowIso() {
  return new Date().toISOString();
}

function dateOnly(value) {
  return new Date(`${value}T00:00:00.000Z`);
}

function createFakeStores() {
  let tagSeq = 12n;
  let templateSeq = 21n;
  let templateTagSeq = 100n;
  let txSeq = 1000n;

  const tags = [
    { id: 11n, user_id: 1n, tag_name: "Food", display_order: 0, is_active: true, created_at: nowIso(), updated_at: nowIso() },
    { id: 12n, user_id: 1n, tag_name: "Office", display_order: 1, is_active: true, created_at: nowIso(), updated_at: nowIso() },
  ];

  const templates = [
    { id: 21n, user_id: 1n, template_name: "Lunch default", default_title: "Lunch", default_memo: "weekday", is_active: true, created_at: nowIso(), updated_at: nowIso() },
  ];

  const templateTags = [
    { id: 101n, user_id: 1n, template_id: 21n, tag_id: 11n, created_at: nowIso() },
  ];

  const transactions = [
    {
      id: 1001n,
      user_id: 1n,
      flow_type: "OUT",
      transaction_date: dateOnly("2026-02-14"),
      amount: "100.00",
      currency_code: "KRW",
      title: "old",
      memo: "old",
      is_active: true,
      created_at: nowIso(),
      updated_at: nowIso(),
    },
    {
      id: 1002n,
      user_id: 1n,
      flow_type: "OUT",
      transaction_date: dateOnly("2026-02-14"),
      amount: "200.00",
      currency_code: "KRW",
      title: "inactive",
      memo: "inactive",
      is_active: false,
      created_at: nowIso(),
      updated_at: nowIso(),
    },
  ];

  const txTags = [{ id: 201n, user_id: 1n, transaction_id: 1001n, tag_id: 11n, created_at: nowIso() }];

  function listTxTags(txId) {
    return txTags
      .filter((item) => item.transaction_id === txId)
      .map((item) => {
        const tag = tags.find((t) => t.id === item.tag_id) || null;
        return {
          ...item,
          tag,
        };
      });
  }

  function parseId(value) {
    return BigInt(String(value));
  }

  const accountStore = {
    async list() {
      return { list: [], page_no: 1, page_size: 20, total_count: 0 };
    },
    async create() {
      throw new Error("not implemented");
    },
    async findById() {
      return null;
    },
    async updateById() {
      return null;
    },
    async deleteById() {
      return false;
    },
  };

  const tagStore = {
    async list(req, query) {
      const userId = BigInt(req.auth.userId);
      const includeInactive = String(query.include_inactive || "false") === "true";
      const list = tags.filter((row) => row.user_id === userId && (includeInactive || row.is_active));
      return { list, page_no: 1, page_size: 20, total_count: list.length };
    },
    async create(req, payload) {
      tagSeq += 1n;
      const row = {
        id: tagSeq,
        user_id: BigInt(req.auth.userId),
        tag_name: payload.tag_name,
        display_order: payload.display_order ?? 0,
        is_active: true,
        created_at: nowIso(),
        updated_at: nowIso(),
      };
      tags.push(row);
      return row;
    },
    async findById(req, id) {
      return tags.find((row) => row.id === parseId(id) && row.user_id === BigInt(req.auth.userId)) || null;
    },
    async updateById(req, id, payload) {
      const row = tags.find((item) => item.id === parseId(id) && item.user_id === BigInt(req.auth.userId));
      if (!row) return null;
      if (!row.is_active) {
        throw new ValidationError("Invalid request", [{ path: "tag_id", reason: "inactive tag cannot be updated" }]);
      }
      if (payload.tag_name !== undefined) row.tag_name = payload.tag_name;
      if (payload.display_order !== undefined) row.display_order = payload.display_order;
      row.updated_at = nowIso();
      return row;
    },
    async deleteById(req, id) {
      const row = tags.find((item) => item.id === parseId(id) && item.user_id === BigInt(req.auth.userId) && item.is_active);
      if (!row) return false;
      row.is_active = false;
      row.updated_at = nowIso();
      return true;
    },
  };

  const templateStore = {
    async list(req) {
      const userId = BigInt(req.auth.userId);
      const list = templates.filter((row) => row.user_id === userId && row.is_active);
      return { list, page_no: 1, page_size: 20, total_count: list.length };
    },
    async create(req, payload) {
      templateSeq += 1n;
      const row = {
        id: templateSeq,
        user_id: BigInt(req.auth.userId),
        template_name: payload.template_name,
        default_title: payload.default_title ?? null,
        default_memo: payload.default_memo ?? null,
        is_active: true,
        created_at: nowIso(),
        updated_at: nowIso(),
      };
      templates.push(row);
      return row;
    },
    async findById(req, id) {
      return templates.find((row) => row.id === parseId(id) && row.user_id === BigInt(req.auth.userId)) || null;
    },
    async updateById(req, id, payload) {
      const row = templates.find((item) => item.id === parseId(id) && item.user_id === BigInt(req.auth.userId));
      if (!row) return null;
      if (payload.template_name !== undefined) row.template_name = payload.template_name;
      if (payload.default_title !== undefined) row.default_title = payload.default_title;
      if (payload.default_memo !== undefined) row.default_memo = payload.default_memo;
      row.updated_at = nowIso();
      return row;
    },
    async deleteById(req, id) {
      const row = templates.find((item) => item.id === parseId(id) && item.user_id === BigInt(req.auth.userId) && item.is_active);
      if (!row) return false;
      row.is_active = false;
      row.updated_at = nowIso();
      return true;
    },
    async listMappings(req, templateId) {
      const userId = BigInt(req.auth.userId);
      const found = templates.find((item) => item.id === parseId(templateId) && item.user_id === userId);
      if (!found) return null;
      const list = templateTags
        .filter((item) => item.template_id === parseId(templateId) && item.user_id === userId)
        .map((item) => ({
          ...item,
          tag: tags.find((t) => t.id === item.tag_id) || null,
        }));
      return { list, page_no: 1, page_size: 20, total_count: list.length };
    },
    async addMapping(req, templateId, tagId) {
      const userId = BigInt(req.auth.userId);
      const template = templates.find((item) => item.id === parseId(templateId) && item.user_id === userId && item.is_active);
      if (!template) return null;
      const tag = tags.find((item) => item.id === parseId(tagId) && item.user_id === userId && item.is_active);
      if (!tag) throw new ValidationError("Invalid request", [{ path: "tag_id", reason: "tag must be active and owned by user" }]);
      if (templateTags.some((item) => item.template_id === template.id && item.tag_id === tag.id && item.user_id === userId)) {
        const err = new Error("duplicate");
        err.code = "P2002";
        throw err;
      }
      templateTagSeq += 1n;
      const row = { id: templateTagSeq, user_id: userId, template_id: template.id, tag_id: tag.id, created_at: nowIso(), tag };
      templateTags.push({ id: row.id, user_id: row.user_id, template_id: row.template_id, tag_id: row.tag_id, created_at: row.created_at });
      return row;
    },
    async removeMapping(req, templateId, tagId) {
      const userId = BigInt(req.auth.userId);
      const template = templates.find((item) => item.id === parseId(templateId) && item.user_id === userId && item.is_active);
      if (!template) return null;
      const idx = templateTags.findIndex((item) => item.template_id === template.id && item.tag_id === parseId(tagId) && item.user_id === userId);
      if (idx < 0) return false;
      templateTags.splice(idx, 1);
      return true;
    },
    async replaceMappings(req, templateId, tagIds) {
      const userId = BigInt(req.auth.userId);
      const template = templates.find((item) => item.id === parseId(templateId) && item.user_id === userId && item.is_active);
      if (!template) return null;
      const parsedTagIds = tagIds.map((id) => parseId(id));
      for (const tagId of parsedTagIds) {
        const found = tags.find((tag) => tag.id === tagId && tag.user_id === userId && tag.is_active);
        if (!found) throw new ValidationError("Invalid request", [{ path: "tag_ids", reason: "all tags must be active and owned by user" }]);
      }
      for (let i = templateTags.length - 1; i >= 0; i -= 1) {
        if (templateTags[i].template_id === template.id && templateTags[i].user_id === userId) {
          templateTags.splice(i, 1);
        }
      }
      for (const tagId of parsedTagIds) {
        templateTagSeq += 1n;
        templateTags.push({ id: templateTagSeq, user_id: userId, template_id: template.id, tag_id: tagId, created_at: nowIso() });
      }
      return templateTags
        .filter((item) => item.template_id === template.id && item.user_id === userId)
        .map((item) => ({ ...item, tag: tags.find((tag) => tag.id === item.tag_id) || null }));
    },
  };

  const transactionStore = {
    async list(req) {
      const userId = BigInt(req.auth.userId);
      const list = transactions
        .filter((row) => row.user_id === userId && row.is_active)
        .map((row) => ({ ...row, tags: listTxTags(row.id) }));
      return { list, page_no: 1, page_size: 20, total_count: list.length };
    },
    async create(req, payload) {
      const userId = BigInt(req.auth.userId);
      let title = payload.title ?? null;
      let memo = payload.memo ?? null;
      let tagIds = payload.tag_ids || [];
      if (payload.template_id !== undefined) {
        const template = templates.find((item) => item.id === parseId(payload.template_id) && item.user_id === userId && item.is_active);
        if (!template) {
          throw new ValidationError("Invalid request", [{ path: "template_id", reason: "must reference an active template owned by user" }]);
        }
        const mapped = templateTags.filter((item) => item.user_id === userId && item.template_id === template.id).map((item) => item.tag_id.toString());
        title = payload.title_provided ? payload.title : template.default_title;
        memo = payload.memo_provided ? payload.memo : template.default_memo;
        tagIds = payload.tag_ids_provided ? payload.tag_ids : mapped;
      }
      txSeq += 1n;
      const row = {
        id: txSeq,
        user_id: userId,
        flow_type: payload.flow_type,
        transaction_date: payload.transaction_date,
        amount: payload.amount,
        currency_code: payload.currency_code,
        title,
        memo,
        is_active: true,
        created_at: nowIso(),
        updated_at: nowIso(),
      };
      transactions.push(row);
      for (const tagId of tagIds) {
        txTags.push({
          id: BigInt(txTags.length + 1000),
          user_id: userId,
          transaction_id: row.id,
          tag_id: parseId(tagId),
          created_at: nowIso(),
        });
      }
      return { ...row, tags: listTxTags(row.id) };
    },
    async findById(req, id) {
      const userId = BigInt(req.auth.userId);
      const row = transactions.find((item) => item.id === parseId(id) && item.user_id === userId);
      if (!row) return null;
      return { ...row, tags: listTxTags(row.id) };
    },
    async updateById(req, id, payload) {
      const userId = BigInt(req.auth.userId);
      const row = transactions.find((item) => item.id === parseId(id) && item.user_id === userId);
      if (!row) return null;
      if (!row.is_active) {
        throw new ValidationError("Invalid request", [{ path: "transaction_id", reason: "inactive transaction cannot be updated" }]);
      }
      if (payload.flow_type !== undefined) row.flow_type = payload.flow_type;
      if (payload.transaction_date !== undefined) row.transaction_date = payload.transaction_date;
      if (payload.amount !== undefined) row.amount = payload.amount;
      if (payload.currency_code !== undefined) row.currency_code = payload.currency_code;
      if (payload.title !== undefined) row.title = payload.title;
      if (payload.memo !== undefined) row.memo = payload.memo;
      if (payload.tag_ids_provided) {
        for (let i = txTags.length - 1; i >= 0; i -= 1) {
          if (txTags[i].transaction_id === row.id && txTags[i].user_id === userId) {
            txTags.splice(i, 1);
          }
        }
        for (const tagId of payload.tag_ids) {
          txTags.push({
            id: BigInt(txTags.length + 1000),
            user_id: userId,
            transaction_id: row.id,
            tag_id: parseId(tagId),
            created_at: nowIso(),
          });
        }
      }
      row.updated_at = nowIso();
      return { ...row, tags: listTxTags(row.id) };
    },
    async deleteById(req, id) {
      const userId = BigInt(req.auth.userId);
      const row = transactions.find((item) => item.id === parseId(id) && item.user_id === userId && item.is_active);
      if (!row) return false;
      row.is_active = false;
      row.updated_at = nowIso();
      return true;
    },
  };

  return {
    accountStore,
    tagStore,
    templateStore,
    transactionStore,
  };
}

test("ticket-110: inactive tag update returns 400", async () => {
  const stores = createFakeStores();
  await request(createApp(stores))
    .delete("/api/tags/11")
    .set("X-Auth-User-Id", "1")
    .set("X-Auth-Provider", "oe");

  const res = await request(createApp(stores))
    .patch("/api/tags/11")
    .set("X-Auth-User-Id", "1")
    .set("X-Auth-Provider", "oe")
    .send({ tag_name: "Food2" });

  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, "VALIDATION_ERROR");
});

test("ticket-120: replace mapping set uses PATCH endpoint", async () => {
  const app = createApp(createFakeStores());
  const res = await request(app)
    .patch("/api/transaction_templates/21/tags")
    .set("X-Auth-User-Id", "1")
    .set("X-Auth-Provider", "oe")
    .send({ tag_ids: ["11", "12"] });

  assert.equal(res.status, 200);
  assert.equal(Array.isArray(res.body.data.list), true);
  assert.equal(res.body.data.list.length, 2);
});

test("ticket-200: create with template_id does not persist template_id field", async () => {
  const app = createApp(createFakeStores());
  const res = await request(app)
    .post("/api/transactions")
    .set("X-Auth-User-Id", "1")
    .set("X-Auth-Provider", "oe")
    .send({
      flow_type: "OUT",
      transaction_date: "2026-02-14",
      amount: "15000.00",
      template_id: "21",
    });

  assert.equal(res.status, 201);
  assert.equal(res.body.data.template_id, undefined);
  assert.equal(res.body.data.title, "Lunch");
});

test("ticket-210: inactive transaction patch returns 400", async () => {
  const app = createApp(createFakeStores());
  const res = await request(app)
    .patch("/api/transactions/1002")
    .set("X-Auth-User-Id", "1")
    .set("X-Auth-Provider", "oe")
    .send({ memo: "should fail" });

  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, "VALIDATION_ERROR");
});

