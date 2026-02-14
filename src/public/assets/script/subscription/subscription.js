import { showToast } from "/ast/script/common/toast.js";

const btnAdd = document.getElementById("btnAdd");
const btnEdit = document.getElementById("btnEdit");
const btnRemove = document.getElementById("btnRemove");
const btnCancel = document.getElementById("btnCancel");
const btnApply = document.getElementById("btnApply");

function setStatus(message, isError = false) {
  showToast(message, { type: isError ? "error" : "success" });
}

async function apiRequest(method, url, body) {
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json();
  if (!response.ok) {
    const message = data && data.error && data.error.message ? data.error.message : `HTTP ${response.status}`;
    throw new Error(message);
  }
  return data;
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeOptionalText(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  return String(value);
}

function parseAmount(value, required) {
  const normalized = String(value || "").trim();
  if (!normalized) {
    if (required) {
      throw new Error("amount is required");
    }
    return undefined;
  }
  if (Number.isNaN(Number(normalized)) || Number(normalized) <= 0) {
    throw new Error("amount must be greater than 0");
  }
  return normalized;
}

function parseIntField(value, { required, min, max, name }) {
  const normalized = String(value || "").trim();
  if (!normalized) {
    if (required) {
      throw new Error(`${name} is required`);
    }
    return undefined;
  }

  const parsed = Number.parseInt(normalized, 10);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${name} must be an integer`);
  }
  if (min !== undefined && parsed < min) {
    throw new Error(`${name} must be >= ${min}`);
  }
  if (max !== undefined && parsed > max) {
    throw new Error(`${name} must be <= ${max}`);
  }
  return parsed;
}

function parseDateOnly(value, { required, name }) {
  const normalized = String(value || "").trim();
  if (!normalized) {
    if (required) {
      throw new Error(`${name} is required`);
    }
    return null;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new Error(`${name} must be YYYY-MM-DD`);
  }
  return normalized;
}

function normalizeWritePayload(row, { requireName }) {
  const subscriptionName = normalizeText(row.subscription_name);
  if (requireName && !subscriptionName) {
    throw new Error("subscription_name is required");
  }

  const billingPeriod = normalizeText(row.billing_period || "MONTHLY").toUpperCase();
  if (!["MONTHLY", "YEARLY"].includes(billingPeriod)) {
    throw new Error("billing_period must be MONTHLY or YEARLY");
  }

  const billingDay = parseIntField(row.billing_day, {
    required: true,
    min: 1,
    max: 31,
    name: "billing_day",
  });
  const amount = parseAmount(row.amount, true);
  const startDate = parseDateOnly(row.start_date, { required: true, name: "start_date" });
  const endDate = parseDateOnly(row.end_date, { required: false, name: "end_date" });

  if (endDate && startDate && endDate < startDate) {
    throw new Error("end_date must be greater than or equal to start_date");
  }

  return {
    subscription_name: subscriptionName,
    billing_period: billingPeriod,
    billing_day: billingDay,
    amount,
    currency_code: normalizeText(row.currency_code || "KRW") || "KRW",
    start_date: startDate,
    end_date: endDate,
    memo: normalizeOptionalText(row.memo),
  };
}

const subscriptionGrid = new window.wgrid("subscription", {
  fields: [
    { title: null, element: "checkbox", name: "checked", edit: "checkbox", width: "4%", align: "center" },
    { title: "ID", element: "text", name: "subscription_id", width: "6%" },
    { title: "name", element: "text", name: "subscription_name", edit: "text", width: "16%" },
    {
      title: "period",
      element: "text",
      name: "billing_period",
      edit: "select",
      width: "10%",
      data: {
        mapping: { MONTHLY: "MONTHLY", YEARLY: "YEARLY" },
        select: {
          list: [
            { value: "MONTHLY", text: "MONTHLY" },
            { value: "YEARLY", text: "YEARLY" },
          ],
        },
      },
    },
    { title: "day", element: "text", name: "billing_day", edit: "text", width: "6%" },
    { title: "amount", element: "text", name: "amount", edit: "text", width: "10%" },
    { title: "currency", element: "text", name: "currency_code", edit: "text", width: "8%" },
    { title: "start_date", element: "text", name: "start_date", edit: "text", width: "10%" },
    { title: "end_date", element: "text", name: "end_date", edit: "text", width: "10%" },
    { title: "memo", element: "text", name: "memo", edit: "text", width: "14%" },
    { title: "active", element: "text", name: "is_active", width: "6%" },
  ],
  option: {
    isPaging: true,
    pagingMode: "server",
    style: {
      height: 560,
      overflow: { y: "auto", x: "auto" },
      row: { cursor: "default" },
    },
  },
  data: {
    insert: {
      checked: false,
      billing_period: "MONTHLY",
      billing_day: 1,
      currency_code: "KRW",
      is_active: "true",
    },
  },
  search: async (params = {}) => {
    const paging = params.paging || { pageNo: 1, pageSize: 20, pageBlock: 5 };
    const query = new URLSearchParams({
      page_no: String(paging.pageNo || 1),
      page_size: String(paging.pageSize || 20),
      sort: "subscription_id:desc",
    });

    const response = await apiRequest("GET", `/ast-api/subscriptions?${query.toString()}`);
    const list = (response.data.list || []).map((item) => ({
      ...item,
      checked: false,
      is_active: String(item.is_active),
    }));

    return {
      list,
      param: {
        paging: {
          pageNo: response.data.page_no,
          pageSize: response.data.page_size,
          pageBlock: paging.pageBlock || 5,
          totalCount: response.data.total_count,
        },
      },
    };
  },
});

async function reloadList() {
  const result = await subscriptionGrid.search();
  subscriptionGrid.setData(result.list, result.param);
}

async function applyChanges() {
  const inserts = subscriptionGrid.getInsertData();
  const updates = subscriptionGrid.getUpdateData();
  const deletes = subscriptionGrid.getDeleteData();

  if (inserts.length === 0 && updates.length === 0 && deletes.length === 0) {
    setStatus("No changes.");
    return;
  }

  if (!window.confirm("Apply changes?")) {
    return;
  }

  try {
    for (const row of inserts) {
      const payload = normalizeWritePayload(row, { requireName: true });
      await apiRequest("POST", "/ast-api/subscriptions", payload);
    }

    for (const row of updates) {
      const payload = normalizeWritePayload(row, { requireName: false });
      await apiRequest("PATCH", `/ast-api/subscriptions/${row.subscription_id}`, payload);
    }

    for (const row of deletes) {
      await apiRequest("DELETE", `/ast-api/subscriptions/${row.subscription_id}`);
    }

    await reloadList();
    setStatus(`Applied: create ${inserts.length}, update ${updates.length}, delete ${deletes.length}`);
  } catch (error) {
    setStatus(error.message || "Apply failed", true);
  }
}

btnAdd.addEventListener("click", () => {
  subscriptionGrid.prependRow();
  setStatus("Added.");
});

btnEdit.addEventListener("click", () => {
  subscriptionGrid.modifyRowCheckedElement("checked");
  setStatus("Edit mode.");
});

btnRemove.addEventListener("click", () => {
  if (!window.confirm("Mark selected rows for delete?")) {
    return;
  }
  subscriptionGrid.removeRowCheckedElement("checked");
  setStatus("Marked for delete.");
});

btnCancel.addEventListener("click", () => {
  subscriptionGrid.cancelRowCheckedElement("checked");
  setStatus("Selection canceled.");
});

btnApply.addEventListener("click", applyChanges);

window.addEventListener("DOMContentLoaded", async () => {
  try {
    await reloadList();
    setStatus("Loaded.");
  } catch (error) {
    setStatus(error.message || "Load failed", true);
  }
});
