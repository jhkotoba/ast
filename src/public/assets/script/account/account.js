import { showToast } from "/script/common/toast.js";

const AUTH_HEADERS = {
  "X-Auth-User-Id": "1",
  "X-Auth-Provider": "oe",
};

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
      ...AUTH_HEADERS,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json();
  if (!response.ok) {
    const reason = data && data.error && data.error.message ? data.error.message : `HTTP ${response.status}`;
    throw new Error(reason);
  }
  return data;
}

function toBoolean(value, fallback = true) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  if (typeof value === "boolean") {
    return value;
  }
  const normalized = String(value).trim().toLowerCase();
  return ["1", "true", "y", "yes"].includes(normalized);
}

function toNullableText(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  return String(value);
}

function normalizeWritePayload(row, { requireAccountName, requireBalance }) {
  const accountName = String(row.account_name || "").trim();
  if (requireAccountName && accountName.length === 0) {
    throw new Error("계좌 별칭은 필수입니다.");
  }

  const rawBalance = row.current_balance;
  const currentBalance =
    rawBalance === undefined || rawBalance === null || rawBalance === "" ? null : String(rawBalance).trim();

  if (requireBalance && !currentBalance) {
    throw new Error("현재 잔액은 필수입니다.");
  }

  if (currentBalance && Number.isNaN(Number(currentBalance))) {
    throw new Error("현재 잔액은 숫자여야 합니다.");
  }

  const displayOrderRaw = row.display_order;
  const displayOrder =
    displayOrderRaw === undefined || displayOrderRaw === null || displayOrderRaw === ""
      ? 0
      : Number.parseInt(displayOrderRaw, 10);

  if (!Number.isFinite(displayOrder)) {
    throw new Error("정렬 순서는 정수여야 합니다.");
  }

  const payload = {
    account_name: accountName,
    account_type: String(row.account_type || "ETC").trim() || "ETC",
    institution_name: toNullableText(row.institution_name),
    account_no_masked: toNullableText(row.account_no_masked),
    currency_code: String(row.currency_code || "KRW").trim() || "KRW",
    current_balance: currentBalance,
    display_order: displayOrder,
    is_active: toBoolean(row.is_active, true),
  };

  if (row.balance_updated_at !== undefined && row.balance_updated_at !== null && row.balance_updated_at !== "") {
    payload.balance_updated_at = row.balance_updated_at;
  }

  return payload;
}

const account = new window.wgrid("account", {
  fields: [
    { title: null, element: "checkbox", name: "checked", edit: "checkbox", width: "3%", align: "center" },
    { title: "계좌 별칭", element: "text", name: "account_name", edit: "text", width: "14%" },
    { title: "유형", element: "text", name: "account_type", edit: "text", width: "10%" },
    { title: "기관명", element: "text", name: "institution_name", edit: "text", width: "12%" },
    { title: "마스킹 번호", element: "text", name: "account_no_masked", edit: "text", width: "10%" },
    { title: "통화코드", element: "text", name: "currency_code", edit: "text", width: "8%" },
    { title: "현재 잔액", element: "text", name: "current_balance", edit: "text", width: "10%" },
    { title: "잔액 업데이트 시각", element: "text", name: "balance_updated_at", edit: "text", width: "12%" },
    { title: "정렬 순서", element: "text", name: "display_order", edit: "text", width: "8%" },
    {
      title: "사용여부",
      element: "text",
      name: "is_active",
      edit: "select",
      width: "8%",
      data: {
        mapping: { true: "true", false: "false" },
        select: {
          list: [
            { value: "true", text: "true" },
            { value: "false", text: "false" },
          ],
        },
      },
    },
    { title: "등록일시", element: "text", name: "created_at", width: "12%" },
    { title: "수정일시", element: "text", name: "updated_at", width: "12%" },
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
      account_type: "ETC",
      currency_code: "KRW",
      display_order: 0,
      is_active: "true",
    },
  },
  search: async (params = {}) => {
    const paging = params.paging || { pageNo: 1, pageSize: 20, pageBlock: 5 };
    const query = new URLSearchParams({
      page_no: String(paging.pageNo || 1),
      page_size: String(paging.pageSize || 20),
      sort: "account_id:desc",
    });

    const response = await apiRequest("GET", `/api/accounts?${query.toString()}`);
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
  const result = await account.search();
  account.setData(result.list, result.param);
}

async function applyChanges() {
  const inserts = account.getInsertData();
  const updates = account.getUpdateData();
  const deletes = account.getDeleteData();

  if (inserts.length === 0 && updates.length === 0 && deletes.length === 0) {
    setStatus("변경사항이 없습니다.");
    return;
  }

  if (!window.confirm("변경사항을 반영할까요?")) {
    return;
  }

  try {
    for (const row of inserts) {
      const payload = normalizeWritePayload(row, { requireAccountName: true, requireBalance: true });
      await apiRequest("POST", "/api/accounts", payload);
    }

    for (const row of updates) {
      const payload = normalizeWritePayload(row, { requireAccountName: false, requireBalance: false });
      await apiRequest("PATCH", `/api/accounts/${row.account_id}`, payload);
    }

    for (const row of deletes) {
      await apiRequest("DELETE", `/api/accounts/${row.account_id}`);
    }

    await reloadList();
    setStatus(`반영 완료: 추가 ${inserts.length}, 수정 ${updates.length}, 삭제 ${deletes.length}`);
  } catch (error) {
    setStatus(error.message || "반영 실패", true);
  }
}

btnAdd.addEventListener("click", () => {
  account.prependRow();
  setStatus("행을 추가했습니다.");
});

btnEdit.addEventListener("click", () => {
  account.modifyRowCheckedElement("checked");
  setStatus("선택 행을 수정 모드로 전환했습니다.");
});

btnRemove.addEventListener("click", () => {
  if (!window.confirm("선택 행을 삭제 대상으로 표시할까요?")) {
    return;
  }
  account.removeRowCheckedElement("checked");
  setStatus("선택 행을 삭제 대상으로 표시했습니다.");
});

btnCancel.addEventListener("click", () => {
  account.cancelRowCheckedElement("checked");
  setStatus("선택 행 변경을 취소했습니다.");
});

btnApply.addEventListener("click", () => {
  applyChanges();
});

window.addEventListener("DOMContentLoaded", async () => {
  try {
    await reloadList();
    setStatus("조회 완료");
  } catch (error) {
    setStatus(error.message || "조회 실패", true);
  }
});
