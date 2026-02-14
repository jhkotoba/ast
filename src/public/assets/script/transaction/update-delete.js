import { showToast } from "/script/common/toast.js";

const AUTH_HEADERS = {
  "X-Auth-User-Id": "1",
  "X-Auth-Provider": "oe",
};

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
      ...AUTH_HEADERS,
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

function normalizeUpdatePayload(row) {
  const payload = {};

  const flowType = String(row.flow_type || "").trim().toUpperCase();
  if (flowType) {
    payload.flow_type = flowType;
  }

  const transactionDate = String(row.transaction_date || "").trim();
  if (transactionDate) {
    payload.transaction_date = transactionDate;
  }

  const amount = String(row.amount || "").trim();
  if (amount) {
    payload.amount = amount;
  }

  const currencyCode = String(row.currency_code || "").trim();
  if (currencyCode) {
    payload.currency_code = currencyCode;
  }

  payload.title = row.title === undefined ? null : row.title;
  payload.memo = row.memo === undefined ? null : row.memo;
  payload.tag_ids = parseTagIds(row.tag_ids);

  return payload;
}

const txGrid = new window.wgrid("transaction", {
  fields: [
    { title: null, element: "checkbox", name: "checked", edit: "checkbox", width: "3%", align: "center" },
    { title: "transaction_id", element: "text", name: "transaction_id", width: "7%" },
    { title: "flow_type", element: "text", name: "flow_type", edit: "text", width: "7%" },
    { title: "transaction_date", element: "text", name: "transaction_date", edit: "text", width: "10%" },
    { title: "amount", element: "text", name: "amount", edit: "text", width: "10%" },
    { title: "currency_code", element: "text", name: "currency_code", edit: "text", width: "8%" },
    { title: "title", element: "text", name: "title", edit: "text", width: "12%" },
    { title: "memo", element: "text", name: "memo", edit: "text", width: "14%" },
    { title: "tag_ids(csv)", element: "text", name: "tag_ids", edit: "text", width: "12%" },
    { title: "is_active", element: "text", name: "is_active", width: "6%" },
    { title: "updated_at", element: "text", name: "updated_at", width: "12%" },
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
  search: async (params = {}) => {
    const paging = params.paging || { pageNo: 1, pageSize: 20, pageBlock: 5 };
    const query = new URLSearchParams({
      page_no: String(paging.pageNo || 1),
      page_size: String(paging.pageSize || 20),
      sort: "transaction_id:desc",
    });
    const response = await apiRequest("GET", `/api/transactions?${query.toString()}`);
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

async function applyChanges() {
  const inserts = txGrid.getInsertData();
  const updates = txGrid.getUpdateData();
  const deletes = txGrid.getDeleteData();

  if (inserts.length > 0) {
    throw new Error("이 페이지에서는 신규 등록을 지원하지 않습니다. 거래등록/목록 페이지를 사용하세요.");
  }

  if (updates.length === 0 && deletes.length === 0) {
    setStatus("변경사항이 없습니다.");
    return;
  }

  if (!window.confirm("수정/삭제를 반영할까요?")) {
    return;
  }

  for (const row of updates) {
    const payload = normalizeUpdatePayload(row);
    await apiRequest("PATCH", `/api/transactions/${row.transaction_id}`, payload);
  }

  for (const row of deletes) {
    await apiRequest("DELETE", `/api/transactions/${row.transaction_id}`);
  }
}

btnEdit.addEventListener("click", () => {
  txGrid.modifyRowCheckedElement("checked");
  setStatus("선택 행을 수정 모드로 전환했습니다.");
});

btnRemove.addEventListener("click", () => {
  if (!window.confirm("선택 행을 삭제 대상으로 표시할까요?")) return;
  txGrid.removeRowCheckedElement("checked");
  setStatus("선택 행을 삭제 대상으로 표시했습니다.");
});

btnCancel.addEventListener("click", () => {
  txGrid.cancelRowCheckedElement("checked");
  setStatus("선택 행 변경을 취소했습니다.");
});

btnApply.addEventListener("click", async () => {
  try {
    await applyChanges();
    await reloadList();
    setStatus("반영 완료");
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

