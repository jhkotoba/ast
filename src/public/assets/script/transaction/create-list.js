import { showToast } from "/ast/script/common/toast.js";

const btnAdd = document.getElementById("btnAdd");
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

function parseTagIds(value) {
  const text = String(value || "").trim();
  if (!text) {
    return [];
  }
  return text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeCreatePayload(row) {
  const flowType = String(row.flow_type || "").trim().toUpperCase();
  if (!["IN", "OUT"].includes(flowType)) {
    throw new Error("flow_type은 IN 또는 OUT 이어야 합니다.");
  }

  const transactionDate = String(row.transaction_date || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(transactionDate)) {
    throw new Error("transaction_date는 YYYY-MM-DD 형식이어야 합니다.");
  }

  const amount = String(row.amount || "").trim();
  if (!amount || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
    throw new Error("amount는 0보다 큰 숫자여야 합니다.");
  }

  const payload = {
    flow_type: flowType,
    transaction_date: transactionDate,
    amount,
    currency_code: String(row.currency_code || "KRW").trim() || "KRW",
  };

  if (row.title !== undefined && row.title !== null && String(row.title).trim() !== "") {
    payload.title = String(row.title);
  }
  if (row.memo !== undefined && row.memo !== null && String(row.memo).trim() !== "") {
    payload.memo = String(row.memo);
  }
  if (row.template_id !== undefined && row.template_id !== null && String(row.template_id).trim() !== "") {
    payload.template_id = String(row.template_id).trim();
  }
  const tagIds = parseTagIds(row.tag_ids);
  if (tagIds.length > 0 || String(row.tag_ids || "").trim() === "") {
    payload.tag_ids = tagIds;
  }

  return payload;
}

const txGrid = new window.wgrid("transaction", {
  fields: [
    { title: null, element: "checkbox", name: "checked", edit: "checkbox", width: "3%", align: "center" },
    { title: "transaction_id", element: "text", name: "transaction_id", width: "7%" },
    { title: "flow_type", element: "text", name: "flow_type", edit: "text", width: "6%" },
    { title: "transaction_date", element: "text", name: "transaction_date", edit: "text", width: "10%" },
    { title: "amount", element: "text", name: "amount", edit: "text", width: "10%" },
    { title: "currency_code", element: "text", name: "currency_code", edit: "text", width: "8%" },
    { title: "title", element: "text", name: "title", edit: "text", width: "12%" },
    { title: "memo", element: "text", name: "memo", edit: "text", width: "14%" },
    { title: "template_id", element: "text", name: "template_id", edit: "text", width: "8%" },
    { title: "tag_ids(csv)", element: "text", name: "tag_ids", edit: "text", width: "12%" },
    { title: "is_active", element: "text", name: "is_active", width: "6%" },
    { title: "created_at", element: "text", name: "created_at", width: "12%" },
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
      flow_type: "OUT",
      transaction_date: new Date().toISOString().slice(0, 10),
      currency_code: "KRW",
      tag_ids: "",
      is_active: "true",
    },
  },
  search: async (params = {}) => {
    const paging = params.paging || { pageNo: 1, pageSize: 20, pageBlock: 5 };
    const query = new URLSearchParams({
      page_no: String(paging.pageNo || 1),
      page_size: String(paging.pageSize || 20),
      sort: "transaction_id:desc",
    });
    const response = await apiRequest("GET", `/ast-api/transactions?${query.toString()}`);
    const list = (response.data.list || []).map((item) => ({
      ...item,
      checked: false,
      tag_ids: Array.isArray(item.tag_ids) ? item.tag_ids.join(",") : "",
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
  const result = await txGrid.search();
  txGrid.setData(result.list, result.param);
}

async function applyCreates() {
  const inserts = txGrid.getInsertData();
  const updates = txGrid.getUpdateData();
  const deletes = txGrid.getDeleteData();

  if (updates.length > 0 || deletes.length > 0) {
    throw new Error("이 페이지에서는 수정/삭제를 지원하지 않습니다. 거래수정/삭제 페이지를 사용하세요.");
  }

  if (inserts.length === 0) {
    setStatus("신규 등록할 행이 없습니다.");
    return;
  }

  if (!window.confirm("신규 거래를 등록할까요?")) {
    return;
  }

  for (const row of inserts) {
    const payload = normalizeCreatePayload(row);
    await apiRequest("POST", "/ast-api/transactions", payload);
  }
}

btnAdd.addEventListener("click", () => {
  txGrid.prependRow();
  setStatus("행을 추가했습니다.");
});

btnCancel.addEventListener("click", () => {
  txGrid.cancelRowCheckedElement("checked");
  setStatus("선택 행 변경을 취소했습니다.");
});

btnApply.addEventListener("click", async () => {
  try {
    await applyCreates();
    await reloadList();
    setStatus("신규 등록 반영 완료");
  } catch (error) {
    setStatus(error.message || "반영 실패", true);
  }
});

window.addEventListener("DOMContentLoaded", async () => {
  try {
    await reloadList();
    setStatus("조회 완료");
  } catch (error) {
    setStatus(error.message || "조회 실패", true);
  }
});
